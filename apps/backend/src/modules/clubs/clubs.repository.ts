import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { slugify } from "../articles/lib/slugify";
import type { ClubFields } from "./dto/club-fields.dto";
import { toPublicClub, type PublicClub } from "./mappers/club.mapper";
import { Club, type ClubDocument } from "./schemas/club.schema";

@Injectable()
export class ClubsRepository {
  constructor(
    @InjectModel(Club.name) private readonly model: Model<ClubDocument>,
  ) {}

  async listForOwner(ownerId: string): Promise<PublicClub[]> {
    const items = await this.model
      .find({ ownerId: toObjectId(ownerId) })
      .sort({ updatedAt: -1 })
      .exec();
    return items.map(toPublicClub);
  }

  async listForAdmin(): Promise<PublicClub[]> {
    const items = await this.model.find().sort({ updatedAt: -1 }).exec();
    return items.map(toPublicClub);
  }

  async findById(clubId: string): Promise<PublicClub> {
    if (!Types.ObjectId.isValid(clubId)) throw clubNotFound();
    const club = await this.model.findById(clubId).exec();
    if (!club) throw clubNotFound();
    return toPublicClub(club);
  }

  async findPublic(clubId: string): Promise<PublicClub> {
    if (!Types.ObjectId.isValid(clubId)) throw clubNotFound();
    const club = await this.model
      .findOne({
        _id: clubId,
        reviewStatus: "approved",
        visibility: "public",
      })
      .exec();
    if (!club) throw clubNotFound();
    return toPublicClub(club);
  }

  async findForOwner(ownerId: string, clubId: string): Promise<PublicClub> {
    const club = await this.findDocumentForOwner(ownerId, clubId);
    if (!club) throw clubNotFound();
    return toPublicClub(club);
  }

  async create(ownerId: string, input: ClubFields): Promise<PublicClub> {
    const id = new Types.ObjectId();
    const payload = toPersistence(input);
    const created = await this.model.create({
      _id: id,
      ownerId: toObjectId(ownerId),
      createdBy: toObjectId(ownerId),
      updatedBy: toObjectId(ownerId),
      ...payload,
      slug: `${slugify(input.name) || "club"}-${id.toHexString().slice(-6)}`,
      normalizedName: normalizeText(input.name),
      reviewStatus: "draft",
      visibility: "hidden",
    });
    return toPublicClub(created);
  }

  async update(
    ownerId: string,
    clubId: string,
    input: Partial<ClubFields>,
  ): Promise<PublicClub> {
    const club = await this.findDocumentForOwner(ownerId, clubId);
    if (!club) throw clubNotFound();
    if (club.reviewStatus === "pending") {
      throw new AppError(
        409,
        "CLUB_PENDING_REVIEW",
        "A club pending review cannot be edited",
      );
    }

    const payload = toPersistence(input);
    if (input.name !== undefined) {
      payload.normalizedName = normalizeText(input.name);
    }
    Object.assign(club, payload);
    club.updatedBy = toObjectId(ownerId);
    if (club.reviewStatus === "rejected") club.reviewStatus = "draft";
    await club.save();
    return toPublicClub(club);
  }

  async submit(ownerId: string, clubId: string): Promise<PublicClub> {
    if (!Types.ObjectId.isValid(clubId)) throw clubNotFound();
    const club = await this.model
      .findOneAndUpdate(
        {
          _id: clubId,
          ownerId: toObjectId(ownerId),
          reviewStatus: { $in: ["draft", "rejected"] },
        },
        {
          $set: {
            reviewStatus: "pending",
            visibility: "hidden",
            rejectionReason: null,
          },
        },
        { new: true },
      )
      .exec();
    if (!club) {
      const existing = await this.findDocumentForOwner(ownerId, clubId);
      if (!existing) throw clubNotFound();
      throw new AppError(
        409,
        "CLUB_CANNOT_BE_SUBMITTED",
        "Club cannot be submitted in its current state",
      );
    }
    return toPublicClub(club);
  }

  async review(
    clubId: string,
    status: "approved" | "rejected",
    reason?: string,
  ): Promise<PublicClub> {
    if (!Types.ObjectId.isValid(clubId)) throw clubNotFound();
    const club = await this.model
      .findOneAndUpdate(
        { _id: clubId, reviewStatus: "pending" },
        {
          $set: {
            reviewStatus: status,
            visibility: status === "approved" ? "public" : "hidden",
            rejectionReason: status === "rejected" ? reason?.trim() : null,
            publishedAt: status === "approved" ? new Date() : null,
          },
        },
        { new: true },
      )
      .exec();
    if (!club) {
      const existing = await this.model.findById(clubId).exec();
      if (!existing) throw clubNotFound();
      throw new AppError(
        409,
        "CLUB_NOT_PENDING_REVIEW",
        "Club is not pending review",
      );
    }
    return toPublicClub(club);
  }

  async updateRatingStats(
    clubId: string,
    averageRating: number,
    reviewsCount: number,
  ): Promise<void> {
    await this.model.updateOne(
      { _id: clubId },
      {
        $set: {
          averageRating: Math.round(averageRating * 100) / 100,
          reviewsCount,
        },
      },
    );
  }

