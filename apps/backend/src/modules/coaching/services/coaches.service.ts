import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../../common/errors/app.exception";
import { slugify } from "../../articles/lib/slugify";
import { MediaService } from "../../media/media.service";
import { ResourcesService } from "../../resources/resources.service";
import type { CoachProfileInput, CoachSportInput } from "../dto/coaching.dto";
import {
  Coach,
  type CoachDocument,
  CoachSport,
  type CoachSportDocument,
} from "../schemas/coaching.schemas";
import {
  normalizeText,
  objectId,
  toPublicDocument,
  uniqueObjectIds,
} from "../coaching.utils";

@Injectable()
export class CoachesService {
  constructor(
    @InjectModel(Coach.name) private readonly coaches: Model<CoachDocument>,
    @InjectModel(CoachSport.name)
    private readonly coachSports: Model<CoachSportDocument>,
    private readonly resources: ResourcesService,
    private readonly media: MediaService,
  ) {}

  async getProfile(userId: string) {
    return toPublicDocument(await this.getOrCreateDocument(userId));
  }

  async updateProfile(userId: string, input: CoachProfileInput) {
    const coach = await this.getOrCreateDocument(userId);
    const mediaIds = [
      ...(input.galleryMediaIds ?? []),
      ...(input.avatarMediaId ? [input.avatarMediaId] : []),
      ...(input.coverMediaId ? [input.coverMediaId] : []),
    ];
    await this.media.assertOwnedReady(userId, mediaIds);
    const payload: Record<string, unknown> = { ...input };
    for (const field of ["avatarMediaId", "coverMediaId"] as const) {
      if (input[field] !== undefined) {
        payload[field] = input[field] ? objectId(input[field]!) : null;
      }
    }
    if (input.galleryMediaIds) {
      payload.galleryMediaIds = uniqueObjectIds(input.galleryMediaIds);
    }
    if (input.geo !== undefined) {
      payload.geo = input.geo
        ? {
            ...input.geo,
            ...(input.geo.countryId
              ? { countryId: objectId(input.geo.countryId) }
              : {}),
            ...(input.geo.provinceId
              ? { provinceId: objectId(input.geo.provinceId) }
              : {}),
            ...(input.geo.cityId ? { cityId: objectId(input.geo.cityId) } : {}),
            ...(input.geo.districtId
              ? { districtId: objectId(input.geo.districtId) }
              : {}),
            cityRegionIds: uniqueObjectIds(input.geo.cityRegionIds),
          }
        : null;
    }
    if (input.languages) payload.languages = uniqueText(input.languages);
    if (coach.reviewStatus === "pending_review") {
      throw new AppError(
        409,
        "COACH_PENDING_REVIEW",
        "A pending profile cannot be edited",
      );
    }
    Object.assign(coach, payload);
    if (coach.reviewStatus === "rejected") coach.reviewStatus = "draft";
    await coach.save();
    return toPublicDocument(coach);
  }

  async listSports(userId: string) {
    const coach = await this.getOrCreateDocument(userId);
    const items = await this.coachSports
      .find({ coachId: coach._id })
      .sort({ createdAt: 1 })
      .exec();
    return { items: items.map(toPublicDocument) };
  }

  async replaceSports(userId: string, items: CoachSportInput[]) {
    const coach = await this.getOrCreateDocument(userId);
    await Promise.all(
      items.flatMap((item) => [
        this.resources.requireActive("sports", "sport", item.sportId),
        ...item.specialtyIds.map((id) =>
          this.resources.requireActive("sports", "coach-specialty", id),
        ),
        ...(item.skillLevelId
          ? [
              this.resources.requireActive(
                "sports",
                "skill-level",
                item.skillLevelId,
              ),
            ]
          : []),
      ]),
    );
    await this.media.assertOwnedReady(
      userId,
      items.flatMap((item) => item.certificateMediaIds),
    );
    if (items.length) {
      const sportIds = items.map((item) => objectId(item.sportId));
      await this.coachSports.bulkWrite(
        items.map((item) => ({
          updateOne: {
            filter: { coachId: coach._id, sportId: objectId(item.sportId) },
            update: {
              $set: {
                specialtyIds: uniqueObjectIds(item.specialtyIds),
                ...(item.skillLevelId
                  ? { skillLevelId: objectId(item.skillLevelId) }
                  : {}),
                experienceYears: item.experienceYears,
                certificateMediaIds: uniqueObjectIds(item.certificateMediaIds),
                achievements: uniqueText(item.achievements),
                customAttributes: item.customAttributes,
                verificationStatus: item.certificateMediaIds.length
                  ? "pending"
                  : "unverified",
              },
              $setOnInsert: {
                coachId: coach._id,
                sportId: objectId(item.sportId),
              },
              ...(item.skillLevelId ? {} : { $unset: { skillLevelId: "" } }),
            },
            upsert: true,
          },
        })),
      );
      await this.coachSports
        .deleteMany({ coachId: coach._id, sportId: { $nin: sportIds } })
        .exec();
    } else {
      await this.coachSports.deleteMany({ coachId: coach._id }).exec();
    }
    return this.listSports(userId);
  }

