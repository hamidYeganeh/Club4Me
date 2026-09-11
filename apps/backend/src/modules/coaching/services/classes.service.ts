import { withMediaReferences } from "../../media/media-references";
import {
  withReferenceSummaries,
  classDisplayReferences,
} from "../../../common/utils/reference-summaries";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../../common/errors/app.exception";
import { slugify } from "../../articles/lib/slugify";
import { MediaService } from "../../media/media.service";
import { ResourcesService } from "../../resources/resources.service";
import { NotificationsService } from "../../notifications/notifications.service";
import { ClubMembershipsService } from "../../clubs/club-memberships.service";
import { ClubsRepository } from "../../clubs/clubs.repository";
import {
  Court,
  type CourtDocument,
} from "../../reservations/schemas/court.schema";
import {
  ReservableSession,
  type ReservableSessionDocument,
} from "../../reservations/schemas/reservable-session.schema";
import type { ClassInput } from "../dto/coaching.dto";
import {
  CoachOffering,
  type CoachOfferingDocument,
  TrainingClass,
  type TrainingClassDocument,
  TrainingSession,
  type TrainingSessionDocument,
} from "../schemas/coaching.schemas";
import {
  normalizeText,
  objectId,
  toPublicDocument,
  uniqueObjectIds,
} from "../coaching.utils";
import { CoachesService } from "./coaches.service";

@Injectable()
export class TrainingClassesService {
  constructor(
    @InjectModel(TrainingClass.name)
    private readonly classes: Model<TrainingClassDocument>,
    @InjectModel(TrainingSession.name)
    private readonly sessions: Model<TrainingSessionDocument>,
    @InjectModel(CoachOffering.name)
    private readonly offerings: Model<CoachOfferingDocument>,
    @InjectModel(Court.name)
    private readonly courts: Model<CourtDocument>,
    @InjectModel(ReservableSession.name)
    private readonly reservableSessions: Model<ReservableSessionDocument>,
    private readonly coaches: CoachesService,
    private readonly resources: ResourcesService,
    private readonly media: MediaService,
    private readonly memberships: ClubMembershipsService,
    private readonly clubs: ClubsRepository,
    private readonly notifications: NotificationsService,
  ) {}

  private async present(rows: Record<string, unknown>[]) {
    return withMediaReferences(
      this.media,
      await withReferenceSummaries(
        this.classes.db,
        rows,
        classDisplayReferences,
      ),
    );
  }

