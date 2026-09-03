import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../../common/errors/app.exception";
import type { ScheduleInput } from "../dto/coaching.dto";
import {
  ScheduleRule,
  type ScheduleRuleDocument,
  TrainingSession,
  type TrainingSessionDocument,
} from "../schemas/coaching.schemas";
import { toPublicDocument, zonedDateAtMinute } from "../coaching.utils";
import { TrainingClassesService } from "./classes.service";
import { SessionsService } from "./sessions.service";

@Injectable()
export class SchedulingService {
  constructor(
    @InjectModel(ScheduleRule.name)
    private readonly rules: Model<ScheduleRuleDocument>,
    @InjectModel(TrainingSession.name)
    private readonly sessions: Model<TrainingSessionDocument>,
    private readonly classes: TrainingClassesService,
    private readonly sessionService: SessionsService,
  ) {}

  async generate(userId: string, classId: string, input: ScheduleInput) {
    const trainingClass = await this.classes.requireOwnedDocument(
      userId,
      classId,
    );
    if (!["draft", "published"].includes(trainingClass.status)) {
      throw new AppError(
        409,
        "CLASS_SCHEDULE_LOCKED",
        "Sessions cannot be generated for this class",
      );
    }
    const rangeStart =
      input.startDate > trainingClass.courseStartAt
        ? input.startDate
        : trainingClass.courseStartAt;
    const rangeEnd =
      input.endDate < trainingClass.courseEndAt
        ? input.endDate
        : trainingClass.courseEndAt;
    if (rangeStart > rangeEnd) {
      throw new AppError(
        400,
        "SCHEDULE_OUTSIDE_CLASS",
        "Schedule does not overlap the class date range",
      );
    }

    const rule = await this.rules.create({
      classId: trainingClass._id,
      coachId: trainingClass.ownerCoachId,
      timezone: input.timezone,
      daysOfWeek: input.daysOfWeek,
      startMinute: input.startMinute,
      durationMinutes: input.durationMinutes,
      startDate: rangeStart,
      endDate: rangeEnd,
      repeatEveryWeeks: input.repeatEveryWeeks,
      venue: input.venue
        ? {
            ...input.venue,
            ...(input.venue.clubId
              ? { clubId: new Types.ObjectId(input.venue.clubId) }
              : {}),
          }
        : trainingClass.venue,
    });

    const occurrences = buildOccurrences(rangeStart, rangeEnd, input);
    const coachIds = trainingClass.coachAssignments.map(
      (assignment) => assignment.coachId,
    );
    for (const occurrence of occurrences) {
      await this.sessionService.assertNoConflict(
        coachIds,
        occurrence.startAt,
        occurrence.endAt,
      );
    }
    try {
      const created = await this.sessions.insertMany(
        occurrences.map((occurrence) => ({
          classId: trainingClass._id,
          ownerCoachId: trainingClass.ownerCoachId,
          coachAssignments: trainingClass.coachAssignments,
          sportId: trainingClass.sportId,
          title: trainingClass.title,
          ...occurrence,
          timezone: input.timezone,
          deliveryMode: trainingClass.deliveryMode,
          venue: input.venue ?? trainingClass.venue,
          capacity: trainingClass.capacity,
          status:
            trainingClass.status === "published"
              ? "open_for_booking"
              : "scheduled",
          generatedByScheduleRuleId: rule._id,
        })),
      );
      return {
        rule: toPublicDocument(rule),
        sessions: created.map(toPublicDocument),
      };
    } catch (error) {
      await this.rules.deleteOne({ _id: rule._id }).exec();
      if (isDuplicateKey(error)) {
        throw new AppError(
          409,
          "SESSION_ALREADY_EXISTS",
          "A class session already exists at one of these times",
        );
      }
      throw error;
    }
  }
}

function buildOccurrences(start: Date, end: Date, input: ScheduleInput) {
  const result: Array<{ startAt: Date; endAt: Date }> = [];
  const first = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const last = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
  );
  for (
    let cursor = new Date(first);
    cursor <= last;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const dayOffset = Math.floor(
      (cursor.getTime() - first.getTime()) / 86_400_000,
    );
    const weekOffset = Math.floor(dayOffset / 7);
    if (
      weekOffset % input.repeatEveryWeeks !== 0 ||
      !input.daysOfWeek.includes(cursor.getUTCDay())
    )
      continue;
    const startAt = zonedDateAtMinute(
      cursor,
      input.startMinute,
      input.timezone,
    );
    const endAt = new Date(startAt.getTime() + input.durationMinutes * 60_000);
    result.push({ startAt, endAt });
  }
  if (!result.length) {
    throw new AppError(
      400,
      "SCHEDULE_HAS_NO_OCCURRENCES",
      "Schedule does not produce any sessions",
    );
  }
  return result;
}

function isDuplicateKey(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === 11000,
  );
}
