import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { AppError } from "../../../common/errors/app.exception";
import { MediaService } from "../../media/media.service";
import { ResourcesService } from "../../resources/resources.service";
import type { OfferingInput } from "../dto/coaching.dto";
import {
  CoachOffering,
  type CoachOfferingDocument,
} from "../schemas/coaching.schemas";
import {
  normalizeText,
  objectId,
  toPublicDocument,
  uniqueObjectIds,
} from "../coaching.utils";
import { CoachesService } from "./coaches.service";

@Injectable()
export class OfferingsService {
  constructor(
    @InjectModel(CoachOffering.name)
    private readonly offerings: Model<CoachOfferingDocument>,
    private readonly coaches: CoachesService,
    private readonly resources: ResourcesService,
    private readonly media: MediaService,
  ) {}

  async list(userId: string) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    const items = await this.offerings
      .find({ coachId: coach._id })
      .sort({ updatedAt: -1 })
      .exec();
    return { items: items.map(toPublicDocument) };
  }

  async create(userId: string, input: OfferingInput) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    await this.validateReferences(userId, input);
    const created = await this.offerings.create({
      coachId: coach._id,
      ...toOfferingPersistence(input),
    });
    return toPublicDocument(created);
  }

  async get(userId: string, offeringId: string) {
    return toPublicDocument(
      await this.requireOwnedDocument(userId, offeringId),
    );
  }

  async update(
    userId: string,
    offeringId: string,
    input: Partial<OfferingInput>,
  ) {
    const offering = await this.requireOwnedDocument(userId, offeringId);
    if (offering.status === "archived") {
      throw new AppError(
        409,
        "OFFERING_ARCHIVED",
        "An archived service cannot be edited",
      );
    }
    await this.validateReferences(userId, input);
    const nextPricingType = input.pricingType ?? offering.pricingType;
    const nextSessionCount =
      input.sessionCount === undefined
        ? offering.sessionCount
        : input.sessionCount;
    const nextMinAge =
      input.minAge === undefined ? offering.minAge : input.minAge;
    const nextMaxAge =
      input.maxAge === undefined ? offering.maxAge : input.maxAge;
    if (nextPricingType === "package" && nextSessionCount == null) {
      throw new AppError(
        400,
        "OFFERING_SESSION_COUNT_REQUIRED",
        "Package services require a session count",
      );
    }
    if (nextMinAge != null && nextMaxAge != null && nextMinAge > nextMaxAge) {
      throw new AppError(
        400,
        "OFFERING_AGE_RANGE_INVALID",
        "Maximum age must be at least minimum age",
      );
    }
    Object.assign(offering, toOfferingPersistence(input));
    if (offering.status === "published") offering.status = "draft";
    await offering.save();
    return toPublicDocument(offering);
  }

  async updateStatus(
    userId: string,
    offeringId: string,
    status: "published" | "archived",
  ) {
    const offering = await this.requireOwnedDocument(userId, offeringId);
    const coach = await this.coaches.requireOwnedCoach(userId);
    if (status === "published" && coach.reviewStatus !== "approved") {
      throw new AppError(
        409,
        "COACH_NOT_APPROVED",
        "Coach profile must be approved before publishing services",
      );
    }
    offering.status = status;
    await offering.save();
    return toPublicDocument(offering);
  }

  async listPublicByCoachSlug(slug: string) {
    const coach = await this.coaches.getPublicBySlug(slug);
    const items = await this.offerings
      .find({ coachId: objectId(String(coach.id)), status: "published" })
      .sort({ updatedAt: -1 })
      .exec();
    return { items: items.map(toPublicDocument) };
  }

  async requireOwnedDocument(
    userId: string,
    offeringId: string,
  ): Promise<CoachOfferingDocument> {
    const coach = await this.coaches.requireOwnedCoach(userId);
    const offering = await this.offerings
      .findOne({
        _id: objectId(offeringId, "OFFERING_NOT_FOUND"),
        coachId: coach._id,
      })
      .exec();
    if (!offering)
      throw new AppError(404, "OFFERING_NOT_FOUND", "Service not found");
    return offering;
  }

  private async validateReferences(
    userId: string,
    input: Partial<OfferingInput>,
  ) {
    await Promise.all([
      ...(input.sportId
        ? [this.resources.requireActive("sports", "sport", input.sportId)]
        : []),
      ...(input.skillLevelId
        ? [
            this.resources.requireActive(
              "sports",
              "skill-level",
              input.skillLevelId,
            ),
          ]
        : []),
      ...(input.coverMediaId
        ? [this.media.assertOwnedReady(userId, [input.coverMediaId])]
        : []),
    ]);
  }
}

function toOfferingPersistence(
  input: Partial<OfferingInput>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...input };
  if (input.sportId !== undefined) payload.sportId = objectId(input.sportId);
  if (input.title !== undefined) {
    payload.title = input.title.trim();
    payload.normalizedTitle = normalizeText(input.title);
  }
  if (input.description !== undefined)
    payload.description = input.description.trim();
  if (input.skillLevelId !== undefined)
    payload.skillLevelId = input.skillLevelId
      ? objectId(input.skillLevelId)
      : null;
  if (input.venueClubIds !== undefined)
    payload.venueClubIds = uniqueObjectIds(input.venueClubIds);
  if (input.coverMediaId !== undefined)
    payload.coverMediaId = input.coverMediaId
      ? objectId(input.coverMediaId)
      : null;
  return payload;
}