  async list(userId: string) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    const items = await this.classes
      .find({ "coachAssignments.coachId": coach._id })
      .sort({ updatedAt: -1 })
      .exec();
    return { items: await this.present(items.map(toPublicDocument)) };
  }

  async listForAdmin(query?: string, status?: string) {
    const filter: Record<string, unknown> = {};
    if (query?.trim()) {
      filter.normalizedTitle = new RegExp(
        escapeRegex(normalizeText(query.trim())),
        "i",
      );
    }
    if (status?.trim()) {
      if (!CLASS_STATUS_VALUES.includes(status as ClassInputStatus)) {
        throw new AppError(400, "CLASS_STATUS_INVALID", "Invalid class status");
      }
      filter.status = status;
    }
    const items = await this.classes
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(500)
      .exec();
    return { items: await this.present(items.map(toPublicDocument)) };
  }

  async disableForAdmin(classId: string) {
    const trainingClass = await this.classes
      .findById(objectId(classId, "CLASS_NOT_FOUND"))
      .exec();
    if (!trainingClass) {
      throw new AppError(404, "CLASS_NOT_FOUND", "Class not found");
    }
    trainingClass.status = "archived";
    await trainingClass.save();
    await Promise.all([
      this.sessions.updateMany(
        {
          classId: trainingClass._id,
          status: { $nin: ["completed", "cancelled"] },
        },
        { $set: { status: "cancelled" } },
      ),
      this.reservableSessions.updateMany(
        { classId: trainingClass._id, status: "active" },
        { $set: { status: "cancelled" } },
      ),
    ]);
    return toPublicDocument(trainingClass);
  }

  async create(userId: string, input: ClassInput) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    await this.validateReferences(userId, coach._id, input);
    const id = new Types.ObjectId();
    const assignments = normalizeAssignments(coach._id, input.coachAssignments);
    const created = await this.classes.create({
      _id: id,
      ownerCoachId: coach._id,
      ...toClassPersistence(input),
      coachAssignments: assignments,
      slug: `${slugify(input.title) || "class"}-${id.toHexString().slice(-8)}`,
      clubApprovalStatus: input.clubId ? "pending" : "not_required",
      status: "draft",
    });
    return toPublicDocument(created);
  }

  async get(userId: string, classId: string) {
    return (
      await this.present([
        toPublicDocument(await this.requireOwnedDocument(userId, classId)),
      ])
    )[0]!;
  }

  async update(userId: string, classId: string, input: Partial<ClassInput>) {
    const trainingClass = await this.requireOwnedDocument(userId, classId);
    if (["completed", "cancelled", "archived"].includes(trainingClass.status)) {
      throw new AppError(
        409,
        "CLASS_NOT_EDITABLE",
        "Class cannot be edited in its current state",
      );
    }
    const effectiveClubId =
      input.clubId === undefined
        ? trainingClass.clubId?.toHexString()
        : (input.clubId ?? undefined);
    const effectiveCourtId =
      input.clubId === null && input.courtId === undefined
        ? undefined
        : input.courtId === undefined
          ? trainingClass.courtId?.toHexString()
          : (input.courtId ?? undefined);
    await this.validateReferences(userId, trainingClass.ownerCoachId, {
      ...input,
      clubId: effectiveClubId,
      courtId: effectiveCourtId,
    });
    const nextStart = input.courseStartAt ?? trainingClass.courseStartAt;
    const nextEnd = input.courseEndAt ?? trainingClass.courseEndAt;
    if (nextStart >= nextEnd) {
      throw new AppError(
        400,
        "CLASS_DATES_INVALID",
        "Course end must be after start",
      );
    }
    if (
      input.capacity !== undefined &&
      input.capacity < trainingClass.enrollmentCount
    ) {
      throw new AppError(
        409,
        "CLASS_CAPACITY_TOO_LOW",
        "Capacity cannot be lower than active enrollments",
      );
    }
    const registrationStart =
      input.registrationStartAt === undefined
        ? trainingClass.registrationStartAt
        : input.registrationStartAt;
    const registrationEnd =
      input.registrationEndAt === undefined
        ? trainingClass.registrationEndAt
        : input.registrationEndAt;
    if (
      registrationStart &&
      registrationEnd &&
      registrationStart >= registrationEnd
    ) {
      throw new AppError(
        400,
        "CLASS_REGISTRATION_DATES_INVALID",
        "Registration end must be after start",
      );
    }
    if (registrationEnd && registrationEnd > nextEnd) {
      throw new AppError(
        400,
        "CLASS_REGISTRATION_AFTER_COURSE",
        "Registration cannot end after the course",
      );
    }
    const minAge =
      input.minAge === undefined ? trainingClass.minAge : input.minAge;
    const maxAge =
      input.maxAge === undefined ? trainingClass.maxAge : input.maxAge;
    if (minAge != null && maxAge != null && minAge > maxAge) {
      throw new AppError(
        400,
        "CLASS_AGE_RANGE_INVALID",
        "Maximum age must be at least minimum age",
      );
    }
    const previousClubId = trainingClass.clubId?.toHexString();
    Object.assign(trainingClass, toClassPersistence(input));
    if (trainingClass.clubId) {
      trainingClass.clubApprovalStatus = "pending";
    } else if (input.clubId !== undefined && input.clubId !== previousClubId) {
      trainingClass.clubApprovalStatus = "not_required";
    }
    if (input.coachAssignments) {
      trainingClass.coachAssignments = normalizeAssignments(
        trainingClass.ownerCoachId,
        input.coachAssignments,
      );
    }
    await trainingClass.save();
    if (
      trainingClass.clubId &&
      trainingClass.clubApprovalStatus === "pending"
    ) {
      await this.reservableSessions.updateMany(
        { classId: trainingClass._id, status: "active" },
        { $set: { status: "cancelled" } },
      );
    }
    return toPublicDocument(trainingClass);
  }

  async updateStatus(
    userId: string,
    classId: string,
    status: ClassInputStatus,
  ) {
    const trainingClass = await this.requireOwnedDocument(userId, classId);
    if (status === "published") {
      const coach = await this.coaches.requireOwnedCoach(userId);
      if (coach.reviewStatus !== "approved") {
        throw new AppError(
          409,
          "COACH_NOT_APPROVED",
          "Coach profile must be approved before publishing classes",
        );
      }
      if (
        trainingClass.clubId &&
        trainingClass.clubApprovalStatus !== "approved"
      ) {
        throw new AppError(
          409,
          "CLASS_NOT_APPROVED_BY_CLUB",
          "The club owner must approve this class before publishing",
        );
      }
      const sessionCount = await this.sessions.countDocuments({
        classId: trainingClass._id,
        status: { $ne: "cancelled" },
      });
      if (!sessionCount) {
        throw new AppError(
          409,
          "CLASS_HAS_NO_SESSIONS",
          "Create at least one session before publishing the class",
        );
      }
    }
    const previousStatus = trainingClass.status;
    assertClassTransition(previousStatus, status);
    trainingClass.status = status;
    await trainingClass.save();
    if (status === "published") {
      await this.sessions.updateMany(
        { classId: trainingClass._id, status: "scheduled" },
        { $set: { status: "open_for_booking" } },
      );
      await this.reservableSessions.updateMany(
        { classId: trainingClass._id, status: "cancelled" },
        { $set: { status: "active" } },
      );
      if (previousStatus !== "published") {
        await this.notifications.notifyClassPublished({
          classId: trainingClass._id,
          title: trainingClass.title,
          coachId: trainingClass.ownerCoachId,
          ...(trainingClass.clubId ? { clubId: trainingClass.clubId } : {}),
        });
      }
    }
    if (status === "cancelled") {
      await this.sessions.updateMany(
        {
          classId: trainingClass._id,
          status: { $nin: ["completed", "cancelled"] },
        },
        { $set: { status: "cancelled" } },
      );
      await this.reservableSessions.updateMany(
        { classId: trainingClass._id, status: "active" },
        { $set: { status: "cancelled" } },
      );
    }
    return toPublicDocument(trainingClass);
  }

  async listPublic(query: {
    sportId?: string;
    coachId?: string;
    clubId?: string;
  }) {
    const filter: Record<string, unknown> = {
      status: { $in: ["published", "in_progress"] },
      $or: [
        { clubId: { $exists: false } },
        { clubId: null },
        { clubApprovalStatus: "approved" },
      ],
    };
    if (query.sportId) filter.sportId = objectId(query.sportId);
    if (query.coachId)
      filter["coachAssignments.coachId"] = objectId(query.coachId);
    if (query.clubId) filter.clubId = objectId(query.clubId);
    const items = await this.classes
      .find(filter)
      .sort({ courseStartAt: 1 })
      .limit(100)
      .exec();
    return { items: await this.present(items.map(toPublicDocument)) };
  }

  async listPublicCoachIdsByClub(clubId: string): Promise<string[]> {
    const ids = await this.classes.distinct("coachAssignments.coachId", {
      clubId: objectId(clubId, "CLUB_NOT_FOUND"),
      status: { $in: ["published", "registration_closed", "in_progress"] },
      clubApprovalStatus: "approved",
    });
    return ids.map(String);
  }

  async listForClubOwner(ownerId: string, clubId: string) {
    await this.clubs.findForOwner(ownerId, clubId);
    const items = await this.classes
      .find({ clubId: objectId(clubId, "CLUB_NOT_FOUND") })
      .sort({ updatedAt: -1 })
      .exec();
    return { items: await this.present(items.map(toPublicDocument)) };
  }

  async reviewForClubOwner(
    ownerId: string,
    clubId: string,
    classId: string,
    status: "approved" | "rejected",
  ) {
    await this.clubs.findForOwner(ownerId, clubId);
    const trainingClass = await this.classes
      .findOneAndUpdate(
        {
          _id: objectId(classId, "CLASS_NOT_FOUND"),
          clubId: objectId(clubId, "CLUB_NOT_FOUND"),
          clubApprovalStatus: "pending",
        },
        { $set: { clubApprovalStatus: status } },
        { new: true },
      )
      .exec();
    if (!trainingClass) {
      throw new AppError(404, "CLASS_NOT_FOUND", "Class not found");
    }
    if (status === "approved" && trainingClass.status === "published") {
      await this.reservableSessions.updateMany(
        { classId: trainingClass._id, status: "cancelled" },
        { $set: { status: "active" } },
      );
    }
    return toPublicDocument(trainingClass);
  }

  async getPublicBySlug(slug: string) {
    const trainingClass = await this.classes
      .findOne({
        slug,
        status: {
          $in: ["published", "registration_closed", "in_progress", "completed"],
        },
        $or: [
          { clubId: { $exists: false } },
          { clubId: null },
          { clubApprovalStatus: "approved" },
        ],
      })
      .exec();
    if (!trainingClass)
      throw new AppError(404, "CLASS_NOT_FOUND", "Class not found");
    const sessions = await this.sessions
      .find({ classId: trainingClass._id, status: { $ne: "cancelled" } })
      .select(
        "title startAt endAt timezone deliveryMode venue capacity bookedCount status",
      )
      .sort({ startAt: 1 })
      .exec();
    return (await this.present([{
      ...toPublicDocument(trainingClass),
      sessions: sessions.map(toPublicDocument),
    }]))[0]!;
  }

  async requireOwnedDocument(
    userId: string,
    classId: string,
  ): Promise<TrainingClassDocument> {
    const coach = await this.coaches.requireOwnedCoach(userId);
    const trainingClass = await this.classes
      .findOne({
        _id: objectId(classId, "CLASS_NOT_FOUND"),
        ownerCoachId: coach._id,
      })
      .exec();
    if (!trainingClass)
      throw new AppError(404, "CLASS_NOT_FOUND", "Class not found");
    return trainingClass;
  }

  async requirePublishedForClub(classId: string, clubId: string) {
    const trainingClass = await this.classes
      .findOne({
        _id: objectId(classId, "CLASS_NOT_FOUND"),
        clubId: objectId(clubId, "CLUB_NOT_FOUND"),
        status: { $in: ["published", "registration_closed", "in_progress"] },
      })
      .exec();
    if (!trainingClass) {
      throw new AppError(
        400,
        "CLASS_NOT_AVAILABLE_AT_CLUB",
        "Class is not available at this club",
      );
    }
    return trainingClass;
  }

  private async validateReferences(
    userId: string,
    ownerCoachId: Types.ObjectId,
    input: Partial<ClassInput>,
  ) {
    if (input.clubId) {
      await this.memberships.assertAccepted(input.clubId, userId, "coach");
    }
    if (input.courtId) {
      const clubId = input.clubId;
      if (!clubId) {
        throw new AppError(
          400,
          "CLASS_COURT_REQUIRES_CLUB",
          "A class court requires a club",
        );
      }
      const court = await this.courts.exists({
        _id: objectId(input.courtId, "COURT_NOT_FOUND"),
        clubId: objectId(clubId, "CLUB_NOT_FOUND"),
        status: "active",
      });
      if (!court) throw new AppError(404, "COURT_NOT_FOUND", "Court not found");
    }
    await Promise.all([
      ...(input.sportId
        ? [this.resources.requireActive("sports", "sport", input.sportId)]
        : []),
      ...(input.skillLevelId
        ? [
            this.resources.requireActive(
              "classes",
              "skill-level",
              input.skillLevelId,
            ),
          ]
        : []),
      ...(input.coverMediaId || input.galleryMediaIds?.length
        ? [
            this.media.assertOwnedReady(userId, [
              ...(input.coverMediaId ? [input.coverMediaId] : []),
              ...(input.galleryMediaIds ?? []),
            ]),
          ]
        : []),
      ...(input.requiredEquipmentIds ?? []).map((id) =>
        this.resources.requireActive("facilities", "equipment", id),
      ),
      ...(input.amenityIds ?? []).map((id) =>
        this.resources.requireActive("facilities", "amenity", id),
      ),
      ...(input.coachAssignments ?? []).map((item) =>
        this.coaches.requireCoach(item.coachId),
      ),
    ]);
    if (input.offeringId) {
      const offering = await this.offerings.findOne({
        _id: objectId(input.offeringId, "OFFERING_NOT_FOUND"),
        coachId: ownerCoachId,
      });
      if (!offering)
        throw new AppError(404, "OFFERING_NOT_FOUND", "Service not found");
    }
  }
}

