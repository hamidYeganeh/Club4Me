import {
  publicProfessionalProfile,
  type CoachProfessionalProfile,
} from "../dto/professional-profile";
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
    if (input.geo) {
      const geo = input.geo;
      const [, province, city, district, regions] = await Promise.all([
        geo.countryId
          ? this.resources.requireActive("location", "country", geo.countryId)
          : undefined,
        geo.provinceId
          ? this.resources.requireActive("location", "province", geo.provinceId)
          : undefined,
        geo.cityId
          ? this.resources.requireActive("location", "city", geo.cityId)
          : undefined,
        geo.districtId
          ? this.resources.requireActive("location", "district", geo.districtId)
          : undefined,
        Promise.all(
          geo.cityRegionIds.map((id) =>
            this.resources.requireActive("location", "city-region", id),
          ),
        ),
      ]);
      if (
        (province &&
          geo.countryId &&
          String(province.countryId) !== geo.countryId) ||
        (city &&
          geo.provinceId &&
          String(city.provinceId) !== geo.provinceId) ||
        (district && String(district.cityId) !== geo.cityId) ||
        regions.some((region) => String(region.cityId) !== geo.cityId)
      )
        throw new AppError(
          400,
          "COACH_LOCATION_HIERARCHY_INVALID",
          "شهر، منطقه و محله باید به محدوده انتخاب‌شده تعلق داشته باشند.",
        );
    }
    const mediaIds = [
      ...(input.galleryMediaIds ?? []),
      ...(input.professionalProfile?.credentials ?? []).flatMap((item) =>
        item.mediaId ? [item.mediaId] : [],
      ),
      ...(input.trainingStyles ?? []).flatMap((item) =>
        item.imageMediaId ? [item.imageMediaId] : [],
      ),
      ...(input.avatarMediaId ? [input.avatarMediaId] : []),
      ...(input.coverMediaId ? [input.coverMediaId] : []),
    ];
    await this.media.assertOwnedReady(userId, mediaIds, true);
    const payload: Record<string, unknown> = { ...input };
    for (const field of ["avatarMediaId", "coverMediaId"] as const) {
      if (input[field] !== undefined) {
        payload[field] = input[field] ? objectId(input[field]!) : null;
      }
    }
    if (input.galleryMediaIds) {
      payload.galleryMediaIds = uniqueObjectIds(input.galleryMediaIds);
    }
    if (input.trainingStyles) {
      payload.trainingStyles = input.trainingStyles.map((item) => ({
        ...item,
        ...(item.imageMediaId
          ? { imageMediaId: objectId(item.imageMediaId) }
          : {}),
      }));
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
    const minAge =
      input.minAcceptedAge === undefined
        ? coach.minAcceptedAge
        : input.minAcceptedAge;
    const maxAge =
      input.maxAcceptedAge === undefined
        ? coach.maxAcceptedAge
        : input.maxAcceptedAge;
    if (minAge != null && maxAge != null && minAge > maxAge) {
      throw new AppError(
        400,
        "INVALID_AGE_RANGE",
        "Minimum age cannot be greater than maximum age",
      );
    }
    const credentials = (
      input.professionalProfile?.credentials ??
      coach.professionalProfile?.credentials ??
      []
    ).flatMap((item) => (item.mediaId ? [String(item.mediaId)] : []));
    const publicImages = [
      ...(input.galleryMediaIds ?? coach.galleryMediaIds ?? []),
      input.avatarMediaId === undefined
        ? coach.avatarMediaId
        : input.avatarMediaId,
      input.coverMediaId === undefined
        ? coach.coverMediaId
        : input.coverMediaId,
      ...(input.trainingStyles ?? coach.trainingStyles ?? []).map(
        (item) => item.imageMediaId,
      ),
    ]
      .filter(Boolean)
      .map(String);
    if (credentials.some((id) => publicImages.includes(id)))
      throw new AppError(
        400,
        "CREDENTIAL_MEDIA_IS_PRIVATE",
        "تصویر مدرک نمی‌تواند هم‌زمان عکس عمومی پروفایل باشد.",
      );
    if (publicImages.length)
      await this.media.assertOwnedReady(userId, publicImages);
    if (credentials.length) await this.media.makePrivate(userId, credentials);
    const removedCredentials = (
      coach.professionalProfile?.credentials ?? []
    ).flatMap((item) =>
      item.mediaId && !credentials.includes(String(item.mediaId))
        ? [String(item.mediaId)]
        : [],
    );
    if (removedCredentials.length)
      await this.media.retainCredentialPrivacy(userId, removedCredentials);
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
    const existingSports = await this.coachSports
      .find({ coachId: coach._id })
      .exec();
    const verificationStatus = (item: CoachSportInput) => {
      const existing = existingSports.find(
        (sport) => String(sport.sportId) === item.sportId,
      );
      const previousIds = (existing?.certificateMediaIds ?? [])
        .map(String)
        .sort();
      const nextIds = [...item.certificateMediaIds].sort();
      return existing && JSON.stringify(previousIds) === JSON.stringify(nextIds)
        ? existing.verificationStatus
        : item.certificateMediaIds.length
          ? "pending"
          : "unverified";
    };
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
                verificationStatus: verificationStatus(item),
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
    const media = await this.media.getReadyForReview(
      items.flatMap((item) =>
        (item.professionalProfile?.credentials ?? []).flatMap((credential) =>
          credential.mediaId ? [credential.mediaId] : [],
        ),
      ),
    );
    const urls = new Map(media.map((item) => [item.id, item.url]));
    return {
      items: items.map((item) => ({
        ...toPublicDocument(item),
        credentialAttachments: (
          item.professionalProfile?.credentials ?? []
        ).flatMap((credential) => {
          const url = credential.mediaId
            ? urls.get(credential.mediaId)
            : undefined;
          return url ? [{ id: credential.mediaId, url }] : [];
        }),
      })),
    };
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
    return {
      items: items.map((item) => ({
        ...toPublicDocument(item),
        professionalProfile: publicProfessionalProfile(
          item.toObject().professionalProfile,
        ),
      })),
    };
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
      professionalProfile: publicProfessionalProfile(
        profile.professionalProfile as CoachProfessionalProfile | undefined,
      ),
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
