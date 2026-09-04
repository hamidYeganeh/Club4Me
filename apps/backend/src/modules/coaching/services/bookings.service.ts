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
    private readonly coaches: CoachesService,
    private readonly notifications: NotificationsService,
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
    try {
      const booking = await this.bookings.create({
        sessionId: session._id,
        offeringId: offering._id,
        coachId: session.ownerCoachId,
        athleteId: objectId(athleteUserId, "ATHLETE_NOT_FOUND"),
        status: offering.price.amount > 0 ? "pending" : "confirmed",
        priceSnapshot: offering.price,
        cancellationPolicySnapshot: cancellationPolicy,
        paymentStatus: offering.price.amount > 0 ? "pending" : "not_required",
      });
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

  async approveMockPayment(athleteUserId: string, bookingId: string) {
    const filter = {
      _id: objectId(bookingId, "BOOKING_NOT_FOUND"),
      athleteId: objectId(athleteUserId),
    };
    const booking = await this.bookings.findOne(filter).exec();
    if (!booking) {
      throw new AppError(404, "BOOKING_NOT_FOUND", "Booking not found");
    }
    const session = await this.sessions.findById(booking.sessionId).exec();
    if (!session) {
      throw new AppError(404, "SESSION_NOT_FOUND", "Session not found");
    }
    if (booking.paymentStatus === "paid" && booking.status === "confirmed") {
      return serializeBooking(booking, session);
    }
    const paid = await this.bookings
      .findOneAndUpdate(
        { ...filter, status: "pending", paymentStatus: "pending" },
        { $set: { status: "confirmed", paymentStatus: "paid" } },
        { new: true },
      )
      .exec();
    if (!paid) {
      throw new AppError(
        409,
        "PAYMENT_NOT_PENDING",
        "Booking does not have a pending payment",
      );
    }
    await this.notifications.notifyBookingConfirmed({
      userId: paid.athleteId,
      bookingId: paid._id,
      title: session.title,
    });
    return serializeBooking(paid, session);
  }

  async rejectMockPayment(athleteUserId: string, bookingId: string) {
    const rejected = await this.bookings
      .findOneAndUpdate(
        {
          _id: objectId(bookingId, "BOOKING_NOT_FOUND"),
          athleteId: objectId(athleteUserId),
          status: "pending",
          paymentStatus: "pending",
        },
        {
          $set: {
            status: "rejected",
            paymentStatus: "failed",
            cancellationReason: "Mock payment rejected",
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
        "Booking does not have a pending payment",
      );
    }
    const session = await this.sessions.findById(rejected.sessionId).exec();
    if (!session) {
      throw new AppError(404, "SESSION_NOT_FOUND", "Session not found");
    }
    await this.sessions.updateOne(
      { _id: session._id, bookedCount: { $gt: 0 } },
      { $inc: { bookedCount: -1 }, $set: { status: "open_for_booking" } },
    );
    await this.notifications.notifyPaymentFailed({
      userId: rejected.athleteId,
      paymentId: rejected._id,
      title: session.title,
    });
    return serializeBooking(rejected, session);
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