  async submit(userId: string) {
    const coach = await this.getOrCreateDocument(userId);
    const sportCount = await this.coachSports.countDocuments({
      coachId: coach._id,
    });
    const missing = [
      !coach.displayName && "displayName",
      !coach.bio && "bio",
      coach.serviceModes.length === 0 && "serviceModes",
      sportCount === 0 && "sports",
    ].filter((field): field is string => Boolean(field));
    if (missing.length) {
      throw new AppError(
        400,
        "COACH_PROFILE_INCOMPLETE",
        "Coach profile is incomplete",
        { missing },
      );
    }
    if (!["draft", "rejected"].includes(coach.reviewStatus)) {
      throw new AppError(
        409,
        "COACH_CANNOT_BE_SUBMITTED",
        "Coach cannot be submitted in its current state",
      );
    }
    coach.reviewStatus = "pending_review";
    coach.visibility = "hidden";
    coach.rejectionReason = null;
    await coach.save();
    return toPublicDocument(coach);
  }

  async review(
    coachId: string,
    status: "approved" | "rejected",
    reason?: string,
  ) {
    const coach = await this.coaches
      .findOneAndUpdate(
        {
          _id: objectId(coachId, "COACH_NOT_FOUND"),
          reviewStatus: "pending_review",
        },
        {
          $set: {
            reviewStatus: status,
            visibility: status === "approved" ? "public" : "hidden",
            rejectionReason:
              status === "rejected" ? (reason?.trim() ?? null) : null,
          },
        },
        { new: true },
      )
      .exec();
    if (!coach)
      throw new AppError(
        409,
        "COACH_NOT_PENDING_REVIEW",
        "Coach is not pending review",
      );
    return toPublicDocument(coach);
  }

  async listForAdmin() {
    const items = await this.coaches
      .find()
      .sort({ updatedAt: -1 })
      .limit(500)
      .exec();
    return { items: items.map(toPublicDocument) };
  }

  async listPublicByIds(ids: string[]) {
    if (!ids.length) return { items: [] };
    const items = await this.coaches
      .find({
        _id: { $in: ids.map((id) => objectId(id, "COACH_NOT_FOUND")) },
        reviewStatus: "approved",
        visibility: "public",
      })
      .sort({ displayName: 1 })
      .exec();
    return { items: items.map(toPublicDocument) };
  }

  async getPublicBySlug(slug: string): Promise<Record<string, unknown>> {
    const coach = await this.coaches
      .findOne({ slug, reviewStatus: "approved", visibility: "public" })
      .exec();
    if (!coach) throw new AppError(404, "COACH_NOT_FOUND", "Coach not found");
    const sports = await this.coachSports.find({ coachId: coach._id }).exec();
    const {
      userId: _userId,
      contact: _contact,
      rejectionReason: _rejectionReason,
      ...profile
    } = toPublicDocument(coach);
    return {
      ...profile,
      sports: sports.map((sport) => {
        const {
          certificateMediaIds: _certificates,
          coachId: _coachId,
          ...publicSport
        } = toPublicDocument(sport);
        return publicSport;
      }),
    };
  }

  async getOrCreateDocument(userId: string): Promise<CoachDocument> {
    const userObjectId = objectId(userId, "USER_NOT_FOUND");
    const existing = await this.coaches
      .findOne({ userId: userObjectId })
      .exec();
    if (existing) return existing;
    const id = new Types.ObjectId();
    return this.coaches.create({
      _id: id,
      userId: userObjectId,
      slug: `coach-${id.toHexString().slice(-8)}`,
    });
  }

  async requireOwnedCoach(userId: string): Promise<CoachDocument> {
    return this.getOrCreateDocument(userId);
  }

  async requireCoach(coachId: string): Promise<CoachDocument> {
    const coach = await this.coaches
      .findById(objectId(coachId, "COACH_NOT_FOUND"))
      .exec();
    if (!coach) throw new AppError(404, "COACH_NOT_FOUND", "Coach not found");
    return coach;
  }
}

function uniqueText(items: string[]): string[] {
  return [
    ...new Map(
      items.map((item) => [normalizeText(item), item.trim()]),
    ).values(),
  ];
}
