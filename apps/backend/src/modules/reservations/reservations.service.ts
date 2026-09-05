import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { ClubsService } from "../clubs/clubs.service";
import { ResourcesService } from "../resources/resources.service";
import { CoachesService } from "../coaching/services/coaches.service";
import { TrainingClassesService } from "../coaching/services/classes.service";
import { SessionsService as CoachSessionsService } from "../coaching/services/sessions.service";
import { MediaService } from "../media/media.service";
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
import { NotificationsService } from "../notifications/notifications.service";
import { CommerceService } from "../commerce/commerce.service";
import { EntitlementsService } from "../commerce/entitlements.service";

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
    private readonly coachSessions: CoachSessionsService,
    private readonly media: MediaService,
    private readonly notifications: NotificationsService,
    private readonly commerce: CommerceService,
    private readonly entitlements: EntitlementsService,
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
    await Promise.all(
      input.sportIds.map((id) =>
        this.resources.requireActive("sports", "sport", id),
      ),
    );
    if (input.surfaceTypeId) {
      await this.resources.requireActive(
        "sports",
        "surface-type",
        input.surfaceTypeId,
      );
    }
    await this.media.assertOwnedReady(ownerId, input.galleryMediaIds);
    const court = await this.courts.create({
      clubId: oid(clubId),
      name: input.name.trim(),
      normalizedName: normalize(input.name),
      code: input.code?.trim(),
      courtTypeId: input.courtTypeId ? oid(input.courtTypeId) : undefined,
      sportIds: input.sportIds.map((id) => oid(id)),
      description: input.description?.trim() ?? "",
      capacity: input.capacity,
      environment: input.environment,
      surfaceTypeId: input.surfaceTypeId ? oid(input.surfaceTypeId) : undefined,
      lengthMeters: input.lengthMeters,
      widthMeters: input.widthMeters,
      locationLabel: input.locationLabel?.trim(),
      floor: input.floor?.trim(),
      galleryMediaIds: input.galleryMediaIds.map((id) => oid(id)),
      isReservable: input.isReservable ?? true,
      minimumReservationMinutes: input.minimumReservationMinutes,
      maximumReservationMinutes: input.maximumReservationMinutes,
      preparationMinutes: input.preparationMinutes,
      cleanupMinutes: input.cleanupMinutes,
    });
    return publicCourt(court);
  }

  async listBusinessSessions(ownerId: string, clubId: string) {
    await this.clubs.get(ownerId, clubId);
    return this.listSessionsByClub(clubId, false);
  }

  async listClubReservations(ownerId: string, clubId: string) {
    await this.clubs.get(ownerId, clubId);
    const items = await this.reservations
      .find({ clubId: oid(clubId) })
      .sort({ sessionStartsAt: -1, createdAt: -1 })
      .limit(2000)
      .exec();
    return { items: items.map(publicReservation) };
  }

  async markNoShow(ownerId: string, clubId: string, reservationId: string) {
    await this.clubs.get(ownerId, clubId);
    const reservation = await this.reservations
      .findOne({
        _id: oid(reservationId),
        clubId: oid(clubId),
        status: "reserved",
        sessionStartsAt: { $lte: new Date() },
      })
      .exec();
    if (!reservation) {
      throw new AppError(
        409,
        "RESERVATION_NOT_MARKABLE_NO_SHOW",
        "Only a started active reservation can be marked as no-show",
      );
    }
    const refundPercent =
      reservation.cancellationPolicy.noShowRefundPercent ?? 0;
    const updated = await this.reservations
      .findOneAndUpdate(
        { _id: reservation._id, status: "reserved" },
        {
          $set: {
            status: "no_show",
            refundPercent,
            refundAmount: Math.floor(
              (reservation.totalPrice * refundPercent) / 100,
            ),
            ...(reservation.paymentStatus === "paid" && refundPercent > 0
              ? { paymentStatus: "refunded" }
              : {}),
          },
        },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new AppError(
        409,
        "RESERVATION_STATUS_CHANGED",
        "Reservation status changed before this action completed",
      );
    }
    const refundAmount = updated.refundAmount ?? 0;
    if (reservation.paymentStatus === "paid" && refundAmount > 0) {
      await this.commerce.refundReservation(
        updated._id,
        refundAmount,
        "reservation_no_show_refund",
      );
    }
    if (refundPercent === 100) {
      await this.entitlements.finalizeReservation(updated._id, false);
    }
    return publicReservation(updated);
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
    assertClubScheduleAllows(club, input.startsAt, input.endsAt);
    let court: CourtDocument | null = null;
    if (input.courtId) {
      court = await this.courts.findOne({
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
      const durationMinutes =
        (new Date(input.endsAt).getTime() -
          new Date(input.startsAt).getTime()) /
        60_000;
      if (input.capacity > court.capacity) {
        throw new AppError(
          400,
          "SESSION_EXCEEDS_COURT_CAPACITY",
          "Session capacity exceeds court capacity",
        );
      }
      if (
        durationMinutes < court.minimumReservationMinutes ||
        durationMinutes > court.maximumReservationMinutes
      ) {
        throw new AppError(
          400,
          "SESSION_DURATION_INVALID",
          "Session duration is outside court limits",
        );
      }
      const blockedStart = new Date(
        new Date(input.startsAt).getTime() - court.preparationMinutes * 60_000,
      );
      const blockedEnd = new Date(
        new Date(input.endsAt).getTime() + court.cleanupMinutes * 60_000,
      );
      const overlap = await this.sessions.exists({
        clubId: oid(clubId),
        courtId: court._id,
        status: "active",
        startsAt: { $lt: blockedEnd },
        endsAt: { $gt: blockedStart },
      });
      if (overlap) {
        throw new AppError(
          409,
          "COURT_SESSION_OVERLAP",
          "Court already has an overlapping session",
        );
      }
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
      await this.coachSessions.assertNoConflict(
        [coach._id],
        new Date(input.startsAt),
        new Date(input.endsAt),
      );
      const overlap = await this.sessions.exists({
        clubId: oid(clubId),
        coachId: coach._id,
        status: "active",
        startsAt: { $lt: new Date(input.endsAt) },
        endsAt: { $gt: new Date(input.startsAt) },
      });
      if (overlap) {
        throw new AppError(
          409,
          "COACH_SCHEDULE_CONFLICT",
          "Coach already has another club session in this time range",
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
      const resource =
        option.type === "equipment"
          ? club.equipment.find(
              (item) => item.equipmentId === option.resourceId,
            )
          : club.amenities.find((item) => item.amenityId === option.resourceId);
      if (!resource)
        throw new AppError(
          400,
          "SESSION_OPTION_NOT_IN_CLUB",
          "Session option is not available in this club",
        );
      if (
        (option.type === "equipment" &&
          (resource as (typeof club.equipment)[number]).status !==
            "available") ||
        (option.type === "amenity" &&
          (resource as (typeof club.amenities)[number]).availability ===
            "unavailable")
      ) {
        throw new AppError(
          400,
          "SESSION_OPTION_UNAVAILABLE",
          "Session option is currently unavailable",
        );
      }
      const allowedQuantity =
        option.type === "equipment"
          ? (resource as (typeof club.equipment)[number]).reservableQuantity
          : ((resource as (typeof club.amenities)[number]).quantity ?? 0);
      if (option.availableQuantity > allowedQuantity) {
        throw new AppError(
          400,
          "SESSION_OPTION_INVENTORY_EXCEEDED",
          "Session option inventory exceeds club inventory",
        );
      }
    }
    const selectedPolicy = input.cancellationPolicy.id
      ? club.cancellationRules.find(
          (policy) =>
            policy.id === input.cancellationPolicy.id && policy.isActive,
        )
      : undefined;
    if (input.cancellationPolicy.id && !selectedPolicy) {
      throw new AppError(
        400,
        "CANCELLATION_POLICY_NOT_FOUND",
        "Cancellation policy is not active in this club",
      );
    }
    const policy = selectedPolicy ?? input.cancellationPolicy;
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
      currency: input.currency,
      pricingUnit: input.pricingUnit,
      options: options.map((option) => ({
        ...option,
        resourceId: oid(option.resourceId),
        reservedQuantity: 0,
      })),
      cancellationPolicy: {
        policyId: policy.id ? oid(policy.id) : undefined,
        title: policy.title.trim(),
        version: policy.version ?? 1,
        reservationCutoffMinutes: policy.reservationCutoffMinutes ?? 0,
        rescheduleCutoffMinutes: policy.rescheduleCutoffMinutes ?? 0,
        noShowRefundPercent: policy.noShowRefundPercent ?? 0,
        ownerCancellationRefundPercent:
          policy.ownerCancellationRefundPercent ?? 100,
        tiers: [...policy.tiers].sort((a, b) => b.hoursBefore - a.hoursBefore),
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
    const club = await this.clubs.getPublic(String(session.clubId));
    if (club.operationalStatus !== "active") {
      throw new AppError(
        409,
        "CLUB_NOT_OPERATIONAL",
        "The club is not currently accepting reservations",
      );
    }
    if (
      session.cancellationPolicy.reservationCutoffMinutes > 0 &&
      session.startsAt.getTime() - Date.now() <
        session.cancellationPolicy.reservationCutoffMinutes * 60_000
    ) {
      throw new AppError(
        409,
        "RESERVATION_CUTOFF_REACHED",
        "Reservation cutoff has been reached",
      );
    }
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
    const baseTotal =
      session.pricingUnit === "per_participant"
        ? session.basePrice * input.participantCount
        : session.basePrice;
    const optionsTotal = selected.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const reservationId = new Types.ObjectId();
    const totalPrice = input.entitlementId
      ? optionsTotal
      : baseTotal + optionsTotal;
    try {
      if (input.entitlementId) {
        await this.entitlements.reserveForReservation({
          entitlementId: input.entitlementId,
          reservationId,
          userId,
          clubId: session.clubId,
          sessionType: getSessionType(session),
          sessionStartsAt: session.startsAt,
        });
      }
      const reservation = await this.reservations.create({
        _id: reservationId,
        clubId: session.clubId,
        sessionId: session._id,
        userId: oid(userId),
        sessionType: getSessionType(session),
        sessionTitle: session.title,
        sessionStartsAt: session.startsAt,
        sessionEndsAt: session.endsAt,
        participantCount: input.participantCount,
        selectedOptions: selected,
        totalPrice,
        entitlementId: input.entitlementId ? oid(input.entitlementId) : null,
        entitlementCoveredAmount: input.entitlementId ? baseTotal : 0,
        paymentStatus: totalPrice > 0 ? "pending" : "not_required",
        cancellationPolicy: session.cancellationPolicy,
        status: "reserved",
      });
      if (reservation.paymentStatus === "not_required") {
        await this.entitlements.finalizeReservation(reservation._id, true);
        await this.notifications.notifyBookingConfirmed({
          userId: reservation.userId,
          bookingId: reservation._id,
          title: reservation.sessionTitle,
        });
      }
      return publicReservation(reservation);
    } catch (error) {
      await this.entitlements.finalizeReservation(reservationId, false);
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

  async completeSession(ownerId: string, clubId: string, sessionId: string) {
    await this.clubs.get(ownerId, clubId);
    const session = await this.sessions
      .findOneAndUpdate(
        {
          _id: oid(sessionId),
          clubId: oid(clubId),
          status: "active",
          endsAt: { $lte: new Date() },
        },
        { $set: { status: "completed" } },
        { new: true },
      )
      .exec();
    if (!session) {
      throw new AppError(
        409,
        "SESSION_NOT_COMPLETABLE",
        "Only an ended active session can be completed",
      );
    }
    await this.reservations.updateMany(
      { sessionId: session._id, status: "reserved" },
      { $set: { status: "completed" } },
    );
    return publicSession(session);
  }

  async cancelSessionByOwner(
    ownerId: string,
    clubId: string,
    sessionId: string,
  ) {
    await this.clubs.get(ownerId, clubId);
    const session = await this.sessions
      .findOne({
        _id: oid(sessionId),
        clubId: oid(clubId),
        status: { $in: ["active", "cancelled"] },
      })
      .exec();
    if (!session) {
      throw new AppError(404, "SESSION_NOT_FOUND", "Active session not found");
    }
    if (session.status === "active") {
      session.status = "cancelled";
      session.reservedCount = 0;
      for (const option of session.options) option.reservedQuantity = 0;
      await session.save();
    }
    const reservations = await this.reservations
      .find({ sessionId: session._id, status: "reserved" })
      .exec();
    const refundPercent =
      session.cancellationPolicy.ownerCancellationRefundPercent;
    if (reservations.length) {
      const cancelledAt = new Date();
      await this.reservations.bulkWrite(
        reservations.map((reservation) => ({
          updateOne: {
            filter: { _id: reservation._id, status: "reserved" },
            update: {
              $set: {
                status: "cancelled",
                cancelledAt,
                refundPercent,
                refundAmount: Math.floor(
                  (reservation.totalPrice * refundPercent) / 100,
                ),
                ...(reservation.paymentStatus === "paid" && refundPercent > 0
                  ? { paymentStatus: "refunded" }
                  : {}),
              },
            },
          },
        })),
      );
      await Promise.all(
        reservations
          .filter(
            (reservation) =>
              reservation.paymentStatus === "paid" && refundPercent > 0,
          )
          .map((reservation) =>
            this.commerce.refundReservation(
              reservation._id,
              Math.floor((reservation.totalPrice * refundPercent) / 100),
              "session_cancelled_by_owner",
            ),
          ),
      );
      await Promise.all(
        reservations.flatMap((reservation) => [
          this.notifications.notifyBookingCancelled({
            userId: reservation.userId,
            bookingId: reservation._id,
            title: reservation.sessionTitle,
          }),
          this.entitlements.finalizeReservation(reservation._id, false),
        ]),
      );
    }
    return publicSession(session);
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
    if (session.startsAt <= cancelledAt) {
      throw new AppError(
        409,
        "SESSION_ALREADY_STARTED",
        "A reservation cannot be cancelled after the session starts",
      );
    }
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
            ...(reservation.paymentStatus === "paid" && refund.refundAmount > 0
              ? { paymentStatus: "refunded" }
              : {}),
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
    if (reservation.paymentStatus === "paid" && refund.refundAmount > 0) {
      await this.commerce.refundReservation(
        cancelled._id,
        refund.refundAmount,
        "reservation_cancelled",
      );
    }
    if (refund.refundPercent === 100) {
      await this.entitlements.finalizeReservation(cancelled._id, false);
    }
    await this.notifications.notifyBookingCancelled({
      userId: cancelled.userId,
      bookingId: cancelled._id,
      title: cancelled.sessionTitle,
    });
    return publicReservation(cancelled);
  }

  async approveMockPayment(userId: string, reservationId: string) {
    const filter = {
      _id: oid(reservationId),
      userId: oid(userId),
      status: "reserved" as const,
    };
    const reservation = await this.reservations.findOne(filter).exec();
    if (!reservation) {
      throw new AppError(404, "RESERVATION_NOT_FOUND", "Reservation not found");
    }
    if (reservation.paymentStatus === "paid") {
      return publicReservation(reservation);
    }
    if (reservation.paymentStatus !== "pending") {
      throw new AppError(
        409,
        "PAYMENT_NOT_PENDING",
        "Reservation does not have a pending payment",
      );
    }
    const paid = await this.reservations
      .findOneAndUpdate(
        { ...filter, paymentStatus: "pending" },
        { $set: { paymentStatus: "paid" } },
        { new: true },
      )
      .exec();
    if (!paid) {
      throw new AppError(
        409,
        "PAYMENT_STATUS_CHANGED",
        "Payment status changed before approval",
      );
    }
    await this.notifications.notifyBookingConfirmed({
      userId: paid.userId,
      bookingId: paid._id,
      title: paid.sessionTitle,
    });
    return publicReservation(paid);
  }

  async rejectMockPayment(userId: string, reservationId: string) {
    const rejected = await this.reservations
      .findOneAndUpdate(
        {
          _id: oid(reservationId),
          userId: oid(userId),
          status: "reserved",
          paymentStatus: "pending",
        },
        {
          $set: {
            status: "cancelled",
            paymentStatus: "failed",
            cancelledAt: new Date(),
            refundPercent: 0,
            refundAmount: 0,
          },
        },
        { new: true },
      )
      .exec();
    if (!rejected) {
      throw new AppError(
        409,
        "PAYMENT_NOT_PENDING",
        "Reservation does not have a pending payment",
      );
    }
    await this.releaseInventory(
      rejected.sessionId,
      rejected.participantCount,
      rejected.selectedOptions,
    );
    await this.notifications.notifyPaymentFailed({
      userId: rejected.userId,
      paymentId: rejected._id,
      title: rejected.sessionTitle,
    });
    return publicReservation(rejected);
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
    const options = selected.length
      ? {
          arrayFilters: selected.map((item, index) => ({
            [`option${index}._id`]: item.optionId,
          })),
        }
      : {};
    await this.sessions
      .updateOne({ _id: sessionId }, { $inc: increments }, options)
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
    code: value.code,
    sportIds: (value.sportIds ?? []).map(String),
    environment: value.environment ?? "indoor",
    surfaceTypeId: value.surfaceTypeId
      ? String(value.surfaceTypeId)
      : undefined,
    lengthMeters: value.lengthMeters,
    widthMeters: value.widthMeters,
    locationLabel: value.locationLabel,
    floor: value.floor,
    galleryMediaIds: (value.galleryMediaIds ?? []).map(String),
    minimumReservationMinutes: value.minimumReservationMinutes ?? 60,
    maximumReservationMinutes: value.maximumReservationMinutes ?? 480,
    preparationMinutes: value.preparationMinutes ?? 0,
    cleanupMinutes: value.cleanupMinutes ?? 0,
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
    currency: value.currency ?? "IRR",
    pricingUnit: value.pricingUnit ?? "per_participant",
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
function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("fa")
    .replace(/\s+/g, " ");
}
function publicReservation(value: ReservationDocument) {
  return {
    id: String(value._id),
    clubId: String(value.clubId),
    sessionId: String(value.sessionId),
    userId: String(value.userId),
    sessionType: value.sessionType,
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
    entitlementId: value.entitlementId ? String(value.entitlementId) : null,
    entitlementCoveredAmount: value.entitlementCoveredAmount ?? 0,
    paymentStatus: value.paymentStatus ?? "not_required",
    cancellationPolicy: value.cancellationPolicy,
    refundPercent: value.refundPercent,
    refundAmount: value.refundAmount,
    status: value.status,
    createdAt: value.createdAt.toISOString(),
    cancelledAt: value.cancelledAt?.toISOString() ?? null,
  };
}
function getSessionType(
  value: Pick<ReservableSessionDocument, "courtId" | "classId">,
): "court" | "class" | "coached_session" {
  if (value.courtId) return "court";
  if (value.classId) return "class";
  return "coached_session";
}
function duplicate(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function assertClubScheduleAllows(
  club: Awaited<ReturnType<ClubsService["get"]>>,
  startsAt: string,
  endsAt: string,
): void {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const closure = club.closures.find(
    (item) => start < new Date(item.endsAt) && end > new Date(item.startsAt),
  );
  if (closure) {
    throw new AppError(
      409,
      "CLUB_CLOSED",
      closure.reason || "The club is closed during this period",
    );
  }
  if (!club.weeklyHours.length) return;
  const timezone = club.location?.timezone ?? "Asia/Tehran";
  const startLocal = localTimeParts(start, timezone);
  const endLocal = localTimeParts(end, timezone);
  if (startLocal.date !== endLocal.date) {
    throw new AppError(
      400,
      "SESSION_OUTSIDE_OPENING_HOURS",
      "A session must fit within one club working day",
    );
  }
  const hours = club.weeklyHours.find(
    (item) => item.dayOfWeek === startLocal.dayOfWeek,
  );
  if (
    !hours ||
    hours.isClosed ||
    !hours.periods.some(
      (period) =>
        period.opensAt <= startLocal.time && period.closesAt >= endLocal.time,
    )
  ) {
    throw new AppError(
      400,
      "SESSION_OUTSIDE_OPENING_HOURS",
      "Session is outside club opening hours",
    );
  }
}

function localTimeParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    dayOfWeek: weekdays[value("weekday")] ?? 0,
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}`,
  };
}
