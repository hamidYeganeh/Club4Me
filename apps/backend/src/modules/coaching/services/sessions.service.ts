import { withReferenceSummaries, classDisplayReferences } from "../../../common/utils/reference-summaries";
import { Atomic } from "../../../infrastructure/database/atomic-operation";
import { CoachPackagePurchase } from "../schemas/coach-purchase.schema";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../../common/errors/app.exception";
import type { SessionInput } from "../dto/coaching.dto";
import {
  CoachOffering,
  type CoachOfferingDocument,
  ClassEnrollment,
  type ClassEnrollmentDocument,
  SessionBooking,
  type SessionBookingDocument,
  TrainingSession,
  type TrainingSessionDocument,
} from "../schemas/coaching.schemas";
import { objectId, toPublicDocument } from "../coaching.utils";
import { CoachesService } from "./coaches.service";
import {
  ReservableSession,
  type ReservableSessionDocument,
} from "../../reservations/schemas/reservable-session.schema";
import {
  Court,
  type CourtDocument,
} from "../../reservations/schemas/court.schema";
import { ClubsService } from "../../clubs/clubs.service";
import { normalizeCoachCancellationPolicy } from "./coach-booking-policy";
import { NotificationsService } from "../../notifications/notifications.service";

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(TrainingSession.name)
    private readonly sessions: Model<TrainingSessionDocument>,
    @InjectModel(CoachOffering.name)
    private readonly offerings: Model<CoachOfferingDocument>,
    @InjectModel(SessionBooking.name)
    private readonly bookings: Model<SessionBookingDocument>,
    @InjectModel(ClassEnrollment.name)
    private readonly enrollments: Model<ClassEnrollmentDocument>,
    @InjectModel(ReservableSession.name)
    private readonly reservableSessions: Model<ReservableSessionDocument>,
    @InjectModel(Court.name) private readonly courts: Model<CourtDocument>,
    private readonly coaches: CoachesService,
    private readonly clubs: ClubsService,
    private readonly notifications: NotificationsService,
  ) {}

  async listPublicForCoachSlug(slug: string) {
    const coach = await this.coaches.getPublicBySlug(slug);
    const coachId = objectId(String(coach.id), "COACH_NOT_FOUND");
    const now = new Date();
    const [sessions, clubSessions] = await Promise.all([
      this.sessions
        .find({
          ownerCoachId: coachId,
          classId: { $exists: false },
          offeringId: { $exists: true },
          status: { $in: ["open_for_booking", "rescheduled"] },
          startAt: { $gt: now },
          $expr: { $lt: ["$bookedCount", "$capacity"] },
        })
        .sort({ startAt: 1 })
        .limit(200)
        .exec(),
      this.reservableSessions
        .find({
          coachId,
          status: "active",
          startsAt: { $gt: now },
          $expr: { $lt: ["$reservedCount", "$capacity"] },
        })
        .sort({ startsAt: 1 })
        .limit(200)
        .exec(),
    ]);
    const offeringIds = sessions.flatMap((session) =>
      session.offeringId ? [session.offeringId] : [],
    );
    const offerings = await this.offerings
      .find({
        _id: { $in: offeringIds },
        status: "published",
      })
      .exec();
    const byId = new Map(offerings.map((item) => [String(item._id), item]));
    const clubIds = [
      ...new Set(clubSessions.map((item) => String(item.clubId))),
    ];
    const publicClubIds = new Set(
      (
        await Promise.all(
          clubIds.map(async (clubId) => {
            try {
              await this.clubs.getPublic(clubId);
              return clubId;
            } catch {
              return null;
            }
          }),
        )
      ).filter((clubId): clubId is string => Boolean(clubId)),
    );
    const directItems = sessions.flatMap((session) => {
      const offering = session.offeringId
        ? byId.get(String(session.offeringId))
        : undefined;
      return offering ? [publicCoachSession(session, offering)] : [];
    });
    const clubItems = clubSessions
      .filter((session) => publicClubIds.has(String(session.clubId)))
      .map(publicPublicClubSessionForCoach);
    return {
      items: [...directItems, ...clubItems].sort(
        (left, right) =>
          new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
      ),
    };
  }

  async calendar(userId: string, from?: string, to?: string) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    const filter: Record<string, unknown> = {
      "coachAssignments.coachId": coach._id,
    };
    if (from || to) {
      filter.startAt = {
        ...(from ? { $gte: parseDate(from, "from") } : {}),
        ...(to ? { $lte: parseDate(to, "to") } : {}),
      };
    }
    const clubFilter: Record<string, unknown> = {
      coachId: coach._id,
      classSessionId: { $exists: false },
    };
    if (from || to) {
      clubFilter.startsAt = {
        ...(from ? { $gte: parseDate(from, "from") } : {}),
        ...(to ? { $lte: parseDate(to, "to") } : {}),
      };
    }
    const [items, clubItems] = await Promise.all([
      this.sessions.find(filter).sort({ startAt: 1 }).limit(1000).exec(),
      this.reservableSessions
        .find(clubFilter)
        .sort({ startsAt: 1 })
        .limit(1000)
        .exec(),
    ]);
    return {
      items: [
        ...items.map((item) => ({
          ...toPublicDocument(item),
          startAt: item.startAt.toISOString(),
          endAt: item.endAt.toISOString(),
          managedBy: "coach",
        })),
        ...clubItems.map(publicClubSessionForCoach),
      ].sort(
        (left, right) =>
          new Date(String(left.startAt)).getTime() -
          new Date(String(right.startAt)).getTime(),
      ),
    };
  }

  async listForClass(userId: string, classId: string) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    const items = await this.sessions
      .find({ classId: objectId(classId), ownerCoachId: coach._id })
      .sort({ startAt: 1 })
      .exec();
    return { items: await withReferenceSummaries(this.sessions.db, items.map(toPublicDocument), [...classDisplayReferences, {field: "classId", as: "trainingClass", collection: "classes", fields: ["title", "slug"]}]) };
  }

  async createStandalone(userId: string, input: SessionInput) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    let priceOffering: CoachOfferingDocument | null = null;
    if (input.offeringId) {
      priceOffering = await this.offerings
        .findOne({
          _id: objectId(input.offeringId),
          coachId: coach._id,
          status: "published",
        })
        .exec();
      if (!priceOffering)
        throw new AppError(404, "OFFERING_NOT_FOUND", "Service not found");
      if (
        String(priceOffering.sportId) !== input.sportId ||
        !priceOffering.deliveryModes.includes(input.deliveryMode) ||
        input.capacity > priceOffering.capacity
      ) {
        throw new AppError(
          400,
          "SESSION_OFFERING_MISMATCH",
          "Session does not match the selected service",
        );
      }
    }
    if (!priceOffering) {
      throw new AppError(
        400,
        "SESSION_OFFERING_REQUIRED",
        "A published service is required for a bookable session",
      );
    }
    if (input.deliveryMode === "online" && !input.venue?.onlineUrl) {
      throw new AppError(
        400,
        "ONLINE_SESSION_URL_REQUIRED",
        "Online sessions require a meeting URL",
      );
    }
    if (
      ["club", "outdoor"].includes(input.deliveryMode) &&
      !input.venue?.clubId &&
      !input.venue?.address
    ) {
      throw new AppError(
        400,
        "SESSION_VENUE_REQUIRED",
        "In-person sessions require a club or address",
      );
    }
    if (input.venue?.clubId) {
      await this.clubs.getPublic(input.venue.clubId);
      if (
        priceOffering.venueClubIds.length > 0 &&
        !priceOffering.venueClubIds.some(
          (clubId) => String(clubId) === input.venue?.clubId,
        )
      ) {
        throw new AppError(
          400,
          "SESSION_VENUE_NOT_ALLOWED",
          "Club is not allowed for this service",
        );
      }
      if (input.venue.courtId) {
        const court = await this.courts
          .findOne({
            _id: objectId(input.venue.courtId),
            clubId: objectId(input.venue.clubId),
            status: "active",
            isReservable: true,
          })
          .exec();
        if (!court) {
          throw new AppError(
            400,
            "COURT_NOT_RESERVABLE",
            "Court is not reservable",
          );
        }
        const blockedStart = new Date(
          input.startAt.getTime() - court.preparationMinutes * 60_000,
        );
        const blockedEnd = new Date(
          input.endAt.getTime() + court.cleanupMinutes * 60_000,
        );
        const courtConflict = await this.reservableSessions.exists({
          courtId: court._id,
          status: "active",
          startsAt: { $lt: blockedEnd },
          endsAt: { $gt: blockedStart },
        });
        if (courtConflict) {
          throw new AppError(
            409,
            "COURT_SESSION_OVERLAP",
            "Court already has an overlapping session",
          );
        }
      }
    }
    await this.assertNoConflict([coach._id], input.startAt, input.endAt);
    await this.assertNoReservableConflict(
      coach._id,
      input.startAt,
      input.endAt,
    );
    const created = await this.sessions.create({
      ownerCoachId: coach._id,
      offeringId: priceOffering?._id,
      coachAssignments: [{ coachId: coach._id, role: "primary" }],
      sportId: objectId(input.sportId),
      title: input.title.trim(),
      startAt: input.startAt,
      endAt: input.endAt,
      timezone: input.timezone,
      deliveryMode: input.deliveryMode,
      venue: input.venue
        ? {
            ...input.venue,
            ...(input.venue.clubId
              ? { clubId: objectId(input.venue.clubId) }
              : {}),
          }
        : undefined,
      capacity: input.capacity,
      publicNotes: input.publicNotes?.trim(),
      coachPrivateNotes: input.coachPrivateNotes?.trim(),
      status: "open_for_booking",
    });
    return toPublicDocument(created);
  }

  async reschedule(
    userId: string,
    sessionId: string,
    startAt: Date,
    endAt: Date,
  ) {
    const session = await this.requireOwnedDocument(userId, sessionId);
    if (["completed", "cancelled"].includes(session.status)) {
      throw new AppError(
        409,
        "SESSION_NOT_RESCHEDULABLE",
        "Session cannot be rescheduled",
      );
    }
    await this.assertNoConflict(
      session.coachAssignments.map((assignment) => assignment.coachId),
      startAt,
      endAt,
      session._id,
    );
    session.startAt = startAt;
    session.endAt = endAt;
    session.status = "rescheduled";
    await session.save();
    if (session.reservableSessionId) {
      await this.reservableSessions.updateOne(
        { _id: session.reservableSessionId, status: "active" },
        { $set: { startsAt: startAt, endsAt: endAt } },
      );
    }
    const [bookings, enrollments] = await Promise.all([
      this.bookings
        .find({
          sessionId: session._id,
          status: { $in: ["pending", "confirmed"] },
        })
        .exec(),
      session.classId
        ? this.enrollments
            .find({
              classId: session.classId,
              status: { $in: ["pending", "active"] },
            })
            .exec()
        : Promise.resolve([]),
    ]);
    await Promise.all([
      ...bookings.map((booking) =>
        this.notifications.notifyBookingRescheduled({
          userId: booking.athleteId,
          bookingId: booking._id,
          title: session.title,
          startAt,
        }),
      ),
      ...enrollments.map((enrollment) =>
        this.notifications.notifyBookingRescheduled({
          userId: enrollment.athleteId,
          bookingId: session._id,
          title: session.title,
          startAt,
        }),
      ),
    ]);
    return toPublicDocument(session);
  }

  @Atomic("sessions")
  async cancel(userId: string, sessionId: string, reason: string) {
    const session = await this.requireOwnedDocument(userId, sessionId);
    if (["completed", "cancelled"].includes(session.status)) {
      throw new AppError(
        409,
        "SESSION_NOT_CANCELLABLE",
        "Session cannot be cancelled",
      );
    }
    session.status = "cancelled";
    session.cancellationReason = reason.trim();
    await session.save();
    const activeBookings = await this.bookings
      .find({
        sessionId: session._id,
        status: { $in: ["pending", "confirmed"] },
      })
      .exec();
    if (activeBookings.length) {
      const cancelledAt = new Date();
      await this.bookings.bulkWrite(
        activeBookings.map((booking) => {
          const policy = normalizeCoachCancellationPolicy(
            booking.cancellationPolicySnapshot,
          );
          const refundPercent = policy.ownerCancellationRefundPercent;
          return {
            updateOne: {
              filter: {
                _id: booking._id,
                status: { $in: ["pending", "confirmed"] },
              },
              update: {
                $set: {
                  status: "cancelled_by_coach",
                  cancelledAt,
                  cancellationReason: reason.trim(),
                  refundPercent,
                  refundAmount: Math.floor(
                    (booking.priceSnapshot.amount * refundPercent) / 100,
                  ),
                  ...(booking.paymentStatus === "pending"
                    ? { paymentStatus: "failed" }
                    : booking.paymentStatus === "paid" && refundPercent > 0
                      ? { paymentStatus: "refunded" }
                      : {}),
                },
              },
            },
          };
        }),
      );
    }
    for (const booking of activeBookings) {
      if (booking.packagePurchaseId) {
        await this.sessions.db
          .model<CoachPackagePurchase>(CoachPackagePurchase.name)
          .updateOne({ _id: booking.packagePurchaseId }, [
            {
              $set: {
                usedSessions: {
                  $max: [0, { $subtract: ["$usedSessions", 1] }],
                },
                remainingSessions: {
                  $cond: [
                    { $eq: ["$remainingSessions", null] },
                    null,
                    { $add: ["$remainingSessions", 1] },
                  ],
                },
              },
            },
          ]);
      }
    }
    const classEnrollments = session.classId
      ? await this.enrollments
          .find({
            classId: session.classId,
            status: { $in: ["pending", "active"] },
          })
          .exec()
      : [];
    await Promise.all([
      ...activeBookings.map((booking) =>
        this.notifications.notifyBookingCancelled({
          userId: booking.athleteId,
          bookingId: booking._id,
          title: session.title,
        }),
      ),
      ...classEnrollments.map((enrollment) =>
        this.notifications.notifyBookingCancelled({
          userId: enrollment.athleteId,
          bookingId: session._id,
          title: session.title,
        }),
      ),
    ]);
    if (session.reservableSessionId) {
      await this.reservableSessions.updateOne(
        { _id: session.reservableSessionId },
        { $set: { status: "cancelled" } },
      );
    }
    return toPublicDocument(session);
  }

  async requireOwnedDocument(
    userId: string,
    sessionId: string,
  ): Promise<TrainingSessionDocument> {
    const coach = await this.coaches.requireOwnedCoach(userId);
    const session = await this.sessions
      .findOne({
        _id: objectId(sessionId, "SESSION_NOT_FOUND"),
        ownerCoachId: coach._id,
      })
      .exec();
    if (!session)
      throw new AppError(404, "SESSION_NOT_FOUND", "Session not found");
    return session;
  }

  async assertNoConflict(
    coachIds: Types.ObjectId[],
    startAt: Date,
    endAt: Date,
    excludeSessionId?: Types.ObjectId,
  ) {
    const conflict = await this.sessions
      .findOne({
        ...(excludeSessionId ? { _id: { $ne: excludeSessionId } } : {}),
        "coachAssignments.coachId": { $in: coachIds },
        status: { $nin: ["cancelled", "completed"] },
        startAt: { $lt: endAt },
        endAt: { $gt: startAt },
      })
      .select("_id startAt endAt")
      .lean()
      .exec();
    if (conflict) {
      throw new AppError(
        409,
        "COACH_SCHEDULE_CONFLICT",
        "A coach already has another session in this time range",
        {
          sessionId: String(conflict._id),
        },
      );
    }
  }

  private async assertNoReservableConflict(
    coachId: Types.ObjectId,
    startAt: Date,
    endAt: Date,
  ) {
    const conflict = await this.reservableSessions.exists({
      coachId,
      status: "active",
      startsAt: { $lt: endAt },
      endsAt: { $gt: startAt },
    });
    if (conflict) {
      throw new AppError(
        409,
        "COACH_SCHEDULE_CONFLICT",
        "Coach already has a club session in this time range",
      );
    }
  }
}