  private findDocumentForOwner(ownerId: string, clubId: string) {
    if (!Types.ObjectId.isValid(clubId)) return null;
    return this.model
      .findOne({ _id: clubId, ownerId: toObjectId(ownerId) })
      .exec();
  }
}

function toPersistence(input: Partial<ClubFields>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (input.name !== undefined) result.name = input.name.trim();
  if (input.shortDescription !== undefined)
    result.shortDescription = input.shortDescription.trim();
  if (input.description !== undefined)
    result.description = input.description.trim();
  for (const field of ["logoMediaId", "coverMediaId"] as const) {
    if (input[field] !== undefined)
      result[field] = input[field] ? new Types.ObjectId(input[field]!) : null;
  }
  if (input.gallery !== undefined) {
    result.gallery = input.gallery.map((item) => ({
      mediaId: new Types.ObjectId(item.mediaId),
      ...(item.title ? { title: item.title.trim() } : {}),
      ...(item.altText ? { altText: item.altText.trim() } : {}),
      kind: item.kind ?? "image",
      position: item.position ?? 0,
      isCover: item.isCover ?? false,
    }));
  }
  if (input.equipment !== undefined) {
    result.equipment = input.equipment.map((item) => ({
      resourceId: new Types.ObjectId(item.resourceId),
      quantity: item.quantity,
      reservableQuantity: item.reservableQuantity ?? 0,
      status: item.status ?? "available",
      description: item.description?.trim() ?? "",
    }));
  }
  if (input.amenities !== undefined) {
    result.amenities = input.amenities.map((item) => ({
      resourceId: new Types.ObjectId(item.resourceId),
      quantity: item.quantity,
      availability: item.availability ?? "included",
      price: item.price,
      description: item.description?.trim() ?? "",
    }));
  }
  if (input.rules !== undefined) result.rules = uniqueText(input.rules, false);
  if (input.faqs !== undefined) {
    result.faqs = input.faqs.map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }));
  }
  if (input.location !== undefined) {
    result.geo = {
      countryId: new Types.ObjectId(input.location.countryId),
      provinceId: new Types.ObjectId(input.location.provinceId),
      cityId: new Types.ObjectId(input.location.cityId),
      districtId: input.location.districtId
        ? new Types.ObjectId(input.location.districtId)
        : null,
      cityRegionIds: (input.location.cityRegionIds ?? []).map(
        (id) => new Types.ObjectId(id),
      ),
    };
    result.address = input.location.address.trim();
    result.postalCode = input.location.postalCode?.trim() ?? "";
    result.timezone = input.location.timezone;
    result.locationNotes = input.location.locationNotes?.trim() ?? "";
    result.location = {
      type: "Point",
      coordinates: [input.location.longitude, input.location.latitude],
    };
  }
  if (input.socialMedia !== undefined) result.socialMedia = input.socialMedia;
  if (input.clubTypeIds !== undefined)
    result.clubTypeIds = input.clubTypeIds.map((id) => new Types.ObjectId(id));
  if (input.sportIds !== undefined)
    result.sportIds = input.sportIds.map((id) => new Types.ObjectId(id));
  if (input.tags !== undefined) result.tags = uniqueText(input.tags, true);
  if (input.cancellationRules !== undefined) {
    result.cancellationRules = input.cancellationRules.map((rule) => ({
      ...(rule.id ? { _id: new Types.ObjectId(rule.id) } : {}),
      title: rule.title.trim(),
      version: rule.version ?? 1,
      priority: rule.priority ?? 0,
      sessionTypes: rule.sessionTypes ?? [],
      daysOfWeek: rule.daysOfWeek ?? [],
      courtIds: (rule.courtIds ?? []).map((id) => new Types.ObjectId(id)),
      reservationCutoffMinutes: rule.reservationCutoffMinutes ?? 0,
      rescheduleCutoffMinutes: rule.rescheduleCutoffMinutes ?? 0,
      noShowRefundPercent: rule.noShowRefundPercent ?? 0,
      ownerCancellationRefundPercent:
        rule.ownerCancellationRefundPercent ?? 100,
      isActive: rule.isActive ?? true,
      tiers: [...rule.tiers].sort((a, b) => b.hoursBefore - a.hoursBefore),
    }));
  }
  if (input.weeklyHours !== undefined) result.weeklyHours = input.weeklyHours;
  if (input.closures !== undefined) result.closures = input.closures;
  for (const field of [
    "audience",
    "minAge",
    "maxAge",
    "currency",
    "taxPercent",
    "operationalStatus",
  ] as const) {
    if (input[field] !== undefined) result[field] = input[field];
  }
  return result;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("fa")
    .replace(/\s+/g, " ");
}

function uniqueText(items: string[], lowerCase: boolean): string[] {
  return [
    ...new Set(
      items.map((item) => {
        const value = item.normalize("NFKC").trim().replace(/\s+/g, " ");
        return lowerCase ? value.toLocaleLowerCase("fa") : value;
      }),
    ),
  ];
}

function toObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }
  return new Types.ObjectId(id);
}

function clubNotFound(): AppError {
  return new AppError(404, "CLUB_NOT_FOUND", "Club not found");
}
