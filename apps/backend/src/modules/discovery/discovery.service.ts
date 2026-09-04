import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import type { UserRole } from "../../lib/roles";
import {
  Article,
  type ArticleDocument,
} from "../articles/schemas/article.schema";
import { Club, type ClubDocument } from "../clubs/schemas/club.schema";
import {
  Coach,
  CoachSport,
  type CoachDocument,
  type CoachSportDocument,
  TrainingClass,
  type TrainingClassDocument,
} from "../coaching/schemas/coaching.schemas";
import { MediaService } from "../media/media.service";
import type {
  CreateDiscoverySectionDto,
  ReorderDiscoverySectionsDto,
  UpdateDiscoverySectionDto,
} from "./dto/discovery-section.dto";
import {
  DiscoverySection,
  type DiscoverySectionDocument,
} from "./schemas/discovery-section.schema";

type Filters = Record<string, string[] | undefined>;

@Injectable()
export class DiscoveryFeedService {
  constructor(
    @InjectModel(DiscoverySection.name)
    private readonly sections: Model<DiscoverySectionDocument>,
    @InjectModel(Club.name) private readonly clubs: Model<ClubDocument>,
    @InjectModel(Coach.name) private readonly coaches: Model<CoachDocument>,
    @InjectModel(CoachSport.name)
    private readonly coachSports: Model<CoachSportDocument>,
    @InjectModel(TrainingClass.name)
    private readonly classes: Model<TrainingClassDocument>,
    @InjectModel(Article.name)
    private readonly articles: Model<ArticleDocument>,
    private readonly media: MediaService,
  ) {}