function publicCoachSession(
  session: TrainingSessionDocument,
  offering: CoachOfferingDocument,
) {
  return {
    id: String(session._id),
    coachId: String(session.ownerCoachId),
    offeringId: String(offering._id),
    offeringTitle: offering.title,
    title: session.title,
    startAt: session.startAt.toISOString(),
    endAt: session.endAt.toISOString(),
    timezone: session.timezone,
    deliveryMode: session.deliveryMode,
    venue: session.venue
      ? {
          clubId: session.venue.clubId
            ? String(session.venue.clubId)
            : undefined,
          courtId: session.venue.courtId
            ? String(session.venue.courtId)
            : undefined,
          address: session.venue.address,
        }
      : null,
    capacity: session.capacity,
    bookedCount: session.bookedCount,
    remainingCapacity: Math.max(0, session.capacity - session.bookedCount),
    price:
      offering.pricingType === "per_session"
        ? offering.price
        : { amount: 0, currency: offering.price.currency },
    pricingType: offering.pricingType,
    cancellationPolicy: normalizeCoachCancellationPolicy(
      offering.cancellationPolicy,
    ),
    status: session.status,
    source: "coach",
  };
}

function publicPublicClubSessionForCoach(session: ReservableSessionDocument) {
  return {
    id: String(session._id),
    coachId: session.coachId ? String(session.coachId) : undefined,
    clubId: String(session.clubId),
    title: session.title,
    startAt: session.startsAt.toISOString(),
    endAt: session.endsAt.toISOString(),
    timezone: "Asia/Tehran",
    deliveryMode: "club",
    venue: {
      clubId: String(session.clubId),
      courtId: session.courtId ? String(session.courtId) : undefined,
    },
    capacity: session.capacity,
    bookedCount: session.reservedCount,
    remainingCapacity: Math.max(0, session.capacity - session.reservedCount),
    price: { amount: session.basePrice, currency: session.currency },
    cancellationPolicy: session.cancellationPolicy,
    status: session.status,
    source: "club",
  };
}

function publicClubSessionForCoach(session: ReservableSessionDocument) {
  return {
    id: String(session._id),
    coachId: session.coachId ? String(session.coachId) : undefined,
    title: session.title,
    startAt: session.startsAt.toISOString(),
    endAt: session.endsAt.toISOString(),
    timezone: "Asia/Tehran",
    deliveryMode: "club",
    venue: {
      clubId: String(session.clubId),
      courtId: session.courtId ? String(session.courtId) : undefined,
    },
    capacity: session.capacity,
    bookedCount: session.reservedCount,
    status: session.status,
    managedBy: "club",
  };
}

function parseDate(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, "DATE_INVALID", `${field} must be a valid date`);
  }
  return date;
}
