import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../../common/errors/app.exception";
import type { SessionInput } from "../dto/coaching.dto";
import {
  CoachOffering,
  type CoachOfferingDocument,
  TrainingSession,
  type TrainingSessionDocument,
} from "../schemas/coaching.schemas";
import { objectId, toPublicDocument } from "../coaching.utils";
import { CoachesService } from "./coaches.service";

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(TrainingSession.name)
    private readonly sessions: Model<TrainingSessionDocument>,
    @InjectModel(CoachOffering.name)
    private readonly offerings: Model<CoachOfferingDocument>,
    private readonly coaches: CoachesService,
  ) {}

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
    const items = await this.sessions
      .find(filter)
      .sort({ startAt: 1 })
      .limit(1000)
      .exec();
    return { items: items.map(toPublicDocument) };
  }

  async listForClass(userId: string, classId: string) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    const items = await this.sessions
      .find({ classId: objectId(classId), ownerCoachId: coach._id })
      .sort({ startAt: 1 })
      .exec();
    return { items: items.map(toPublicDocument) };
  }

  async createStandalone(userId: string, input: SessionInput) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    let priceOffering: CoachOfferingDocument | null = null;
    if (input.offeringId) {
      priceOffering = await this.offerings
        .findOne({ _id: objectId(input.offeringId), coachId: coach._id })
        .exec();
      if (!priceOffering)
        throw new AppError(404, "OFFERING_NOT_FOUND", "Service not found");
    }
    await this.assertNoConflict([coach._id], input.startAt, input.endAt);
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
    return toPublicDocument(session);
  }

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
}

function parseDate(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, "DATE_INVALID", `${field} must be a valid date`);
  }
  return date;
}
