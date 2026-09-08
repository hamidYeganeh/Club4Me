import type { ClubPermission } from "./club-permissions";
import { Injectable, Optional } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import {
  legacyProfileValues,
  profileReferences,
} from "./club-profile-resources";

import { AppError } from "../../common/errors/app.exception";
import { ResourcesService } from "../resources/resources.service";
import { MediaService } from "../media/media.service";
import type { CreateClubDto } from "./dto/create-club.dto";
import type { ClubFields } from "./dto/club-fields.dto";
import type { UpdateClubDto } from "./dto/update-club.dto";
import type { PublicClub } from "./mappers/club.mapper";
import { ClubsRepository } from "./clubs.repository";
import { ClubMembershipsService } from "./club-memberships.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class ClubsService {
  constructor(
    private readonly repository: ClubsRepository,
    private readonly resources: ResourcesService,
    private readonly media: MediaService,
    private readonly memberships: ClubMembershipsService,
    private readonly notifications: NotificationsService,
    @Optional() @InjectConnection() private readonly connection?: Connection,
  ) {}

  async list(ownerId: string): Promise<{ items: PublicClub[] }> {
    return { items: await this.repository.listForOwner(ownerId) };
  }

  async listAccessible(userId: string) {
    return { items: await this.repository.listAccessible(userId) };
  }

  async get(
    ownerId: string,
    clubId: string,
    permission?: ClubPermission,
  ): Promise<PublicClub> {
    const club = await this.repository.findForOwner(
      ownerId,
      clubId,
      permission,
    );
    return {
      ...club,
      profileResources: await this.resolveProfileResources(club),
    };
  }

  async listForAdmin(): Promise<{ items: PublicClub[] }> {
    return { items: await this.repository.listForAdmin() };
  }

  getForAdmin(clubId: string): Promise<PublicClub> {
    return this.repository.findById(clubId);
  }

  verify(
    clubId: string,
    adminId: string,
    kind: "identity" | "documents" | "on_site",
    verified: boolean,
  ) {
    return this.repository.verify(clubId, adminId, kind, verified);
  }

  getPublic(clubId: string): Promise<PublicClub> {
    return this.repository.findPublic(clubId);
  }

  async getPublicDetails(clubId: string) {
    const club = await this.repository.findPublic(clubId);
    const media = await this.media.getReadyByIds(
      club.gallery.map((item) => item.mediaId),
    );
    const byId = new Map(media.map((item) => [item.id, item]));

    const [equipmentResources, amenityResources] = await Promise.all([
      Promise.all(
        club.equipment.map((item) =>
          this.resources
            .get("facilities", "equipment", item.equipmentId)
            .catch(() => null),
        ),
      ),
      Promise.all(
        club.amenities.map((item) =>
          this.resources
            .get("facilities", "amenity", item.amenityId)
            .catch(() => null),
        ),
      ),
    ]);

    return {
      ...club,
      profileResources: await this.resolveProfileResources(club),
      gallery: club.gallery.flatMap((item) => {
        const found = byId.get(item.mediaId);
        return found
          ? [{ ...item, url: found.url, mimeType: found.mimeType }]
          : [];
      }),
      equipment: club.equipment.map((item, index) => {
        const resource = equipmentResources[index];
        const description =
          item.description?.trim() ||
          (typeof resource?.description === "string"
            ? resource.description
            : undefined);
        return {
          ...item,
          ...(typeof resource?.name === "string"
            ? { title: resource.name }
            : {}),
          ...(description ? { description } : {}),
          ...(typeof resource?.icon === "string"
            ? { icon: resource.icon }
            : {}),
          ...(typeof resource?.imageUrl === "string"
            ? { imageUrl: resource.imageUrl }
            : {}),
        };
      }),
      amenities: club.amenities.map((item, index) => {
        const resource = amenityResources[index];
        const description =
          item.description?.trim() ||
          (typeof resource?.description === "string"
            ? resource.description
            : undefined);
        return {
          ...item,
          ...(typeof resource?.name === "string"
            ? { title: resource.name }
            : {}),
          ...(description ? { description } : {}),
          ...(typeof resource?.icon === "string"
            ? { icon: resource.icon }
            : {}),
          ...(typeof resource?.imageUrl === "string"
            ? { imageUrl: resource.imageUrl }
            : {}),
        };
      }),
    };
  }

  async create(ownerId: string, input: CreateClubDto): Promise<PublicClub> {
    await this.validateReferences(input);
    await this.media.assertOwnedReady(ownerId, [
      ...(input.gallery ?? []).map((item) => item.mediaId),
      ...(input.logoMediaId ? [input.logoMediaId] : []),
      ...(input.coverMediaId ? [input.coverMediaId] : []),
    ]);
    const club = await this.repository.create(ownerId, input);
    await this.memberships.ensureOwner(club.id, ownerId);
    return club;
  }

  async update(
    ownerId: string,
    clubId: string,
    input: UpdateClubDto,
  ): Promise<PublicClub> {
    const previous =
      input.profile || input.tags
        ? await this.repository.findForOwner(ownerId, clubId)
        : undefined;
    await this.validateReferences(input, previous);
    await this.media.assertOwnedReady(ownerId, [
      ...(input.gallery ?? []).map((item) => item.mediaId),
      ...(input.logoMediaId ? [input.logoMediaId] : []),
      ...(input.coverMediaId ? [input.coverMediaId] : []),
    ]);
    return this.repository.update(ownerId, clubId, input);
  }

  async submit(ownerId: string, clubId: string): Promise<PublicClub> {
    const club = await this.repository.findForOwner(ownerId, clubId);
    const missing = [
      !club.description && "description",
      club.gallery.length === 0 && "gallery",
      club.clubTypeIds.length === 0 && "clubTypeIds",
      !club.location && "location",
      club.cancellationRules.length === 0 && "cancellationRules",
    ].filter((field): field is string => Boolean(field));
    if (missing.length) {
      throw new AppError(
        400,
        "CLUB_PROFILE_INCOMPLETE",
        "Club profile is incomplete",
        { missing },
      );
    }
    return this.repository.submit(ownerId, clubId);
  }

  async activation(ownerId: string, clubId: string) {
    const club = await this.repository.findForOwner(ownerId, clubId, "club.read");
    const id = new Types.ObjectId(clubId);
    const [activeClasses, futureSessions] = await Promise.all([
      this.connection!.collection("business_training_classes").countDocuments({ clubId: id, status: "active", visibility: "public" }),
      this.connection!.collection("reservable_sessions").countDocuments({ clubId: id, status: "active", startsAt: { $gt: new Date() } }),
    ]);
    const items = [
      ["profile", "معرفی و توضیح باشگاه", Boolean(club.description && club.shortDescription)],
      ["location", "نشانی و نقطه روی نقشه", Boolean(club.location?.address && club.location)],
      ["media", "کاور یا تصویر گالری", Boolean(club.coverMediaId || club.gallery.length)],
      ["hours", "ساعت کاری", club.weeklyHours.length > 0],
      ["policies", "قانون لغو", club.cancellationRules.length > 0],
      ["service", "حداقل یک کلاس عمومی فعال", activeClasses > 0],
      ["slot", "حداقل یک سانس آینده", futureSessions > 0],
      ["review", "تأیید اپراتور", club.reviewStatus === "approved"],
    ].map(([id, label, complete]) => ({ id, label, complete }));
    return { clubId, ready: items.every((item) => item.complete), completed: items.filter((item) => item.complete).length, total: items.length, items, publicPreviewUrl: `/discovery/clubs/${club.slug}` };
  }

  async qualityQueue() {
    const clubs = await this.repository.listForAdmin();
    const now = Date.now();
    return { items: clubs.map((club) => {
      const reasons = [...club.qualityReasons];
      if (!club.supplyVerifiedAt) reasons.push("never_verified");
      if (club.supplyReviewDueAt && Date.parse(club.supplyReviewDueAt) < now) reasons.push("review_overdue");
      if (club.busyHoursUpdatedAt && Date.parse(club.busyHoursUpdatedAt) < now - 90 * 86_400_000) reasons.push("schedule_stale");
      return { ...club, qualityReasons: [...new Set(reasons)] };
    }).filter((club) => club.qualityStatus !== "active" || club.qualityReasons.length).sort((a, b) => b.qualityReasons.length - a.qualityReasons.length) };
  }

  async updateQuality(clubId: string, adminId: string, input: { status: "active" | "review_required" | "suspended"; reasons: string[]; assigneeId?: string | null; nextReviewAt?: string | null }) {
    if (!Types.ObjectId.isValid(clubId)) throw new AppError(404, "CLUB_NOT_FOUND", "Club not found");
    const now = new Date();
    const next = input.nextReviewAt ? new Date(input.nextReviewAt) : new Date(now.getTime() + 90 * 86_400_000);
    await this.connection!.collection("clubs").updateOne({ _id: new Types.ObjectId(clubId) }, { $set: { qualityStatus: input.status, qualityReasons: input.reasons, supplyVerifiedAt: now, supplyReviewDueAt: next, supplyAssigneeId: input.assigneeId ? new Types.ObjectId(input.assigneeId) : new Types.ObjectId(adminId), ...(input.status === "suspended" ? { visibility: "hidden" } : {}) } });
    return this.repository.findById(clubId);
  }

  async review(
    clubId: string,
    status: "approved" | "rejected",
    reason?: string,
  ): Promise<PublicClub> {
    const club = await this.repository.review(clubId, status, reason);
    if (status === "approved") {
      await this.notifications.notifyOwnerApproved({
        userId: club.ownerId,
        clubId: club.id,
        clubName: club.name,
      });
    }
    return club;
  }

  private async resolveProfileResources(club: PublicClub) {
    const entries = await Promise.all(
      profileReferences(club.profile).map(async (ref) => {
        try {
          const item = await this.resources.get(
            ref.category,
            ref.resource,
            ref.id,
          );
          return [
            ref.id,
            { name: String(item.name), isActive: item.isActive === true },
          ] as const;
        } catch (error) {
          if (error instanceof AppError && error.status === 404)
            return [
              ref.id,
              { name: "گزینه حذف‌شده", isActive: false },
            ] as const;
          throw error;
        }
      }),
    );
    return Object.fromEntries(entries);
  }

  private async validateReferences(
    input: Partial<ClubFields>,
    previous?: PublicClub,
  ): Promise<void> {
    for (const tag of input.tags ?? []) {
      if (previous?.tags.includes(tag)) continue;
      const normalize = (value: string) =>
        value
          .normalize("NFKC")
          .replace(/ي/g, "ی")
          .replace(/ك/g, "ک")
          .replace(/[\s\u200c]+/g, " ")
          .trim();
      const matches = await this.resources.list("clubs", "tag", {
        search: tag,
        isActive: "true",
        limit: "100",
      });
      if (
        !matches.items.some(
          (item) => normalize(String(item.name)) === normalize(tag),
        )
      )
        throw new AppError(
          400,
          "CLUB_TAG_CATALOG_REQUIRED",
          "Select tags from the active admin resource",
        );
    }
    if (input.profile) {
      const previousValues = new Set(legacyProfileValues(previous?.profile));
      if (
        legacyProfileValues(input.profile).some(
          (value) => !previousValues.has(value),
        )
      )
        throw new AppError(
          400,
          "CLUB_PROFILE_CATALOG_REQUIRED",
          "Select profile options from admin-managed resources",
        );
      const previousIds = new Set(
        profileReferences(previous?.profile).map(
          (ref) => `${ref.resource}:${ref.id}`,
        ),
      );
      await Promise.all(
        profileReferences(input.profile).map((ref) =>
          previousIds.has(`${ref.resource}:${ref.id}`)
            ? this.resources.get(ref.category, ref.resource, ref.id)
            : this.resources.requireActive(ref.category, ref.resource, ref.id),
        ),
      );
    }
    await Promise.all([
      ...(input.clubTypeIds ?? []).map((id) =>
        this.resources.requireActive("sports", "club-type", id),
      ),
      ...(input.sportIds ?? []).map((id) =>
        this.resources.requireActive("sports", "sport", id),
      ),
      ...(input.equipment ?? []).map((item) =>
        this.resources.requireActive(
          "facilities",
          "equipment",
          item.resourceId,
        ),
      ),
      ...(input.amenities ?? []).map((item) =>
        this.resources.requireActive("facilities", "amenity", item.resourceId),
      ),
    ]);

    if (!input.location) return;
    const {
      countryId,
      provinceId,
      cityId,
      districtId,
      cityRegionIds = [],
    } = input.location;
    const [, province, city, district, regions] = await Promise.all([
      this.resources.requireActive("location", "country", countryId),
      this.resources.requireActive("location", "province", provinceId),
      this.resources.requireActive("location", "city", cityId),
      districtId
        ? this.resources.requireActive("location", "district", districtId)
        : Promise.resolve(undefined),
      Promise.all(
        cityRegionIds.map((id) =>
          this.resources.requireActive("location", "city-region", id),
        ),
      ),
    ]);

    if (
      province.countryId !== countryId ||
      city.provinceId !== provinceId ||
      (district && district.cityId !== cityId) ||
      regions.some((region) => region.cityId !== cityId)
    ) {
      throw new AppError(
        400,
        "CLUB_LOCATION_HIERARCHY_INVALID",
        "Club location hierarchy is invalid",
      );
    }
  }
}
