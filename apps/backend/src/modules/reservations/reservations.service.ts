import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { ClubsService } from "../clubs/clubs.service";
import { ResourcesService } from "../resources/resources.service";
import { CoachesService } from "../coaching/services/coaches.service";
import { TrainingClassesService } from "../coaching/services/classes.service";
import type {
  CreateCourtDto,
  CreateReservationDto,
  CreateSessionDto,
} from "./dto/reservation.dto";
import { Court, type CourtDocument } from "./schemas/court.schema";
import {
  Reservation,
  type ReservationDocument,
} from "./schemas/reservation.schema";
import {
  ReservableSession,
  type ReservableSessionDocument,
} from "./schemas/reservable-session.schema";
import { calculateRefund } from "./refund-policy";

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Court.name) private readonly courts: Model<CourtDocument>,
    @InjectModel(ReservableSession.name)
    private readonly sessions: Model<ReservableSessionDocument>,
    @InjectModel(Reservation.name)
    private readonly reservations: Model<ReservationDocument>,
    private readonly clubs: ClubsService,
    private readonly resources: ResourcesService,
    private readonly coaches: CoachesService,
    private readonly trainingClasses: TrainingClassesService,
  ) {}

  async listCourts(ownerId: string, clubId: string) {
    await this.clubs.get(ownerId, clubId);
    const items = await this.courts
      .find({ clubId: oid(clubId) })
      .sort({ createdAt: -1 })
      .exec();
    return { items: items.map(publicCourt) };
  }

  async createCourt(ownerId: string, clubId: string, input: CreateCourtDto) {
    await this.clubs.get(ownerId, clubId);
    if (input.courtTypeId)
      await this.resources.requireActive(
        "sports",
        "court-type",
        input.courtTypeId,
      );
    const court = await this.courts.create({
      clubId: oid(clubId),
      name: input.name.trim(),
      courtTypeId: input.courtTypeId ? oid(input.courtTypeId) : undefined,
      description: input.description?.trim() ?? "",
      capacity: input.capacity,
      isReservable: input.isReservable ?? true,
    });
    return publicCourt(court);
  }

  async listBusinessSessions(ownerId: string, clubId: string) {
    await this.clubs.get(ownerId, clubId);
    return this.listSessionsByClub(clubId, false);
  }

  async listPublicSessions(clubId: string) {
    await this.clubs.getPublic(clubId);
    return this.listSessionsByClub(clubId, true);
  }

  async createSession(
    ownerId: string,
    clubId: string,
    input: CreateSessionDto,
  ) {
    const club = await this.clubs.get(ownerId, clubId);
    if (input.courtId) {
      const court = await this.courts.findOne({
        _id: oid(input.courtId),
        clubId: oid(clubId),
        status: "active",
        isReservable: true,
      });
      if (!court)
        throw new AppError(
          400,
          "COURT_NOT_RESERVABLE",
          "Court is not reservable",
        );
    }
    if (input.coachId) {
      const coach = await this.coaches.requireCoach(input.coachId);
      if (coach.reviewStatus !== "approved" || coach.visibility !== "public") {
        throw new AppError(
          400,
          "COACH_NOT_AVAILABLE",
          "Coach is not approved and public",
        );
      }
    }
    if (input.classId) {
      await this.trainingClasses.requirePublishedForClub(input.classId, clubId);
    }
    const options = input.options ?? [];
    if (
      new Set(options.map((option) => `${option.type}:${option.resourceId}`))
        .size !== options.length
    ) {
      throw new AppError(
        400,
        "DUPLICATE_SESSION_OPTION",
        "Duplicate session option",
      );
    }
    for (const option of options) {
      const available =
        option.type === "equipment"
          ? club.equipment.some(
              (item) => item.equipmentId === option.resourceId,
            )
          : club.amenities.some((item) => item.amenityId === option.resourceId);
      if (!available)
        throw new AppError(
          400,
          "SESSION_OPTION_NOT_IN_CLUB",
          "Session option is not available in this club",
        );
    }
    const session = await this.sessions.create({
      clubId: oid(clubId),
      title: input.title.trim(),
      courtId: input.courtId ? oid(input.courtId) : undefined,
      coachId: input.coachId ? oid(input.coachId) : undefined,
      classId: input.classId ? oid(input.classId) : undefined,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      capacity: input.capacity,
      basePrice: input.basePrice,
      options: options.map((option) => ({
        ...option,
        resourceId: oid(option.resourceId),
        reservedQuantity: 0,
      })),
      cancellationPolicy: {
        title: input.cancellationPolicy.title.trim(),
        tiers: [...input.cancellationPolicy.tiers].sort(
          (a, b) => b.hoursBefore - a.hoursBefore,
        ),
      },
      status: "active",
    });
    return publicSession(session);
  }

  async reserve(userId: string, input: CreateReservationDto) {
    const session = await this.sessions
      .findOne({
        _id: oid(input.sessionId),
        status: "active",
        startsAt: { $gt: new Date() },
      })
      .exec();
    if (!session)
      throw new AppError(
        404,
        "SESSION_NOT_FOUND",
        "Reservable session not found",
      );
    const selections = input.options ?? [];
    if (
      new Set(selections.map((item) => item.optionId)).size !==
      selections.length
    )
      throw new AppError(
        400,
        "DUPLICATE_RESERVATION_OPTION",
        "Duplicate option",
      );
    const selected = selections.map((selection) => {
      const option = session.options.find(
        (item) => String(item._id) === selection.optionId,
      );
      if (!option || selection.quantity > option.maxPerReservation)
        throw new AppError(
          400,
          "RESERVATION_OPTION_INVALID",
          "Invalid reservation option",
        );
      return {
        optionId: option._id,
        type: option.type,
        resourceId: option.resourceId,
        quantity: selection.quantity,
        unitPrice: option.unitPrice,
        availableQuantity: option.availableQuantity,
      };
    });
    const filter: Record<string, unknown> = {
      _id: session._id,
      status: "active",
      startsAt: { $gt: new Date() },
      reservedCount: { $lte: session.capacity - input.participantCount },
    };
    if (selected.length)
      filter.options = {
        $all: selected.map((item) => ({
          $elemMatch: {
            _id: item.optionId,
            reservedQuantity: { $lte: item.availableQuantity - item.quantity },
          },
        })),
      };
    const increments: Record<string, number> = {
      reservedCount: input.participantCount,
    };
    selected.forEach((item, index) => {
      increments[`options.$[option${index}].reservedQuantity`] = item.quantity;
    });
    const updated = await this.sessions
      .findOneAndUpdate(
        filter,
        { $inc: increments },
        {
          new: true,
          arrayFilters: selected.map((item, index) => ({
            [`option${index}._id`]: item.optionId,
          })),
        },
      )
      .exec();
    if (!updated)
      throw new AppError(
        409,
        "SESSION_CAPACITY_UNAVAILABLE",
        "Session capacity or selected option is unavailable",
      );
    const totalPrice =
      session.basePrice * input.participantCount +
      selected.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    try {
      const reservation = await this.reservations.create({
        clubId: session.clubId,
        sessionId: session._id,
        userId: oid(userId),
        sessionTitle: session.title,
        sessionStartsAt: session.startsAt,
        sessionEndsAt: session.endsAt,
        participantCount: input.participantCount,
        selectedOptions: selected,
        totalPrice,
        cancellationPolicy: session.cancellationPolicy,
        status: "reserved",
      });
      return publicReservation(reservation);
    } catch (error) {
      await this.releaseInventory(
        session._id,
        input.participantCount,
        selected,
      );
      if (duplicate(error))
        throw new AppError(
          409,
          "RESERVATION_EXISTS",
          "An active reservation already exists",
        );
      throw error;
    }
  }

  async listMine(userId: string) {
    const items = await this.reservations
      .find({ userId: oid(userId) })
      .sort({ createdAt: -1 })
      .exec();
    return { items: items.map(publicReservation) };
  }

  async cancel(userId: string, reservationId: string) {
    const reservation = await this.reservations
      .findOne({
        _id: oid(reservationId),
        userId: oid(userId),
        status: "reserved",
      })
      .exec();
    if (!reservation)
      throw new AppError(
        404,
        "RESERVATION_NOT_FOUND",
        "Active reservation not found",
      );
    const session = await this.sessions.findById(reservation.sessionId).exec();
    if (!session)
      throw new AppError(404, "SESSION_NOT_FOUND", "Session not found");
    const cancelledAt = new Date();
    const refund = calculateRefund(
      reservation.totalPrice,
      session.startsAt,
      cancelledAt,
      reservation.cancellationPolicy.tiers,
    );
    const cancelled = await this.reservations
      .findOneAndUpdate(
        {
          _id: reservation._id,
          userId: oid(userId),
          status: "reserved",
        },
        {
          $set: {
            status: "cancelled",
            cancelledAt,
            refundPercent: refund.refundPercent,
            refundAmount: refund.refundAmount,
          },
        },
        { new: true },
      )
      .exec();
    if (!cancelled) {
      throw new AppError(
        409,
        "RESERVATION_ALREADY_CANCELLED",
        "Reservation was already cancelled",
      );
    }
    await this.releaseInventory(
      session._id,
      cancelled.participantCount,
      cancelled.selectedOptions,
    );
    return publicReservation(cancelled);
  }

  private async listSessionsByClub(clubId: string, publicOnly: boolean) {
    const filter: Record<string, unknown> = { clubId: oid(clubId) };
    if (publicOnly)
      Object.assign(filter, {
        status: "active",
        startsAt: { $gt: new Date() },
      });
    const items = await this.sessions.find(filter).sort({ startsAt: 1 }).exec();
    return { items: items.map(publicSession) };
  }

  private async releaseInventory(
    sessionId: Types.ObjectId,
    participants: number,
    selected: Array<{ optionId: Types.ObjectId; quantity: number }>,
  ) {
    const increments: Record<string, number> = { reservedCount: -participants };
    selected.forEach((item, index) => {
      increments[`options.$[option${index}].reservedQuantity`] = -item.quantity;
    });
    await this.sessions
      .updateOne(
        { _id: sessionId },
        { $inc: increments },
        {
          arrayFilters: selected.map((item, index) => ({
            [`option${index}._id`]: item.optionId,
          })),
        },
      )
      .exec();
  }
}