type ClassInputStatus = TrainingClassDocument["status"];
const CLASS_STATUS_VALUES: ClassInputStatus[] = [
  "draft",
  "published",
  "registration_closed",
  "in_progress",
  "completed",
  "cancelled",
  "archived",
];

function normalizeAssignments(
  ownerCoachId: Types.ObjectId,
  assignments: ClassInput["coachAssignments"],
) {
  const map = new Map<
    string,
    { coachId: Types.ObjectId; role: "primary" | "assistant" }
  >();
  map.set(ownerCoachId.toHexString(), {
    coachId: ownerCoachId,
    role: "primary",
  });
  for (const assignment of assignments) {
    map.set(assignment.coachId, {
      coachId: objectId(assignment.coachId),
      role: assignment.role,
    });
  }
  return [...map.values()];
}

function toClassPersistence(
  input: Partial<ClassInput>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...input };
  for (const field of [
    "offeringId",
    "clubId",
    "courtId",
    "sportId",
    "skillLevelId",
    "coverMediaId",
  ] as const) {
    if (input[field] !== undefined)
      payload[field] = input[field] ? objectId(input[field]!) : null;
  }
  for (const field of [
    "galleryMediaIds",
    "requiredEquipmentIds",
    "amenityIds",
  ] as const) {
    if (input[field] !== undefined)
      payload[field] = uniqueObjectIds(input[field]!);
  }
  if (input.tags !== undefined) payload.tags = uniqueText(input.tags);
  if (input.prerequisites !== undefined)
    payload.prerequisites = uniqueText(input.prerequisites);
  if (input.title !== undefined) {
    payload.title = input.title.trim();
    payload.normalizedTitle = normalizeText(input.title);
  }
  if (input.description !== undefined)
    payload.description = input.description.trim();
  if (input.venue !== undefined) {
    payload.venue = input.venue
      ? {
          ...input.venue,
          ...(input.venue.clubId
            ? { clubId: objectId(input.venue.clubId) }
            : {}),
        }
      : null;
  }
  delete payload.coachAssignments;
  return payload;
}

function assertClassTransition(
  from: ClassInputStatus,
  to: ClassInputStatus,
): void {
  const allowed: Record<ClassInputStatus, ClassInputStatus[]> = {
    draft: ["published", "cancelled", "archived"],
    published: ["registration_closed", "in_progress", "cancelled", "archived"],
    registration_closed: ["in_progress", "cancelled", "archived"],
    in_progress: ["completed", "cancelled"],
    completed: ["archived"],
    cancelled: ["archived"],
    archived: [],
  };
  if (from !== to && !allowed[from].includes(to)) {
    throw new AppError(
      409,
      "CLASS_STATUS_TRANSITION_INVALID",
      `Cannot change class status from ${from} to ${to}`,
    );
  }
}

function uniqueText(items: string[]): string[] {
  return [...new Set(items.map((item) => item.normalize("NFKC").trim()))];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
