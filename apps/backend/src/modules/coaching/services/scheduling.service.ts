import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../../common/errors/app.exception";
import { ClubsRepository } from "../../clubs/clubs.repository";
import type { ScheduleInput } from "../dto/coaching.dto";
import {
  ScheduleRule,
  type ScheduleRuleDocument,
  TrainingSession,
  type TrainingSessionDocument,
} from "../schemas/coaching.schemas";
import {
  ReservableSession,
  type ReservableSessionDocument,
} from "../../reservations/schemas/reservable-session.schema";
import {
  Court,
  type CourtDocument,
} from "../../reservations/schemas/court.schema";
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
    @InjectModel(ReservableSession.name)
    private readonly reservableSessions: Model<ReservableSessionDocument>,
    @InjectModel(Court.name)
    private readonly courts: Model<CourtDocument>,
    private readonly classes: TrainingClassesService,
    private readonly sessionService: SessionsService,
    private readonly clubs: ClubsRepository,
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
    const court = trainingClass.courtId
      ? await this.courts
          .findOne({
            _id: trainingClass.courtId,
            clubId: trainingClass.clubId,
            status: "active",
            isReservable: true,
          })
          .exec()
      : null;
    if (trainingClass.courtId && !court) {
      throw new AppError(
        409,
        "COURT_NOT_RESERVABLE",
        "The class court is no longer reservable",
      );
    }
    for (const occurrence of occurrences) {
      await this.sessionService.assertNoConflict(
        coachIds,
        occurrence.startAt,
        occurrence.endAt,
      );
      if (court) {
        const overlap = await this.reservableSessions.exists({
          courtId: court._id,
          status: "active",
          startsAt: {
            $lt: new Date(
              occurrence.endAt.getTime() + court.cleanupMinutes * 60_000,
            ),
          },
          endsAt: {
            $gt: new Date(
              occurrence.startAt.getTime() - court.preparationMinutes * 60_000,
            ),
          },
        });
        if (overlap) {
          throw new AppError(
            409,
            "COURT_SESSION_OVERLAP",
            "The court already has a session in this time range",
          );
        }
      }
    }
    const selectedVenue = input.venue
      ? {
          ...(input.venue.clubId
            ? { clubId: new Types.ObjectId(input.venue.clubId) }
            : {}),
          ...(input.venue.address ? { address: input.venue.address } : {}),
          ...(input.venue.onlineUrl
            ? { onlineUrl: input.venue.onlineUrl }
            : {}),
        }
      : trainingClass.venue;
    const sessionVenue =
      selectedVenue || trainingClass.clubId
        ? {
            ...selectedVenue,
            ...(trainingClass.clubId ? { clubId: trainingClass.clubId } : {}),
            ...(trainingClass.courtId
              ? { courtId: trainingClass.courtId }
              : {}),
          }
        : undefined;
    let created: TrainingSessionDocument[] = [];
    try {
      created = await this.sessions.insertMany(
        occurrences.map((occurrence) => ({
          classId: trainingClass._id,
          ownerCoachId: trainingClass.ownerCoachId,
          coachAssignments: trainingClass.coachAssignments,
          sportId: trainingClass.sportId,
          title: trainingClass.title,
          ...occurrence,
          timezone: input.timezone,
          deliveryMode: trainingClass.deliveryMode,
          venue: sessionVenue,
          capacity: trainingClass.capacity,
          status:
            trainingClass.status === "published"
              ? "open_for_booking"
              : "scheduled",
          generatedByScheduleRuleId: rule._id,
        })),
      );
      if (trainingClass.deliveryMode === "club" && trainingClass.clubId) {
        const club = await this.clubs.findById(
          trainingClass.clubId.toHexString(),
        );
        const sessionOptions = [
          ...trainingClass.requiredEquipmentIds.flatMap((resourceId) => {
            const item = club.equipment.find(
              (equipment) => equipment.equipmentId === resourceId.toHexString(),
            );
            return item &&
              item.status === "available" &&
              item.reservableQuantity > 0
              ? [
                  {
                    type: "equipment" as const,
                    resourceId,
                    availableQuantity: item.reservableQuantity,
                    maxPerReservation: item.reservableQuantity,
                    unitPrice: 0,
                  },
                ]
              : [];
          }),
          ...trainingClass.amenityIds.flatMap((resourceId) => {
            const item = club.amenities.find(
              (amenity) => amenity.amenityId === resourceId.toHexString(),
            );
            return item &&
              item.availability !== "unavailable" &&
              (item.quantity ?? 0) > 0
              ? [
                  {
                    type: "amenity" as const,
                    resourceId,
                    availableQuantity: item.quantity!,
                    maxPerReservation: item.quantity!,
                    unitPrice:
                      item.availability === "paid"
                        ? (item.price?.amount ?? 0)
                        : 0,
                  },
                ]
              : [];
          }),
        ];
        for (const session of created) {
          const classCancellation = trainingClass.cancellationPolicy as {
            id?: string;
            title?: string;
            version?: number;
            tiers?: Array<{ hoursBefore: number; refundPercent: number }>;
            reservationCutoffMinutes?: number;
            rescheduleCutoffMinutes?: number;
            noShowRefundPercent?: number;
            ownerCancellationRefundPercent?: number;
          } | null;
          const clubCancellation = [...club.cancellationRules]
            .filter(
              (policy) =>
                policy.isActive &&
                (!policy.sessionTypes.length ||
                  policy.sessionTypes.includes("class")) &&
                (!policy.daysOfWeek.length ||
                  policy.daysOfWeek.includes(
                    weekdayInTimezone(session.startAt, input.timezone),
                  )) &&
                (!policy.courtIds.length ||
                  Boolean(
                    trainingClass.courtId &&
                    policy.courtIds.includes(
                      trainingClass.courtId.toHexString(),
                    ),
                  )),
            )
            .sort((a, b) => b.priority - a.priority)[0];
          const cancellation = classCancellation ?? clubCancellation;
          const reservable = await this.reservableSessions.create({
            clubId: trainingClass.clubId,
            courtId: trainingClass.courtId,
            coachId: trainingClass.ownerCoachId,
            classId: trainingClass._id,
            classSessionId: session._id,
            title: trainingClass.title,
            startsAt: session.startAt,
            endsAt: session.endAt,
            capacity: trainingClass.capacity,
            basePrice: trainingClass.price.amount,
            currency: trainingClass.price.currency,
            pricingUnit: "per_participant",
            options: sessionOptions,
            cancellationPolicy: {
              policyId:
                cancellation?.id && Types.ObjectId.isValid(cancellation.id)
                  ? new Types.ObjectId(cancellation.id)
                  : undefined,
              title: cancellation?.title ?? "قانون لغو کلاس",
              version: cancellation?.version ?? 1,
              tiers: cancellation?.tiers?.length
                ? cancellation.tiers
                : [{ hoursBefore: 0, refundPercent: 0 }],
              reservationCutoffMinutes:
                cancellation?.reservationCutoffMinutes ?? 0,
              rescheduleCutoffMinutes:
                cancellation?.rescheduleCutoffMinutes ?? 0,
              noShowRefundPercent: cancellation?.noShowRefundPercent ?? 0,
              ownerCancellationRefundPercent:
                cancellation?.ownerCancellationRefundPercent ?? 100,
            },
            status:
              trainingClass.status === "published" ? "active" : "cancelled",
          });
          session.reservableSessionId = reservable._id;
          await session.save();
        }
      }
      return {
        rule: toPublicDocument(rule),
        sessions: created.map(toPublicDocument),
      };
    } catch (error) {
      if (created.length) {
        await this.reservableSessions
          .deleteMany({
            classSessionId: { $in: created.map((item) => item._id) },
          })
          .exec();
        await this.sessions
          .deleteMany({ generatedByScheduleRuleId: rule._id })
          .exec();
      }
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

function weekdayInTimezone(date: Date, timezone: string): number {
  const value = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(value);
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