  async listPublicClubs(query: Record<string, string | undefined>) {
    const { page, limit, skip } = pagination(query);
    const filter: Record<string, unknown> = {
      reviewStatus: "approved",
      visibility: "public",
      operationalStatus: { $ne: "permanently_closed" },
    };
    addIdFilter(filter, "geo.cityId", query.cityId);
    addIdFilter(filter, "geo.cityRegionIds", query.cityRegionId);
    addIdFilter(filter, "sportIds", query.sportId);
    addIdFilter(filter, "clubTypeIds", query.clubTypeId);
    addIdFilter(filter, "amenities.resourceId", query.amenityId);
    addIdFilter(filter, "equipment.resourceId", query.equipmentId);
    if (query.q?.trim()) {
      const pattern = searchPattern(query.q);
      filter.$or = [
        { name: pattern },
        { normalizedName: pattern },
        { shortDescription: pattern },
        { address: pattern },
        { tags: pattern },
      ];
    }
    if (query.latitude && query.longitude) {
      const latitude = coordinate(query.latitude, -90, 90, "latitude");
      const longitude = coordinate(query.longitude, -180, 180, "longitude");
      filter.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          ...(query.radiusKm
            ? {
                $maxDistance:
                  coordinate(query.radiusKm, 0.1, 500, "radiusKm") * 1000,
              }
            : {}),
        },
      };
    }
    const countFilter = { ...filter };
    if ("location" in countFilter) delete countFilter.location;
    const [documents, total] = await Promise.all([
      this.clubs
        .find(filter)
        .sort(
          query.sort === "rating" ? { averageRating: -1 } : { updatedAt: -1 },
        )
        .skip(skip)
        .limit(limit)
        .lean(),
      this.clubs.countDocuments(countFilter),
    ]);
    const items = await this.hydrateMedia(documents.map(publicClub));
    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async getPublicClub(identifier: string) {
    const document = await this.clubs
      .findOne({
        ...identifierFilter(identifier),
        reviewStatus: "approved",
        visibility: "public",
        operationalStatus: { $ne: "permanently_closed" },
      })
      .lean();
    if (!document) catalogNotFound("CLUB_NOT_FOUND");
    return (await this.hydrateMedia([publicClub(document!)]))[0];
  }

  async listPublicCoaches(query: Record<string, string | undefined>) {
    const { page, limit, skip } = pagination(query);
    const filter: Record<string, unknown> = {
      reviewStatus: "approved",
      visibility: "public",
    };
    addIdFilter(filter, "geo.cityId", query.cityId);
    addIdFilter(filter, "geo.cityRegionIds", query.cityRegionId);
    if (query.serviceMode) filter.serviceModes = query.serviceMode;
    if (query.q?.trim()) {
      const pattern = searchPattern(query.q);
      filter.$or = [
        { displayName: pattern },
        { shortBio: pattern },
        { bio: pattern },
      ];
    }
    if (query.sportId) {
      const coachIds = await this.coachSports.distinct("coachId", {
        sportId: validId(query.sportId),
      });
      filter._id = { $in: coachIds };
    }
    const [documents, total] = await Promise.all([
      this.coaches
        .find(filter)
        .sort(
          query.sort === "rating" ? { averageRating: -1 } : { updatedAt: -1 },
        )
        .skip(skip)
        .limit(limit)
        .lean(),
      this.coaches.countDocuments(filter),
    ]);
    const items = await this.hydrateMedia(documents.map(publicCoach));
    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async getPublicCoach(identifier: string) {
    const document = await this.coaches
      .findOne({
        ...identifierFilter(identifier),
        reviewStatus: "approved",
        visibility: "public",
      })
      .lean();
    if (!document) catalogNotFound("COACH_NOT_FOUND");
    return (await this.hydrateMedia([publicCoach(document!)]))[0];
  }

  async listPublicClasses(query: Record<string, string | undefined>) {
    const { page, limit, skip } = pagination(query);
    const [approvedCoachIds, approvedClubIds] = await Promise.all([
      this.coaches.distinct("_id", {
        reviewStatus: "approved",
        visibility: "public",
      }),
      this.clubs.distinct("_id", {
        reviewStatus: "approved",
        visibility: "public",
        operationalStatus: { $ne: "permanently_closed" },
      }),
    ]);
    const filter: Record<string, unknown> = {
      status: { $in: ["published", "registration_closed", "in_progress"] },
      ownerCoachId: { $in: approvedCoachIds },
      $or: [
        { clubId: { $exists: false } },
        { clubId: null },
        { clubId: { $in: approvedClubIds }, clubApprovalStatus: "approved" },
      ],
    };
    addIdFilter(filter, "sportId", query.sportId);
    addIdFilter(filter, "clubId", query.clubId);
    addIdFilter(filter, "coachAssignments.coachId", query.coachId);
    if (query.q?.trim()) {
      const pattern = searchPattern(query.q);
      filter.$and = [
        {
          $or: [
            { title: pattern },
            { normalizedTitle: pattern },
            { description: pattern },
          ],
        },
      ];
    }
    const [documents, total] = await Promise.all([
      this.classes
        .find(filter)
        .sort({ courseStartAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.classes.countDocuments(filter),
    ]);
    const items = await this.hydrateMedia(documents.map(publicClass));
    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async getPublicClass(identifier: string) {
    const base = await this.classes
      .findOne({
        ...identifierFilter(identifier),
        status: {
          $in: ["published", "registration_closed", "in_progress", "completed"],
        },
      })
      .lean();
    if (!base) catalogNotFound("CLASS_NOT_FOUND");
    const coachApproved = await this.coaches.exists({
      _id: base!.ownerCoachId,
      reviewStatus: "approved",
      visibility: "public",
    });
    if (!coachApproved) catalogNotFound("CLASS_NOT_FOUND");
    if (base!.clubId) {
      const clubApproved = await this.clubs.exists({
        _id: base!.clubId,
        reviewStatus: "approved",
        visibility: "public",
        operationalStatus: { $ne: "permanently_closed" },
      });
      if (!clubApproved || base!.clubApprovalStatus !== "approved") {
        catalogNotFound("CLASS_NOT_FOUND");
      }
    }
    return (await this.hydrateMedia([publicClass(base!)]))[0];
  }

  async searchPublicCatalog(query: Record<string, string | undefined>) {
    const kind = query.kind;
    const scoped = { ...query, page: "1", limit: query.limit ?? "20" };
    const [clubs, coaches, classes] = await Promise.all([
      kind && kind !== "club" ? emptyPage() : this.listPublicClubs(scoped),
      kind && kind !== "coach" ? emptyPage() : this.listPublicCoaches(scoped),
      kind && kind !== "class" ? emptyPage() : this.listPublicClasses(scoped),
    ]);
    return {
      clubs: clubs.items,
      coaches: coaches.items,
      classes: classes.items,
      total: clubs.total + coaches.total + classes.total,
    };
  }

  private async hydrateMedia<T extends Record<string, unknown>>(items: T[]) {
    const ids = items.flatMap((item) =>
      [item.imageMediaId, item.coverMediaId, item.avatarMediaId].filter(
        (value): value is string => typeof value === "string",
      ),
    );
    const media = await this.media.getReadyByIds(ids);
    const urls = new Map(media.map((item) => [item.id, item.url]));
    return items.map((item) => ({
      ...item,
      imageUrl:
        urls.get(String(item.imageMediaId ?? "")) ??
        urls.get(String(item.coverMediaId ?? "")) ??
        urls.get(String(item.avatarMediaId ?? "")) ??
        null,
    }));
  }

  async getFeed(): Promise<Record<string, unknown>[]> {
    const sections = await this.sections
      .find({ enabled: true })
      .sort({ position: 1, _id: 1 })
      .exec();
    return Promise.all(sections.map((section) => this.resolveSection(section)));
  }

  async listAdmin(actorRoles: UserRole[]) {
    assertAdmin(actorRoles);
    const items = await this.sections
      .find()
      .sort({ position: 1, _id: 1 })
      .lean();
    return { items: items.map(serializeConfiguration) };
  }

  async listOptions(actorRoles: UserRole[], type: string) {
    assertAdmin(actorRoles);
    if (type === "clubs") {
      const items = await this.clubs.find().sort({ name: 1 }).limit(500).lean();
      return {
        items: items.map((item) => ({
          id: String(item._id),
          label: item.name,
          status: `${item.reviewStatus} · ${item.visibility}`,
        })),
      };
    }
    if (type === "coaches") {
      const items = await this.coaches
        .find()
        .sort({ displayName: 1 })
        .limit(500)
        .lean();
      return {
        items: items.map((item) => ({
          id: String(item._id),
          label: item.displayName || item.slug,
          status: `${item.reviewStatus} · ${item.visibility}`,
        })),
      };
    }
    if (type === "articles") {
      const items = await this.articles
        .find()
        .sort({ title: 1 })
        .limit(500)
        .lean();
      return {
        items: items.map((item) => ({
          id: String(item._id),
          label: item.title,
          status: item.status,
        })),
      };
    }
    if (type === "banners") return { items: [] };
    throw new AppError(
      400,
      "INVALID_DISCOVERY_SECTION_TYPE",
      "Invalid discovery section type",
    );
  }

  async create(actorRoles: UserRole[], input: CreateDiscoverySectionDto) {
    assertAdmin(actorRoles);
    const position = await this.sections.countDocuments();
    try {
      const section = await this.sections.create({
        ...input,
        position,
        selection: normalizeSelection(input.selection),
      });
      return serializeConfiguration(section.toObject());
    } catch (error) {
      handleDuplicateKey(error);
      throw error;
    }
  }

  async update(
    actorRoles: UserRole[],
    id: string,
    input: UpdateDiscoverySectionDto,
  ) {
    assertAdmin(actorRoles);
    try {
      const section = await this.sections
        .findByIdAndUpdate(
          validId(id),
          {
            $set: {
              ...input,
              ...(input.selection
                ? { selection: normalizeSelection(input.selection) }
                : {}),
            },
          },
          { new: true, runValidators: true },
        )
        .exec();
      if (!section) notFound();
      return serializeConfiguration(section!.toObject());
    } catch (error) {
      handleDuplicateKey(error);
      throw error;
    }
  }

  async remove(actorRoles: UserRole[], id: string) {
    assertAdmin(actorRoles);
    const deleted = await this.sections.findByIdAndDelete(validId(id)).exec();
    if (!deleted) notFound();
    await this.compactPositions();
    return { success: true as const };
  }

  async reorder(actorRoles: UserRole[], input: ReorderDiscoverySectionsDto) {
    assertAdmin(actorRoles);
    const uniqueIds = new Set(input.sectionIds);
    if (uniqueIds.size !== input.sectionIds.length) {
      throw new AppError(
        400,
        "INVALID_SECTION_ORDER",
        "Section ids must be unique",
      );
    }
    const existing = await this.sections.countDocuments({
      _id: { $in: input.sectionIds.map(validId) },
    });
    if (existing !== input.sectionIds.length) notFound();
    await this.sections.bulkWrite(
      input.sectionIds.map((id, position) => ({
        updateOne: {
          filter: { _id: validId(id) },
          update: { $set: { position } },
        },
      })),
    );
    await this.compactPositions(input.sectionIds.length);
    return this.listAdmin(actorRoles);
  }

  private async resolveSection(section: DiscoverySectionDocument) {
    const base = {
      id: String(section._id),
      key: section.key,
      type: section.type,
      title: section.title,
      subtitle: section.subtitle,
      layout: section.layout,
      viewAllLabel: section.viewAllLabel,
      viewAllUrl: section.viewAllUrl,
    };
    if (section.type === "banners") {
      return {
        ...base,
        items: section.banners.map((item) => ({
          title: item.title,
          subtitle: item.subtitle,
          imageUrl: item.imageUrl,
          actionLabel: item.actionLabel,
          actionUrl: item.actionUrl,
        })),
      };
    }
    const items = await this.resolveEntities(section);
    return { ...base, items };
  }

  private async resolveEntities(section: DiscoverySectionDocument) {
    const selection = section.selection;
    const ids = selection.itemIds ?? [];
    const manual = selection.mode === "manual";
    const filters = (selection.filters ?? {}) as Filters;
    const limit = selection.limit ?? 10;
    let items: Array<Record<string, unknown>>;

    if (section.type === "clubs") {
      const query: Record<string, unknown> = {
        reviewStatus: "approved",
        visibility: "public",
        ...(manual ? { _id: { $in: ids } } : clubFilters(filters)),
      };
      items = (
        await this.clubs
          .find(query)
          .sort(sortFor(selection.sort))
          .limit(limit)
          .lean()
      ).map(publicClub);
    } else if (section.type === "coaches") {
      const coachIds = manual ? ids : await this.filterCoachIds(filters);
      const query: Record<string, unknown> = {
        reviewStatus: "approved",
        visibility: "public",
        ...(coachIds ? { _id: { $in: coachIds } } : {}),
        ...coachFilters(filters),
      };
      items = (
        await this.coaches
          .find(query)
          .sort(sortFor(selection.sort))
          .limit(limit)
          .lean()
      ).map(publicCoach);
    } else {
      const query: Record<string, unknown> = {
        status: "published",
        ...(manual ? { _id: { $in: ids } } : articleFilters(filters)),
      };
      items = (
        await this.articles
          .find(query)
          .sort(sortFor(selection.sort))
          .limit(limit)
          .lean()
      ).map(publicArticle);
    }
    return manual ? preserveOrder(items, ids).slice(0, limit) : items;
  }

  private async filterCoachIds(
    filters: Filters,
  ): Promise<Types.ObjectId[] | undefined> {
    if (!filters.sportIds?.length) return undefined;
    return this.coachSports.distinct("coachId", {
      sportId: { $in: filters.sportIds.map(validId) },
    });
  }

  private async compactPositions(offset = 0) {
    const remaining = await this.sections
      .find()
      .sort({ position: 1, _id: 1 })
      .skip(offset)
      .select({ _id: 1 })
      .lean();
    if (!remaining.length) return;
    await this.sections.bulkWrite(
      remaining.map((section, index) => ({
        updateOne: {
          filter: { _id: section._id },
          update: { $set: { position: offset + index } },
        },
      })),
    );
  }
}

function normalizeSelection(selection: CreateDiscoverySectionDto["selection"]) {
  return { ...selection, itemIds: selection.itemIds.map(validId) };
}
function validId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) notFound();
  return new Types.ObjectId(id);
}
function ids(values?: string[]) {
  return values?.map(validId);
}
function clubFilters(f: Filters) {
  return {
    ...(f.cityIds?.length ? { "geo.cityId": { $in: ids(f.cityIds) } } : {}),
    ...(f.sportIds?.length ? { sportIds: { $in: ids(f.sportIds) } } : {}),
    ...(f.clubTypeIds?.length
      ? { clubTypeIds: { $in: ids(f.clubTypeIds) } }
      : {}),
    ...(f.tags?.length ? { tags: { $in: f.tags } } : {}),
    ...(f.audience?.length ? { audience: { $in: f.audience } } : {}),
  };
}
function coachFilters(f: Filters) {
  return {
    ...(f.cityIds?.length ? { "geo.cityId": { $in: ids(f.cityIds) } } : {}),
    ...(f.serviceModes?.length
      ? { serviceModes: { $in: f.serviceModes } }
      : {}),
  };
}
function articleFilters(f: Filters) {
  return f.categoryIds?.length
    ? { categoryId: { $in: ids(f.categoryIds) } }
    : {};
}
function sortFor(sort: string): Record<string, 1 | -1> {
  if (sort === "rating") return { averageRating: -1, reviewsCount: -1, _id: 1 };
  if (sort === "name") return { name: 1, displayName: 1, title: 1, _id: 1 };
  return { createdAt: -1, _id: -1 };
}
function preserveOrder(
  items: Array<Record<string, unknown>>,
  ids: Types.ObjectId[],
) {
  const rank = new Map(ids.map((id, index) => [String(id), index]));
  return items.sort(
    (a, b) =>
      (rank.get(String(a.id)) ?? Infinity) -
      (rank.get(String(b.id)) ?? Infinity),
  );
}
function publicClub(item: Record<string, any>) {
  return {
    id: String(item._id),
    name: item.name,
    slug: item.slug,
    shortDescription: item.shortDescription ?? "",
    logoMediaId: item.logoMediaId ? String(item.logoMediaId) : null,
    coverMediaId: item.coverMediaId ? String(item.coverMediaId) : null,
    averageRating: item.averageRating ?? 0,
    reviewsCount: item.reviewsCount ?? 0,
    address: item.address ?? "",
    geo: item.geo
      ? {
          cityId: item.geo.cityId ? String(item.geo.cityId) : null,
          districtId: item.geo.districtId ? String(item.geo.districtId) : null,
          cityRegionIds: (item.geo.cityRegionIds ?? []).map(String),
        }
      : null,
    location: item.location ?? null,
    clubTypeIds: (item.clubTypeIds ?? []).map(String),
    sportIds: (item.sportIds ?? []).map(String),
    amenityIds: (item.amenities ?? []).map((entry: Record<string, any>) =>
      String(entry.resourceId),
    ),
    equipmentIds: (item.equipment ?? []).map((entry: Record<string, any>) =>
      String(entry.resourceId),
    ),
    socialMedia: item.socialMedia ?? [],
    weeklyHours: item.weeklyHours ?? [],
    operationalStatus: item.operationalStatus ?? "active",
    tags: item.tags ?? [],
  };
}
function publicCoach(item: Record<string, any>) {
  return {
    id: String(item._id),
    slug: item.slug,
    displayName: item.displayName,
    shortBio: item.shortBio ?? "",
    avatarMediaId: item.avatarMediaId ? String(item.avatarMediaId) : null,
    coverMediaId: item.coverMediaId ? String(item.coverMediaId) : null,
    experienceYears: item.experienceYears ?? 0,
    serviceModes: item.serviceModes ?? [],
    averageRating: item.averageRating ?? 0,
    reviewsCount: item.reviewsCount ?? 0,
    contact: item.contact ?? {},
  };
}
function publicArticle(item: Record<string, any>) {
  return {
    id: String(item._id),
    title: item.title,
    slug: item.slug,
    authorName: item.authorName,
    categoryId: String(item.categoryId),
    excerpt: item.excerpt ?? "",
    coverImageUrl: item.coverImageUrl ?? null,
    publishedAt: item.publishedAt?.toISOString() ?? null,
  };
}
function publicClass(item: Record<string, any>) {
  return {
    id: String(item._id),
    slug: item.slug,
    title: item.title,
    description: item.description ?? "",
    imageMediaId: item.coverMediaId ? String(item.coverMediaId) : null,
    sportId: String(item.sportId),
    clubId: item.clubId ? String(item.clubId) : null,
    coachIds: (item.coachAssignments ?? []).map(
      (assignment: Record<string, any>) => String(assignment.coachId),
    ),
    deliveryMode: item.deliveryMode,
    capacity: item.capacity,
    enrollmentCount: item.enrollmentCount ?? 0,
    courseStartAt: item.courseStartAt?.toISOString?.() ?? item.courseStartAt,
    courseEndAt: item.courseEndAt?.toISOString?.() ?? item.courseEndAt,
    registrationStartAt:
      item.registrationStartAt?.toISOString?.() ??
      item.registrationStartAt ??
      null,
    registrationEndAt:
      item.registrationEndAt?.toISOString?.() ?? item.registrationEndAt ?? null,
    price: item.price,
    venue: item.venue ?? null,
    prerequisites: item.prerequisites ?? [],
    status: item.status,
  };
}
function pagination(query: Record<string, string | undefined>) {
  const page = integer(query.page, 1, 1, 100_000);
  const limit = integer(query.limit, 20, 1, 100);
  return { page, limit, skip: (page - 1) * limit };
}
function integer(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new AppError(400, "INVALID_PAGINATION", "Invalid pagination value");
  }
  return parsed;
}
function coordinate(value: string, min: number, max: number, field: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new AppError(400, "INVALID_COORDINATE", `Invalid ${field}`);
  }
  return parsed;
}
function addIdFilter(
  filter: Record<string, unknown>,
  field: string,
  value: string | undefined,
) {
  if (value) filter[field] = validId(value);
}
function searchPattern(value: string) {
  return new RegExp(escapeSearch(normalizeSearch(value)), "i");
}
function normalizeSearch(value: string) {
  return value
    .trim()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");
}
function escapeSearch(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function emptyPage() {
  return { items: [], page: 1, limit: 0, total: 0, totalPages: 0 };
}
function identifierFilter(identifier: string) {
  return Types.ObjectId.isValid(identifier)
    ? { _id: new Types.ObjectId(identifier) }
    : { slug: identifier };
}
function catalogNotFound(code: string): never {
  throw new AppError(404, code, "Catalog item not found");
}
function serializeConfiguration(item: Record<string, any>) {
  return {
    id: String(item._id),
    key: item.key,
    type: item.type,
    title: item.title,
    subtitle: item.subtitle ?? "",
    layout: item.layout ?? "carousel",
    viewAllLabel: item.viewAllLabel ?? "",
    viewAllUrl: item.viewAllUrl ?? "",
    enabled: item.enabled ?? true,
    position: item.position ?? 0,
    selection: {
      mode: item.selection?.mode ?? "query",
      itemIds: (item.selection?.itemIds ?? []).map(String),
      limit: item.selection?.limit ?? 10,
      sort: item.selection?.sort ?? "newest",
      filters: item.selection?.filters ?? {},
    },
    banners: item.banners ?? [],
    createdAt: item.createdAt?.toISOString?.() ?? item.createdAt,
    updatedAt: item.updatedAt?.toISOString?.() ?? item.updatedAt,
  };
}
function assertAdmin(roles: UserRole[]) {
  if (!roles.includes("admin"))
    throw new AppError(403, "FORBIDDEN", "Admin access required");
}
function notFound(): never {
  throw new AppError(
    404,
    "DISCOVERY_SECTION_NOT_FOUND",
    "Discovery section not found",
  );
}
function handleDuplicateKey(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  )
    throw new AppError(
      409,
      "DISCOVERY_SECTION_KEY_TAKEN",
      "Discovery section key already exists",
    );
}
