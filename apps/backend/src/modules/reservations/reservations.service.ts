import type { UpdateReservationCheckInDto } from "./dto/reservation.dto";
import { paymentDeadline } from "../commerce/payment-deadline";
import {
  Atomic,
  inAtomicOperation,
} from "../../infrastructure/database/atomic-operation";
import { reservationPrice } from "./reservation-price";
import { assertMockPaymentsEnabled } from "../commerce/mock-payment-policy";
import { Injectable, Logger } from "@nestjs/common";
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
  UpdateCourtDto,
  CreateReservationDto,
  RescheduleQuoteDto,
  RescheduleReservationDto,
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
  private readonly logger = new Logger(ReservationsService.name);
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
    await this.clubs.get(ownerId, clubId, "courts.read");
    const items = await this.courts
      .find({ clubId: oid(clubId) })
      .sort({ createdAt: -1 })
      .exec();
    return { items: items.map(publicCourt) };
  }

  async createCourt(ownerId: string, clubId: string, input: CreateCourtDto) {
    await this.clubs.get(ownerId, clubId, "courts.write");
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
        "facilities",
        "court-surface-type",
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

  async updateCourt(
    ownerId: string,
    clubId: string,
    courtId: string,
    input: UpdateCourtDto,
  ) {
    await this.clubs.get(ownerId, clubId, "courts.write");
    const court = await this.courts
      .findOne({ _id: oid(courtId), clubId: oid(clubId) })
      .exec();
    if (!court) throw new AppError(404, "COURT_NOT_FOUND", "زمین پیدا نشد.");
    const minimum =
      input.minimumReservationMinutes ?? court.minimumReservationMinutes;
    const maximum =
      input.maximumReservationMinutes ?? court.maximumReservationMinutes;
    if (minimum > maximum)
      throw new AppError(
        400,
        "COURT_DURATION_INVALID",
        "حداکثر زمان باید برابر یا بیشتر از حداقل زمان باشد.",
      );
    if (
      input.capacity !== undefined &&
      input.capacity < court.capacity &&
      (await this.sessions.exists({
        courtId: court._id,
        clubId: court.clubId,
        status: "active",
        endsAt: { $gt: new Date() },
        capacity: { $gt: input.capacity },
      }))
    ) {
      throw new AppError(
        409,
        "COURT_CAPACITY_IN_USE",
        "ظرفیت سانس‌های فعال از ظرفیت جدید بیشتر است؛ ابتدا سانس‌ها را مدیریت کنید.",
      );
    }
    await Promise.all([
      ...(input.courtTypeId
        ? [
            this.resources.requireActive(
              "sports",
              "court-type",
              input.courtTypeId,
            ),
          ]
        : []),
      ...(input.surfaceTypeId
        ? [
            this.resources.requireActive(
              "facilities",
              "court-surface-type",
              input.surfaceTypeId,
            ),
          ]
        : []),
      ...(input.sportIds ?? []).map((id) =>
        this.resources.requireActive("sports", "sport", id),
      ),
      ...(input.galleryMediaIds
        ? [this.media.assertOwnedReady(ownerId, input.galleryMediaIds)]
        : []),
    ]);
    const { expectedUpdatedAt, ...fields } = input;
    const set: Record<string, unknown> = { ...fields };
    const unset: Record<string, 1> = {};
    for (const field of ["courtTypeId", "surfaceTypeId"] as const) {
      if (input[field] === null) {
        delete set[field];
        unset[field] = 1;
      } else if (input[field]) set[field] = oid(input[field]);
    }
    for (const field of ["lengthMeters", "widthMeters"] as const) {
      if (input[field] === null) {
        delete set[field];
        unset[field] = 1;
      }
    }
    if (input.sportIds) set.sportIds = input.sportIds.map((id) => oid(id));
    if (input.galleryMediaIds)
      set.galleryMediaIds = input.galleryMediaIds.map((id) => oid(id));
    if (input.name !== undefined) set.normalizedName = normalize(input.name);
    const updated = await this.courts
      .findOneAndUpdate(
        {
          _id: court._id,
          clubId: court.clubId,
          updatedAt: expectedUpdatedAt
            ? new Date(expectedUpdatedAt)
            : court.updatedAt,
        },
        { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
        { new: true, runValidators: true },
      )
      .exec();
    if (!updated)
      throw new AppError(
        409,
        "COURT_CHANGED",
        "این زمین در جای دیگری ویرایش شده است؛ اطلاعات تازه را دریافت کنید.",
      );
    return publicCourt(updated);
  }

  async listBusinessSessions(ownerId: string, clubId: string) {
    await this.clubs.get(ownerId, clubId, "reservations.read");
    return this.listSessionsByClub(clubId, false);
  }

  async listClubReservations(ownerId: string, clubId: string) {
    await this.clubs.get(ownerId, clubId, "reservations.read");
    const items = await this.reservations
      .find({ clubId: oid(clubId) })
      .sort({ sessionStartsAt: -1, createdAt: -1 })
      .limit(2000)
      .exec();
    return { items: items.map(publicReservation) };
  }

  @Atomic("reservations")
  async checkIn(
    userId: string,
    clubId: string,
    reservationId: string,
    input: UpdateReservationCheckInDto,
  ) {
    await this.clubs.get(userId, clubId, "reservations.checkin");
    const item = await this.reservations.findOne({
      _id: oid(reservationId),
      clubId: oid(clubId),
      status: { $in: ["reserved", "completed"] },
      paymentStatus: { $in: ["paid", "not_required"] },
    });
    if (!item)
      throw new AppError(
        409,
        "RESERVATION_NOT_CHECKIN_ELIGIBLE",
        "Only a confirmed paid reservation can check in",
      );
    const before = item.checkedInParticipants ?? 0;
    if (input.participantCount === before) return publicReservation(item);
    if (before !== input.expectedParticipantCount)
      throw new AppError(
        409,
        "RESERVATION_CHECKIN_CHANGED",
        "Reload the latest attendance before changing it",
      );
    if (input.participantCount > item.participantCount)
      throw new AppError(
        400,
        "RESERVATION_CHECKIN_CAPACITY",
        "Attendance exceeds reserved participants",
      );
    if (input.participantCount < before && input.reason.trim().length < 5)
      throw new AppError(
        400,
        "RESERVATION_CHECKIN_REASON_REQUIRED",
        "A correction reason is required",
      );
    const now = new Date();
    if (
      input.participantCount > before &&
      (now.getTime() < item.sessionStartsAt.getTime() - 30 * 60000 ||
        now > item.sessionEndsAt ||
        item.status !== "reserved")
    )
      throw new AppError(
        409,
        "RESERVATION_CHECKIN_WINDOW_CLOSED",
        "Check-in opens 30 minutes before the session and ends with it",
      );
    item.checkedInParticipants = input.participantCount;
    item.checkedInAt = input.participantCount
      ? (item.checkedInAt ?? now)
      : null;
    item.checkInChanges.push({
      actorId: userId,
      at: now,
      before,
      after: input.participantCount,
      reason: input.reason.trim(),
    });
    await item.save();
    return publicReservation(item);
  }

  @Atomic("reservations")
  async markNoShow(ownerId: string, clubId: string, reservationId: string) {
    await this.clubs.get(ownerId, clubId, "attendance.write");
    const reservation = await this.reservations
      .findOne({
        _id: oid(reservationId),
        clubId: oid(clubId),
        status: "reserved",
        checkedInParticipants: { $not: { $gt: 0 } },
        paymentStatus: { $in: ["paid", "not_required"] },
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
    const club = await this.clubs.get(ownerId, clubId, "reservations.write");
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

  private async prepareReservation(
    userId: string,
    input: CreateReservationDto,
    replacingId?: Types.ObjectId,
  ) {
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
    if (
      session.courtId &&
      !(await this.courts.exists({
        _id: session.courtId,
        clubId: session.clubId,
        status: "active",
        isReservable: true,
      }))
    ) {
      throw new AppError(
        409,
        "COURT_NOT_RESERVABLE",
        "فروش سانس‌های این زمین فعلاً متوقف است.",
      );
    }
    const club = await this.clubs.getPublic(String(session.clubId));
    if (input.isTrial) {
      if (!club.trialBookingEnabled)
        throw new AppError(
          409,
          "TRIAL_NOT_AVAILABLE",
          "Trial booking is not enabled for this club",
        );
      if (
        input.participantCount !== 1 ||
        input.entitlementId ||
        input.options?.length
      )
        throw new AppError(
          400,
          "INVALID_TRIAL_BOOKING",
          "Trial bookings are for one person without extras or a membership",
        );
      const used = await this.reservations.exists({
        ...(replacingId ? { _id: { $ne: replacingId } } : {}),
        clubId: session.clubId,
        userId: oid(userId),
        isTrial: true,
        status: { $in: ["reserved", "completed", "no_show"] },
      });
      if (used)
        throw new AppError(
          409,
          "TRIAL_ALREADY_USED",
          "Trial booking has already been used for this club",
        );
    }
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
    if (input.entitlementId && input.participantCount !== 1)
      throw new AppError(
        400,
        "ENTITLEMENT_SINGLE_PARTICIPANT",
        "عضویت شخصی فقط برای یک نفر قابل استفاده است.",
      );
    const pricing = reservationPrice({
      basePrice: session.basePrice,
      pricingUnit: session.pricingUnit,
      participantCount: input.participantCount,
      options: selected,
      isTrial: input.isTrial,
      entitlementId: input.entitlementId,
      taxPercent: club.taxPercent,
    });
    if (
      input.expectedTotalPrice != null &&
      input.expectedTotalPrice !== pricing.totalPrice
    )
      throw new AppError(
        409,
        "RESERVATION_PRICE_CHANGED",
        "قیمت تغییر کرده است؛ خلاصه رزرو را دوباره بررسی کنید.",
      );
    if (input.expectedCurrency && input.expectedCurrency !== session.currency)
      throw new AppError(
        409,
        "RESERVATION_PRICE_CHANGED",
        "واحد پول تغییر کرده است؛ خلاصه رزرو را دوباره بررسی کنید.",
      );
    return { session, selected, pricing };
  }

  async quote(userId: string, input: CreateReservationDto) {
    const { session, pricing } = await this.prepareReservation(userId, input);
    if (input.entitlementId)
      await this.entitlements.assertEligibleForReservation({
        entitlementId: input.entitlementId,
        userId,
        clubId: session.clubId,
        sessionType: getSessionType(session),
        sessionStartsAt: session.startsAt,
      });
    if (
      session.reservedCount + input.participantCount > session.capacity ||
      (input.options ?? []).some((selection) => {
        const option = session.options.find(
          (item) => String(item._id) === selection.optionId,
        )!;
        return (
          option.reservedQuantity + selection.quantity >
          option.availableQuantity
        );
      })
    )
      throw new AppError(
        409,
        "SESSION_CAPACITY_UNAVAILABLE",
        "ظرفیت سانس یا خدمات انتخاب‌شده کافی نیست.",
      );
    return {
      ...pricing,
      sessionId: String(session._id),
      currency: session.currency,
      pricingUnit: session.pricingUnit,
      participantCount: input.participantCount,
    };
  }

  private async prepareReschedule(
    userId: string,
    reservationId: string,
    input: RescheduleQuoteDto,
  ) {
    const previous = await this.reservations.findOne({
      _id: oid(reservationId),
      userId: oid(userId),
      status: "reserved",
      paymentStatus: { $in: ["paid", "not_required"] },
    });
    if (!previous)
      throw new AppError(
        409,
        "RESERVATION_NOT_RESCHEDULABLE",
        "رزرو تأییدشده برای تغییر زمان پیدا نشد.",
      );
    if (previous.sessionStartsAt <= new Date())
      throw new AppError(
        409,
        "SESSION_ALREADY_STARTED",
        "زمان تغییر این رزرو گذشته است.",
      );
    if (
      previous.sessionStartsAt.getTime() - Date.now() <
      (previous.cancellationPolicy.rescheduleCutoffMinutes ?? 0) * 60_000
    )
      throw new AppError(
        409,
        "RESCHEDULE_CUTOFF_REACHED",
        "مهلت تغییر زمان این رزرو تمام شده است.",
      );
    if (String(previous.sessionId) === input.sessionId)
      throw new AppError(409, "SAME_SESSION", "سانس دیگری انتخاب کنید.");
    const nextInput: CreateReservationDto = {
      sessionId: input.sessionId,
      options: input.options,
      participantCount: previous.participantCount,
      isTrial: previous.isTrial,
      entitlementId: previous.entitlementId
        ? String(previous.entitlementId)
        : undefined,
    };
    const { session, selected, pricing } = await this.prepareReservation(
      userId,
      nextInput,
      previous._id,
    );
    if (
      String(session.clubId) !== String(previous.clubId) ||
      session.currency !== previous.currency
    )
      throw new AppError(
        409,
        "RESCHEDULE_CLUB_MISMATCH",
        "زمان جایگزین باید از همین باشگاه و با همان واحد پول باشد.",
      );
    if (
      session.reservedCount + previous.participantCount > session.capacity ||
      selected.some((o) => {
        const option = session.options.find(
          (v) => String(v._id) === String(o.optionId),
        )!;
        return option.reservedQuantity + o.quantity > option.availableQuantity;
      })
    )
      throw new AppError(
        409,
        "SESSION_CAPACITY_UNAVAILABLE",
        "ظرفیت زمان جایگزین کافی نیست.",
      );
    const policy = calculateRefund(
      previous.totalPrice,
      previous.sessionStartsAt,
      new Date(),
      previous.cancellationPolicy.tiers,
    );
    const grossRefund =
      previous.paymentStatus === "paid" ? policy.refundAmount : 0;
    const refund = await this.commerce.quoteReservationRefund(
      previous._id,
      grossRefund,
    );
    const refundAmount = refund.gatewayRefund + refund.walletRefund;
    return {
      previous,
      nextInput,
      quote: {
        sessionId: String(session._id),
        sessionTitle: session.title,
        startsAt: session.startsAt.toISOString(),
        endsAt: session.endsAt.toISOString(),
        newAmount: pricing.totalPrice,
        grossRefund,
        refundAmount,
        gatewayRefund: refund.gatewayRefund,
        walletRefund: refund.walletRefund,
        difference: pricing.totalPrice - refundAmount,
        refundPercent: policy.refundPercent,
        currency: session.currency,
        restoresEntitlement: Boolean(
          previous.entitlementId && policy.refundPercent === 100,
        ),
      },
    };
  }

  async quoteReschedule(
    userId: string,
    reservationId: string,
    input: RescheduleQuoteDto,
  ) {
    return (await this.prepareReschedule(userId, reservationId, input)).quote;
  }

  @Atomic("reservations")
  async reschedule(
    userId: string,
    reservationId: string,
    input: RescheduleReservationDto,
  ) {
    assertMockPaymentsEnabled();
    const existing = await this.reservations.findOne({
      _id: oid(reservationId),
      userId: oid(userId),
    });
    if (existing?.rescheduledToId) {
      const next = await this.reservations.findById(existing.rescheduledToId);
      if (
        existing.rescheduleKey !== input.idempotencyKey ||
        !next ||
        String(next.sessionId) !== input.sessionId
      )
        throw new AppError(
          409,
          "RESERVATION_ALREADY_RESCHEDULED",
          "این رزرو قبلاً تغییر زمان داده شده است.",
        );
      return publicReservation(next);
    }
    const { previous, nextInput, quote } = await this.prepareReschedule(
      userId,
      reservationId,
      input,
    );
    if (
      quote.newAmount !== input.expectedTotalPrice ||
      quote.refundAmount !== input.expectedRefundAmount ||
      quote.refundPercent !== input.expectedRefundPercent
    )
      throw new AppError(
        409,
        "PAYMENT_PRICE_CHANGED",
        "مبلغ یا شرایط لغو تغییر کرده؛ پیش‌فاکتور جدید را بررسی کنید.",
      );
    const cancelled = await this.cancel(userId, reservationId);
    if (cancelled.refundPercent !== quote.refundPercent)
      throw new AppError(
        409,
        "PAYMENT_PRICE_CHANGED",
        "مهلت قانون لغو تغییر کرده؛ دوباره بررسی کنید.",
      );
    if (
      previous.paymentStatus === "paid" &&
      cancelled.refundAmount !== quote.grossRefund
    )
      throw new AppError(
        409,
        "PAYMENT_PRICE_CHANGED",
        "مهلت قانون لغو تغییر کرده؛ دوباره بررسی کنید.",
      );
    const next = await this.reserve(userId, {
      ...nextInput,
      expectedTotalPrice: quote.newAmount,
      expectedCurrency: quote.currency,
    });
    if (next.totalPrice > 0) {
      const intent = await this.commerce.createIntent(userId, {
        referenceType: "reservation",
        referenceId: next.id,
        expectedAmount: quote.newAmount,
        idempotencyKey: `reschedule-${next.id}`,
        walletAmount: 0,
        returnUrl: "https://app.gym4me.ir/athlete/reservations",
      });
      const payment = await this.commerce.simulate(
        userId,
        intent.id,
        input.mockResult,
      );
      if (payment.status !== "paid")
        throw new AppError(
          409,
          "RESCHEDULE_PAYMENT_FAILED",
          "پرداخت آزمایشی ناموفق بود؛ رزرو قبلی حفظ شد.",
        );
    } else if (input.mockResult === "failed")
      throw new AppError(
        409,
        "RESCHEDULE_CANCELLED",
        "تغییر زمان تأیید نشد؛ رزرو قبلی حفظ شد.",
      );
    await this.reservations.updateOne(
      { _id: previous._id },
      {
        $set: {
          rescheduledToId: oid(next.id),
          rescheduleKey: input.idempotencyKey,
          cancellationReason: "rescheduled",
        },
      },
    );
    const saved = await this.reservations.findByIdAndUpdate(
      next.id,
      { $set: { rescheduledFromId: previous._id } },
      { new: true },
    );
    return publicReservation(saved!);
  }

  @Atomic("reservations")
  async reserve(userId: string, input: CreateReservationDto) {
    const { session, selected, pricing } = await this.prepareReservation(
      userId,
      input,
    );
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
    const reservationId = new Types.ObjectId();
    const { totalPrice } = pricing;
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
        isTrial: input.isTrial ?? false,
        selectedOptions: selected,
        totalPrice,
        entitlementId: input.entitlementId ? oid(input.entitlementId) : null,
        entitlementCoveredAmount: pricing.coveredAmount,
        currency: session.currency,
        pricingUnit: session.pricingUnit,
        priceBreakdown: pricing,
        paymentStatus: totalPrice > 0 ? "pending" : "not_required",
        paymentExpiresAt:
          totalPrice > 0 ? paymentDeadline(session.startsAt) : null,
        cancellationPolicy: session.cancellationPolicy,
        status: "reserved",
      });
      if (reservation.paymentStatus === "not_required") {
        if (!input.isTrial)
          await this.entitlements.finalizeReservation(reservation._id, true);
        try {
          await this.notifications.notifyBookingConfirmed({
            userId: reservation.userId,
            bookingId: reservation._id,
            title: reservation.sessionTitle,
          });
        } catch {
          // A notification failure must never release a persisted booking's seat.
          this.logger.warn(
            `Booking ${reservation._id} confirmed but notification failed`,
          );
        }
      }
      return publicReservation(reservation);
    } catch (error) {
      if (inAtomicOperation()) {
        if (duplicate(error))
          throw new AppError(
            409,
            input.isTrial ? "TRIAL_ALREADY_USED" : "RESERVATION_EXISTS",
            "رزرو تکراری است.",
          );
        throw error;
      }
      if (!input.isTrial)
        await this.entitlements.finalizeReservation(reservationId, false);
      await this.releaseInventory(
        session._id,
        input.participantCount,
        selected,
        reservationId,
      );
      if (duplicate(error))
        throw new AppError(
          409,
          input.isTrial ? "TRIAL_ALREADY_USED" : "RESERVATION_EXISTS",
          input.isTrial
            ? "Trial booking has already been used for this club"
            : "An active reservation already exists",
        );
      throw error;
    }
  }

  @Atomic("reservations")
  async completeSession(ownerId: string, clubId: string, sessionId: string) {
    await this.clubs.get(ownerId, clubId, "attendance.write");
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
      {
        sessionId: session._id,
        status: "reserved",
        paymentStatus: { $in: ["paid", "not_required"] },
      },
      { $set: { status: "completed" } },
    );
    return publicSession(session);
  }

  @Atomic("reservations")
  async cancelSessionByOwner(
    ownerId: string,
    clubId: string,
    sessionId: string,
  ) {
    await this.clubs.get(ownerId, clubId, "reservations.write");
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
      for (const reservation of reservations) {
        if (reservation.paymentStatus === "paid" && refundPercent > 0) {
          await this.commerce.refundReservation(
            reservation._id,
            Math.floor((reservation.totalPrice * refundPercent) / 100),
            "session_cancelled_by_owner",
          );
        }
        await this.notifications.notifyBookingCancelled({
          userId: reservation.userId,
          bookingId: reservation._id,
          title: reservation.sessionTitle,
        });
        await this.entitlements.finalizeReservation(reservation._id, false);
      }
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

  @Atomic("reservations")
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
    if ((reservation.checkedInParticipants ?? 0) > 0)
      throw new AppError(
        409,
        "RESERVATION_ALREADY_CHECKED_IN",
        "Checked-in reservations require staff review before cancellation",
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
      cancelled._id,
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
    return this.resolveMockPayment(userId, reservationId, "paid");
  }

  async rejectMockPayment(userId: string, reservationId: string) {
    return this.resolveMockPayment(userId, reservationId, "failed");
  }

  private async resolveMockPayment(
    userId: string,
    reservationId: string,
    status: "paid" | "failed",
  ) {
    assertMockPaymentsEnabled();
    const filter = { _id: oid(reservationId), userId: oid(userId) };
    const reservation = await this.reservations.findOne(filter).exec();
    if (!reservation)
      throw new AppError(404, "RESERVATION_NOT_FOUND", "Reservation not found");
    if (reservation.paymentStatus === status)
      return publicReservation(reservation);
    if (
      reservation.status !== "reserved" ||
      reservation.paymentStatus !== "pending"
    )
      throw new AppError(
        409,
        "PAYMENT_NOT_PENDING",
        "Reservation does not have a pending payment",
      );
    const intent = await this.commerce.createIntent(userId, {
      referenceType: "reservation",
      referenceId: reservationId,
      idempotencyKey: `reservation-checkout-${reservationId}`,
      walletAmount: 0,
      returnUrl: "https://app.gym4me.ir/athlete/reservations",
    });
    await this.commerce.simulate(userId, intent.id, status);
    const result = await this.reservations.findOne(filter).exec();
    if (!result)
      throw new AppError(404, "RESERVATION_NOT_FOUND", "Reservation not found");
    return publicReservation(result);
  }

  private async listSessionsByClub(clubId: string, publicOnly: boolean) {
    const filter: Record<string, unknown> = { clubId: oid(clubId) };
    if (publicOnly) {
      const activeCourts = await this.courts.distinct("_id", {
        clubId: oid(clubId),
        status: "active",
        isReservable: true,
      });
      Object.assign(filter, {
        status: "active",
        startsAt: { $gt: new Date() },
        $or: [{ courtId: null }, { courtId: { $in: activeCourts } }],
      });
    }
    const items = await this.sessions.find(filter).sort({ startsAt: 1 }).exec();
    return { items: items.map(publicSession) };
  }

  private async releaseInventory(
    sessionId: Types.ObjectId,
    participants: number,
    selected: Array<{ optionId: Types.ObjectId; quantity: number }>,
    reservationId: Types.ObjectId,
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
      .updateOne(
        {
          _id: sessionId,
          status: "active",
          releasedReservationIds: { $ne: reservationId },
        },
        {
          $inc: increments,
          $addToSet: { releasedReservationIds: reservationId },
        },
        options,
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
    rescheduledFromId: value.rescheduledFromId
      ? String(value.rescheduledFromId)
      : null,
    rescheduledToId: value.rescheduledToId
      ? String(value.rescheduledToId)
      : null,
    clubId: String(value.clubId),
    sessionId: String(value.sessionId),
    userId: String(value.userId),
    sessionType: value.sessionType,
    sessionTitle: value.sessionTitle,
    sessionStartsAt: value.sessionStartsAt.toISOString(),
    sessionEndsAt: value.sessionEndsAt.toISOString(),
    participantCount: value.participantCount,
    checkedInParticipants: value.checkedInParticipants ?? 0,
    checkedInAt: value.checkedInAt?.toISOString() ?? null,
    isTrial: value.isTrial ?? false,
    selectedOptions: value.selectedOptions.map((item) => ({
      optionId: String(item.optionId),
      type: item.type,
      resourceId: String(item.resourceId),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    totalPrice: value.totalPrice,
    currency: value.currency ?? "IRR",
    pricingUnit: value.pricingUnit ?? "per_participant",
    priceBreakdown: value.priceBreakdown ?? null,
    entitlementId: value.entitlementId ? String(value.entitlementId) : null,
    entitlementCoveredAmount: value.entitlementCoveredAmount ?? 0,
    paymentStatus: value.paymentStatus ?? "not_required",
    paymentExpiresAt: value.paymentExpiresAt?.toISOString() ?? null,
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
