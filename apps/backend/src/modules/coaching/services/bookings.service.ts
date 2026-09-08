import { CoachPackagePurchase } from "../schemas/coach-purchase.schema";
import { paymentDeadline } from "../../commerce/payment-deadline";
import {
  Atomic,
  inAtomicOperation,
} from "../../../infrastructure/database/atomic-operation";
import { CommerceService } from "../../commerce/commerce.service";
import { assertMockPaymentsEnabled } from "../../commerce/mock-payment-policy";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { AppError } from "../../../common/errors/app.exception";
import type { BookingStatus } from "../coaching.constants";
import {
  CoachOffering,
  type CoachOfferingDocument,
  SessionBooking,
  type SessionBookingDocument,
  TrainingSession,
  type TrainingSessionDocument,
} from "../schemas/coaching.schemas";
import { objectId, toPublicDocument } from "../coaching.utils";
import { CoachesService } from "./coaches.service";
import { NotificationsService } from "../../notifications/notifications.service";
import {
  calculateCoachBookingRefund,
  normalizeCoachCancellationPolicy,
} from "./coach-booking-policy";

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(SessionBooking.name)
    private readonly bookings: Model<SessionBookingDocument>,
    @InjectModel(TrainingSession.name)
    private readonly sessions: Model<TrainingSessionDocument>,
    @InjectModel(CoachOffering.name)
    private readonly offerings: Model<CoachOfferingDocument>,
    @InjectModel(CoachPackagePurchase.name)
    private readonly purchases: Model<CoachPackagePurchase>,
    private readonly coaches: CoachesService,
    private readonly notifications: NotificationsService,
    private readonly commerce: CommerceService,
  ) {}

  async listForCoach(userId: string) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    return this.listViews({ coachId: coach._id });
  }

  async listForAthlete(userId: string) {
    return this.listViews({
      athleteId: objectId(userId, "ATHLETE_NOT_FOUND"),
    });
  }

  @Atomic("bookings")
  async book(athleteUserId: string, sessionId: string) {
    const sessionObjectId = objectId(sessionId, "SESSION_NOT_FOUND");
    const session = await this.sessions.findById(sessionObjectId).exec();
    if (
      !session ||
      !["open_for_booking", "rescheduled"].includes(session.status)
    ) {
      throw new AppError(
        409,
        "SESSION_NOT_BOOKABLE",
        "Session is not open for booking",
      );
    }
    if (session.startAt <= new Date()) {
      throw new AppError(
        409,
        "SESSION_ALREADY_STARTED",
        "Past sessions cannot be booked",
      );
    }
    if (session.classId || !session.offeringId) {
      throw new AppError(
        409,
        "SESSION_REQUIRES_ENROLLMENT",
        "This session belongs to a class and cannot be booked directly",
      );
    }
    const offering = await this.offerings.findById(session.offeringId).exec();
    if (!offering || offering.status !== "published") {
      throw new AppError(
        409,
        "OFFERING_NOT_AVAILABLE",
        "Service is not available",
      );
    }
    const coach = await this.coaches.requireCoach(String(session.ownerCoachId));
    if (coach.reviewStatus !== "approved" || coach.visibility !== "public") {
      throw new AppError(
        409,
        "COACH_NOT_AVAILABLE",
        "Coach is not available for booking",
      );
    }
    const cancellationPolicy = normalizeCoachCancellationPolicy(
      offering.cancellationPolicy,
    );
    if (
      cancellationPolicy.reservationCutoffMinutes > 0 &&
      session.startAt.getTime() - Date.now() <
        cancellationPolicy.reservationCutoffMinutes * 60_000
    ) {
      throw new AppError(
        409,
        "RESERVATION_CUTOFF_REACHED",
        "Reservation cutoff has been reached",
      );
    }
    const existing = await this.bookings.findOne({
      sessionId: session._id,
      athleteId: objectId(athleteUserId, "ATHLETE_NOT_FOUND"),
    });
    if (
      existing &&
      !["rejected", "cancelled_by_athlete", "cancelled_by_coach"].includes(
        existing.status,
      )
    ) {
      throw new AppError(409, "ALREADY_BOOKED", "این سانس قبلاً رزرو شده است.");
    }
    const reserved = await this.sessions.findOneAndUpdate(
      {
        _id: session._id,
        status: { $in: ["open_for_booking", "rescheduled"] },
        $expr: { $lt: ["$bookedCount", "$capacity"] },
      },
      { $inc: { bookedCount: 1 } },
      { new: true },
    );
    if (!reserved)
      throw new AppError(
        409,
        "SESSION_FULL",
        "Session capacity has been reached",
      );
    let purchaseId: import("mongoose").Types.ObjectId | null = null;
    if (offering.pricingType !== "per_session") {
      // The enclosing transaction rolls capacity back if credit cannot be consumed.
      const credit = await this.purchases.findOneAndUpdate(
        {
          athleteId: objectId(athleteUserId),
          offeringId: offering._id,
          status: "active",
          activatedAt: { $lte: session.startAt },
          $and: [
            {
              $or: [
                { expiresAt: null },
                { expiresAt: { $gte: session.endAt } },
              ],
            },
            {
              $or: [
                { remainingSessions: null },
                { remainingSessions: { $gt: 0 } },
              ],
            },
          ],
        },
        [
          {
            $set: {
              usedSessions: { $add: [{ $ifNull: ["$usedSessions", 0] }, 1] },
              remainingSessions: {
                $cond: [
                  { $eq: ["$remainingSessions", null] },
                  null,
                  { $subtract: ["$remainingSessions", 1] },
                ],
              },
            },
          },
        ],
        { new: true, sort: { expiresAt: 1, purchasedAt: 1 } },
      );
      if (!credit)
        throw new AppError(
          409,
          "PACKAGE_CREDIT_REQUIRED",
          "برای این سانس بسته فعال با اعتبار کافی بخرید.",
        );
      purchaseId = credit._id;
    }
    const price = purchaseId
      ? { amount: 0, currency: offering.price.currency }
      : offering.price;
    try {
      const payload = {
        sessionId: session._id,
        offeringId: offering._id,
        coachId: session.ownerCoachId,
        athleteId: objectId(athleteUserId, "ATHLETE_NOT_FOUND"),
        status: price.amount > 0 ? "pending" : "confirmed",
        priceSnapshot: price,
        packagePurchaseId: purchaseId,
        cancellationPolicySnapshot: cancellationPolicy,
        paymentStatus: price.amount > 0 ? "pending" : "not_required",
        paymentExpiresAt:
          price.amount > 0 ? paymentDeadline(session.startAt) : null,
        bookedAt: new Date(),
        refundPercent: null,
        refundAmount: null,
      } as const;
      const booking = existing
        ? await this.bookings
            .findByIdAndUpdate(
              existing._id,
              {
                $set: payload,
                $unset: {
                  cancelledAt: 1,
                  cancellationReason: 1,
                  paymentFailureIntentId: 1,
                },
              },
              { new: true },
            )
            .orFail()
        : await this.bookings.create(payload);
      if (reserved.bookedCount >= reserved.capacity) {
        await this.sessions.updateOne(
          { _id: reserved._id },
          { $set: { status: "full" } },
        );
      }
      if (booking.status === "confirmed") {
        await this.notifications.notifyBookingConfirmed({
          userId: booking.athleteId,
          bookingId: booking._id,
          title: session.title,
        });
      }
      return serializeBooking(booking, session, offering);
    } catch (error) {
      if (inAtomicOperation()) {
        if (isDuplicateKey(error))
          throw new AppError(409, "ALREADY_BOOKED", "رزرو تکراری است.");
        throw error;
      }
      await this.sessions.updateOne(
        { _id: session._id, bookedCount: { $gt: 0 } },
        { $inc: { bookedCount: -1 }, $set: { status: "open_for_booking" } },
      );
      if (isDuplicateKey(error)) {
        throw new AppError(
          409,
          "ALREADY_BOOKED",
          "Athlete already booked this session",
        );
      }
      throw error;
    }
  }

  @Atomic("bookings")
  async updateByCoach(
    userId: string,
    bookingId: string,
    status: BookingStatus,
    reason?: string,
  ) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    const booking = await this.bookings
      .findOne({
        _id: objectId(bookingId, "BOOKING_NOT_FOUND"),
        coachId: coach._id,
      })
      .exec();
    if (!booking)
      throw new AppError(404, "BOOKING_NOT_FOUND", "Booking not found");
    const session = await this.sessions.findById(booking.sessionId).exec();
    if (!session)
      throw new AppError(404, "SESSION_NOT_FOUND", "Session not found");
    if (
      ["completed", "no_show"].includes(status) &&
      session.startAt > new Date()
    ) {
      throw new AppError(
        409,
        "SESSION_NOT_STARTED",
        "Attendance can only be finalized after the session starts",
      );
    }
    if (status === "confirmed" && booking.paymentStatus === "pending") {
      throw new AppError(
        409,
        "PAYMENT_REQUIRED",
        "Payment must be completed before booking confirmation",
      );
    }
    const policy = normalizeCoachCancellationPolicy(
      booking.cancellationPolicySnapshot,
    );
    const ownerCancelled =
      status === "cancelled_by_coach" || status === "rejected";
    const refundPercent = ownerCancelled
      ? policy.ownerCancellationRefundPercent
      : status === "no_show"
        ? policy.noShowRefundPercent
        : undefined;
    const updated = await this.transition(
      booking,
      status,
      reason,
      refundPercent === undefined ? undefined : { refundPercent },
    );
    if (status === "confirmed") {
      await this.notifications.notifyBookingConfirmed({
        userId: updated.athleteId,
        bookingId: updated._id,
        title: session.title,
      });
    } else if (status === "cancelled_by_coach" || status === "rejected") {
      await this.notifications.notifyBookingCancelled({
        userId: updated.athleteId,
        bookingId: updated._id,
        title: session.title,
      });
    }
    return serializeBooking(updated, session);
  }

  @Atomic("bookings")
  async cancelByAthlete(
    athleteUserId: string,
    bookingId: string,
    reason?: string,
  ) {
    const booking = await this.bookings
      .findOne({
        _id: objectId(bookingId, "BOOKING_NOT_FOUND"),
        athleteId: objectId(athleteUserId),
      })
      .exec();
    if (!booking)
      throw new AppError(404, "BOOKING_NOT_FOUND", "Booking not found");
    const session = await this.sessions.findById(booking.sessionId).exec();
    if (!session)
      throw new AppError(404, "SESSION_NOT_FOUND", "Session not found");
    if (session.startAt <= new Date()) {
      throw new AppError(
        409,
        "SESSION_ALREADY_STARTED",
        "A booking cannot be cancelled after the session starts",
      );
    }
    const policy = normalizeCoachCancellationPolicy(
      booking.cancellationPolicySnapshot,
    );
    const refund = calculateCoachBookingRefund(
      booking.priceSnapshot.amount,
      session.startAt,
      new Date(),
      policy,
    );
    const updated = await this.transition(
      booking,
      "cancelled_by_athlete",
      reason,
      refund,
    );
    await this.notifications.notifyBookingCancelled({
      userId: updated.athleteId,
      bookingId: updated._id,
      title: session.title,
    });
    return serializeBooking(updated, session);
  }

  async listRescheduleOptions(athleteUserId: string, bookingId: string) {
    const { booking, session, policy } = await this.prepareReschedule(
      athleteUserId,
      bookingId,
    );
    this.assertRescheduleCutoff(session, policy.rescheduleCutoffMinutes);
    const items = await this.sessions
      .find({
        _id: { $ne: session._id },
        ownerCoachId: booking.coachId,
        offeringId: booking.offeringId,
        classId: null,
        status: { $in: ["open_for_booking", "rescheduled"] },
        startAt: { $gt: new Date() },
        $expr: { $lt: ["$bookedCount", "$capacity"] },
      })
      .sort({ startAt: 1 })
      .limit(30)
      .exec();
    return { items: items.map(serializeRescheduleOption) };
  }

  @Atomic("bookings")
  async reschedule(
    athleteUserId: string,
    bookingId: string,
    targetSessionId: string,
    idempotencyKey: string,
  ) {
    const athleteId = objectId(athleteUserId, "ATHLETE_NOT_FOUND");
    const bookingObjectId = objectId(bookingId, "BOOKING_NOT_FOUND");
    const existing = await this.bookings
      .findOne({ _id: bookingObjectId, athleteId })
      .exec();
    if (
      existing?.rescheduleKey === idempotencyKey &&
      String(existing.sessionId) === targetSessionId
    ) {
      const replaySession = await this.sessions
        .findById(existing.sessionId)
        .exec();
      if (!replaySession)
        throw new AppError(404, "SESSION_NOT_FOUND", "Session not found");
      return serializeBooking(existing, replaySession);
    }
    const { booking, session, policy } = await this.prepareReschedule(
      athleteUserId,
      bookingId,
    );
    this.assertRescheduleCutoff(session, policy.rescheduleCutoffMinutes);
    if (String(session._id) === targetSessionId)
      throw new AppError(
        409,
        "RESCHEDULE_SAME_SESSION",
        "سانس جدید باید با سانس فعلی متفاوت باشد.",
      );
    const targetId = objectId(targetSessionId, "SESSION_NOT_FOUND");
    const target = await this.sessions.findOneAndUpdate(
      {
        _id: targetId,
        ownerCoachId: booking.coachId,
        offeringId: booking.offeringId,
        classId: null,
        status: { $in: ["open_for_booking", "rescheduled"] },
        startAt: { $gt: new Date() },
        $expr: { $lt: ["$bookedCount", "$capacity"] },
      },
      { $inc: { bookedCount: 1 } },
      { new: true },
    );
    if (!target)
      throw new AppError(
        409,
        "RESCHEDULE_SESSION_UNAVAILABLE",
        "سانس انتخابی دیگر قابل رزرو نیست.",
      );
    const updated = await this.bookings.findOneAndUpdate(
      {
        _id: booking._id,
        athleteId,
        sessionId: session._id,
        status: "confirmed",
      },
      {
        $set: { sessionId: target._id, rescheduleKey: idempotencyKey },
        $push: {
          rescheduleHistory: {
            fromSessionId: session._id,
            toSessionId: target._id,
            changedAt: new Date(),
          },
        },
      },
      { new: true },
    );
    if (!updated)
      throw new AppError(
        409,
        "BOOKING_STATUS_CHANGED",
        "وضعیت رزرو پیش از ثبت تغییر کرد.",
      );
    await this.sessions.updateOne(
      { _id: session._id, bookedCount: { $gt: 0 } },
      { $inc: { bookedCount: -1 }, $set: { status: "open_for_booking" } },
    );
    if (target.bookedCount >= target.capacity)
      await this.sessions.updateOne(
        { _id: target._id },
        { $set: { status: "full" } },
      );
    await this.notifications.notifyBookingRescheduled({
      userId: updated.athleteId,
      bookingId: updated._id,
      title: target.title,
      startAt: target.startAt,
    });
    return serializeBooking(updated, target);
  }

  private async prepareReschedule(athleteUserId: string, bookingId: string) {
    const booking = await this.bookings
      .findOne({
        _id: objectId(bookingId, "BOOKING_NOT_FOUND"),
        athleteId: objectId(athleteUserId),
      })
      .exec();
    if (!booking)
      throw new AppError(404, "BOOKING_NOT_FOUND", "Booking not found");
    if (
      booking.status !== "confirmed" ||
      !["paid", "not_required"].includes(booking.paymentStatus)
    )
      throw new AppError(
        409,
        "BOOKING_NOT_RESCHEDULABLE",
        "فقط رزرو فعال و پرداخت‌شده قابل تغییر زمان است.",
      );
    const session = await this.sessions.findById(booking.sessionId).exec();
    if (!session)
      throw new AppError(404, "SESSION_NOT_FOUND", "Session not found");
    return {
      booking,
      session,
      policy: normalizeCoachCancellationPolicy(
        booking.cancellationPolicySnapshot,
      ),
    };
  }

  private assertRescheduleCutoff(
    session: TrainingSessionDocument,
    cutoffMinutes: number,
  ) {
    if (
      session.startAt <= new Date() ||
      session.startAt.getTime() - Date.now() < cutoffMinutes * 60_000
    )
      throw new AppError(
        409,
        "RESCHEDULE_CUTOFF_REACHED",
        "مهلت تغییر زمان این رزرو تمام شده است.",
      );
  }

  async approveMockPayment(userId: string, bookingId: string) {
    return this.resolvePayment(userId, bookingId, "paid");
  }
  async rejectMockPayment(userId: string, bookingId: string) {
    return this.resolvePayment(userId, bookingId, "failed");
  }
  private async resolvePayment(
    userId: string,
    bookingId: string,
    status: "paid" | "failed",
  ) {
    assertMockPaymentsEnabled();
    const filter = { _id: objectId(bookingId), athleteId: objectId(userId) };
    const booking = await this.bookings.findOne(filter).exec();
    if (!booking)
      throw new AppError(404, "BOOKING_NOT_FOUND", "رزرو پیدا نشد.");
    if (booking.paymentStatus !== status) {
      const intent = await this.commerce.createIntent(userId, {
        referenceType: "coach_booking",
        referenceId: bookingId,
        idempotencyKey: `coach-booking-${bookingId}-${booking.bookedAt.getTime()}`,
        walletAmount: 0,
        returnUrl: "https://app.gym4me.ir/athlete/reservations",
      });
      await this.commerce.simulate(userId, intent.id, status);
    }
    const current = await this.bookings.findOne(filter).exec();
    const session = await this.sessions.findById(booking.sessionId).exec();
    if (!current || !session)
      throw new AppError(404, "BOOKING_NOT_FOUND", "رزرو پیدا نشد.");
    return serializeBooking(current, session);
  }

  private async listViews(filter: Record<string, unknown>) {
    const items = await this.bookings
      .find(filter)
      .sort({ bookedAt: -1 })
      .exec();
    const sessionIds = items.map((item) => item.sessionId);
    const offeringIds = items.flatMap((item) =>
      item.offeringId ? [item.offeringId] : [],
    );
    const [sessions, offerings] = await Promise.all([
      this.sessions.find({ _id: { $in: sessionIds } }).exec(),
      this.offerings.find({ _id: { $in: offeringIds } }).exec(),
    ]);
    const sessionsById = new Map(
      sessions.map((item) => [String(item._id), item]),
    );
    const offeringsById = new Map(
      offerings.map((item) => [String(item._id), item]),
    );
    return {
      items: items.flatMap((booking) => {
        const session = sessionsById.get(String(booking.sessionId));
        const offering = booking.offeringId
          ? offeringsById.get(String(booking.offeringId))
          : undefined;
        return session ? [serializeBooking(booking, session, offering)] : [];
      }),
    };
  }

  private async transition(
    booking: SessionBookingDocument,
    status: BookingStatus,
    reason?: string,
    refund?: { refundPercent: number; refundAmount?: number },
  ): Promise<SessionBookingDocument> {
    const activeBefore =
      booking.status === "pending" || booking.status === "confirmed";
    assertBookingTransition(booking.status, status);
    const releasesCapacity = [
      "rejected",
      "cancelled_by_athlete",
      "cancelled_by_coach",
    ].includes(status);
    const cancelledAt = status.startsWith("cancelled") ? new Date() : undefined;
    const update: Record<string, unknown> = {
      status,
      cancellationReason: reason?.trim(),
      ...(cancelledAt ? { cancelledAt } : {}),
      ...(refund
        ? {
            refundPercent: refund.refundPercent,
            refundAmount:
              refund.refundAmount ??
              Math.floor(
                (booking.priceSnapshot.amount * refund.refundPercent) / 100,
              ),
          }
        : {}),
      ...(booking.paymentStatus === "pending" && releasesCapacity
        ? { paymentStatus: "failed" }
        : {}),
      ...(booking.paymentStatus === "paid" &&
      refund &&
      (refund.refundAmount ??
        Math.floor(
          (booking.priceSnapshot.amount * refund.refundPercent) / 100,
        )) > 0
        ? { paymentStatus: "refunded" }
        : {}),
    };
    const updated = await this.bookings
      .findOneAndUpdate(
        { _id: booking._id, status: booking.status },
        { $set: update },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new AppError(
        409,
        "BOOKING_STATUS_CHANGED",
        "Booking status changed before this action completed",
      );
    }
    if (activeBefore && releasesCapacity) {
      await this.sessions.updateOne(
        { _id: booking.sessionId, bookedCount: { $gt: 0 } },
        { $inc: { bookedCount: -1 }, $set: { status: "open_for_booking" } },
      );
    }
    if (
      activeBefore &&
      releasesCapacity &&
      booking.packagePurchaseId &&
      (status === "cancelled_by_coach" ||
        status === "rejected" ||
        (refund?.refundPercent ?? 0) === 100)
    ) {
      await this.purchases.updateOne({ _id: booking.packagePurchaseId }, [
        {
          $set: {
            usedSessions: { $max: [0, { $subtract: ["$usedSessions", 1] }] },
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
    if (booking.paymentStatus === "paid" && (updated.refundAmount ?? 0) > 0)
      await this.commerce.refundCoaching(
        "coach_booking",
        booking._id,
        updated.refundAmount!,
      );
    return updated;
  }
}

function serializeBooking(
  booking: SessionBookingDocument,
  session: TrainingSessionDocument,
  offering?: CoachOfferingDocument,
) {
  return {
    ...toPublicDocument(booking),
    sessionTitle: session.title,
    sessionStartsAt: session.startAt.toISOString(),
    sessionEndsAt: session.endAt.toISOString(),
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
          onlineUrl: session.venue.onlineUrl,
        }
      : null,
    offeringTitle: offering?.title ?? null,
  };
}

function serializeRescheduleOption(session: TrainingSessionDocument) {
  return {
    id: String(session._id),
    title: session.title,
    startAt: session.startAt.toISOString(),
    endAt: session.endAt.toISOString(),
    deliveryMode: session.deliveryMode,
    venue: session.venue ?? null,
    remainingCapacity: Math.max(0, session.capacity - session.bookedCount),
  };
}

function assertBookingTransition(from: BookingStatus, to: BookingStatus) {
  const allowed: Record<BookingStatus, BookingStatus[]> = {
    pending: [
      "confirmed",
      "rejected",
      "cancelled_by_athlete",
      "cancelled_by_coach",
    ],
    confirmed: [
      "cancelled_by_athlete",
      "cancelled_by_coach",
      "completed",
      "no_show",
    ],
    rejected: [],
    cancelled_by_athlete: [],
    cancelled_by_coach: [],
    completed: [],
    no_show: [],
  };
  if (from !== to && !allowed[from].includes(to)) {
    throw new AppError(
      409,
      "BOOKING_STATUS_TRANSITION_INVALID",
      `Cannot change booking status from ${from} to ${to}`,
    );
  }
}

function isDuplicateKey(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === 11000,
  );
}
