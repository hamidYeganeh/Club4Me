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
  ) {}

  async listForCoach(userId: string) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    const items = await this.bookings
      .find({ coachId: coach._id })
      .sort({ bookedAt: -1 })
      .exec();
    return { items: items.map(toPublicDocument) };
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
    if (!session.offeringId) {
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
        status: "confirmed",
        priceSnapshot: offering.price,
        paymentStatus: offering.price.amount > 0 ? "pending" : "not_required",
      });
      if (reserved.bookedCount >= reserved.capacity) {
        await this.sessions.updateOne(
          { _id: reserved._id },
          { $set: { status: "full" } },
        );
      }
      return toPublicDocument(booking);
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
    await this.transition(booking, status, reason);
    return toPublicDocument(booking);
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
    await this.transition(booking, "cancelled_by_athlete", reason);
    return toPublicDocument(booking);
  }

  private async transition(
    booking: SessionBookingDocument,
    status: BookingStatus,
    reason?: string,
  ) {
    const activeBefore =
      booking.status === "pending" || booking.status === "confirmed";
    const activeAfter = status === "pending" || status === "confirmed";
    assertBookingTransition(booking.status, status);
    if (activeBefore && !activeAfter) {
      await this.sessions.updateOne(
        { _id: booking.sessionId, bookedCount: { $gt: 0 } },
        { $inc: { bookedCount: -1 }, $set: { status: "open_for_booking" } },
      );
      booking.cancelledAt = status.startsWith("cancelled")
        ? new Date()
        : undefined;
    }
    booking.status = status;
    booking.cancellationReason = reason?.trim();
    await booking.save();
  }
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