function oid(id: string, code = "INVALID_OBJECT_ID"): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw new AppError(400, code, "Invalid id");
  return new Types.ObjectId(id);
}
function publicCourt(value: CourtDocument) {
  return {
    id: String(value._id),
    clubId: String(value.clubId),
    name: value.name,
    courtTypeId: value.courtTypeId ? String(value.courtTypeId) : undefined,
    description: value.description,
    capacity: value.capacity,
    isReservable: value.isReservable,
    status: value.status,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
  };
}
function publicSession(value: ReservableSessionDocument) {
  return {
    id: String(value._id),
    clubId: String(value.clubId),
    courtId: value.courtId ? String(value.courtId) : undefined,
    coachId: value.coachId ? String(value.coachId) : undefined,
    classId: value.classId ? String(value.classId) : undefined,
    title: value.title,
    startsAt: value.startsAt.toISOString(),
    endsAt: value.endsAt.toISOString(),
    capacity: value.capacity,
    reservedCount: value.reservedCount,
    basePrice: value.basePrice,
    options: value.options.map((item) => ({
      id: String(item._id),
      type: item.type,
      resourceId: String(item.resourceId),
      title: item.title,
      availableQuantity: item.availableQuantity,
      reservedQuantity: item.reservedQuantity,
      maxPerReservation: item.maxPerReservation,
      unitPrice: item.unitPrice,
    })),
    cancellationPolicy: value.cancellationPolicy,
    status: value.status,
  };
}
function publicReservation(value: ReservationDocument) {
  return {
    id: String(value._id),
    clubId: String(value.clubId),
    sessionId: String(value.sessionId),
    userId: String(value.userId),
    sessionTitle: value.sessionTitle,
    sessionStartsAt: value.sessionStartsAt.toISOString(),
    sessionEndsAt: value.sessionEndsAt.toISOString(),
    participantCount: value.participantCount,
    selectedOptions: value.selectedOptions.map((item) => ({
      optionId: String(item.optionId),
      type: item.type,
      resourceId: String(item.resourceId),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    totalPrice: value.totalPrice,
    cancellationPolicy: value.cancellationPolicy,
    refundPercent: value.refundPercent,
    refundAmount: value.refundAmount,
    status: value.status,
    createdAt: value.createdAt.toISOString(),
    cancelledAt: value.cancelledAt?.toISOString() ?? null,
  };
}
function duplicate(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}
