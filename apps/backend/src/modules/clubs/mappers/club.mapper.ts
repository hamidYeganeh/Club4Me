import type { ClubDocument } from "../schemas/club.schema";
import type { ClubProfile, ClubBusyHour } from "../dto/club-profile.dto";

export type PublicClub = {
  profileResources?: Record<string, { name: string; isActive: boolean }>;
  profile: ClubProfile;
  trialBookingEnabled: boolean;
  busyHours: ClubBusyHour[];
  busyHoursSource: "owner_reported";
  busyHoursUpdatedAt: string | null;
  verifications: Partial<
    Record<"identity" | "documents" | "on_site", { verifiedAt: string }>
  >;
  id: string;
  ownerId: string;
  name: string;
  shortDescription: string;
  slug: string;
  description: string;
  logoMediaId?: string;
  coverMediaId?: string;
  gallery: Array<{
    mediaId: string;
    title?: string;
    altText?: string;
    kind: "image" | "video";
    position: number;
    isCover: boolean;
    category?: string;
    takenOn?: string;
  }>;
  equipment: Array<{
    equipmentId: string;
    quantity: number;
    reservableQuantity: number;
    status: string;
    description?: string;
  }>;
  amenities: Array<{
    amenityId: string;
    quantity?: number;
    availability: string;
    price?: { amount: number; currency: string };
    description?: string;
  }>;
  rules: string[];
  faqs: Array<{ question: string; answer: string }>;
  location?: {
    countryId: string;
    provinceId: string;
    cityId: string;
    districtId: string | null;
    cityRegionIds: string[];
    address: string;
    latitude: number;
    longitude: number;
    postalCode: string;
    timezone: string;
    locationNotes: string;
  };
  socialMedia: Array<{ platform: string; link: string }>;
  clubTypeIds: string[];
  sportIds: string[];
  tags: string[];
  cancellationRules: Array<{
    id: string;
    title: string;
    version: number;
    priority: number;
    sessionTypes: string[];
    daysOfWeek: number[];
    courtIds: string[];
    reservationCutoffMinutes: number;
    rescheduleCutoffMinutes: number;
    noShowRefundPercent: number;
    ownerCancellationRefundPercent: number;
    isActive: boolean;
    tiers: Array<{ hoursBefore: number; refundPercent: number }>;
  }>;
  weeklyHours: Array<{
    dayOfWeek: number;
    periods: Array<{
      opensAt: string;
      closesAt: string;
      audience?: "men" | "women" | "mixed";
    }>;
    isClosed: boolean;
  }>;
  closures: Array<{ startsAt: string; endsAt: string; reason: string }>;
  audience: string[];
  minAge?: number;
  maxAge?: number;
  currency: string;
  taxPercent: number;
  averageRating: number;
  reviewsCount: number;
  operationalStatus: string;
  reviewStatus: "draft" | "pending" | "approved" | "rejected";
  visibility: "hidden" | "public";
  rejectionReason: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  suspendedAt: string | null;
  qualityStatus: "active" | "review_required" | "suspended";
  supplyVerifiedAt: string | null;
  supplyReviewDueAt: string | null;
  supplyAssigneeId: string | null;
  qualityReasons: string[];
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
};

export function toPublicClub(club: ClubDocument): PublicClub {
  return {
    profile: club.profile ?? {},
    trialBookingEnabled: club.trialBookingEnabled ?? false,
    busyHours: club.busyHours ?? [],
    busyHoursSource: "owner_reported",
    busyHoursUpdatedAt: club.busyHoursUpdatedAt?.toISOString() ?? null,
    verifications: Object.fromEntries(
      Object.entries(club.verifications ?? {}).map(([key, value]) => [
        key,
        { verifiedAt: value.verifiedAt },
      ]),
    ),
    id: String(club._id),
    ownerId: String(club.ownerId),
    name: club.name,
    shortDescription: club.shortDescription ?? "",
    slug: club.slug,
    description: club.description,
    ...(club.logoMediaId ? { logoMediaId: String(club.logoMediaId) } : {}),
    ...(club.coverMediaId ? { coverMediaId: String(club.coverMediaId) } : {}),
    gallery: club.gallery.map((item) => ({
      mediaId: String(item.mediaId),
      ...(item.title ? { title: item.title } : {}),
      ...(item.altText ? { altText: item.altText } : {}),
      kind: item.kind ?? "image",
      position: item.position ?? 0,
      isCover: item.isCover ?? false,
      category: item.category,
      takenOn: item.takenOn,
    })),
    equipment: club.equipment.map((item) => ({
      equipmentId: String(item.resourceId),
      quantity: item.quantity,
      reservableQuantity: item.reservableQuantity ?? 0,
      status: item.status ?? "available",
      ...(item.description?.trim()
        ? { description: item.description.trim() }
        : {}),
    })),
    amenities: club.amenities.map((item) => ({
      amenityId: String(item.resourceId),
      ...(item.quantity === undefined ? {} : { quantity: item.quantity }),
      availability: item.availability ?? "included",
      ...(item.price
        ? {
            price: { amount: item.price.amount, currency: item.price.currency },
          }
        : {}),
      ...(item.description?.trim()
        ? { description: item.description.trim() }
        : {}),
    })),
    rules: club.rules,
    faqs: club.faqs ?? [],
    ...(club.geo && club.location && club.address
      ? {
          location: {
            countryId: String(club.geo.countryId),
            provinceId: String(club.geo.provinceId),
            cityId: String(club.geo.cityId),
            districtId: club.geo.districtId
              ? String(club.geo.districtId)
              : null,
            cityRegionIds: club.geo.cityRegionIds.map(String),
            address: club.address,
            latitude: club.location.coordinates[1],
            longitude: club.location.coordinates[0],
            postalCode: club.postalCode ?? "",
            timezone: club.timezone ?? "Asia/Tehran",
            locationNotes: club.locationNotes ?? "",
          },
        }
      : {}),
    socialMedia: club.socialMedia.map((item) => ({
      platform: item.platform,
      link: item.link,
    })),
    clubTypeIds: club.clubTypeIds.map(String),
    sportIds: (club.sportIds ?? []).map(String),
    tags: club.tags,
    cancellationRules: club.cancellationRules.map((rule) => ({
      id: String(rule._id),
      title: rule.title,
      version: rule.version ?? 1,
      priority: rule.priority ?? 0,
      sessionTypes: rule.sessionTypes ?? [],
      daysOfWeek: rule.daysOfWeek ?? [],
      courtIds: (rule.courtIds ?? []).map(String),
      reservationCutoffMinutes: rule.reservationCutoffMinutes ?? 0,
      rescheduleCutoffMinutes: rule.rescheduleCutoffMinutes ?? 0,
      noShowRefundPercent: rule.noShowRefundPercent ?? 0,
      ownerCancellationRefundPercent:
        rule.ownerCancellationRefundPercent ?? 100,
      isActive: rule.isActive ?? true,
      tiers: rule.tiers.map((tier) => ({
        hoursBefore: tier.hoursBefore,
        refundPercent: tier.refundPercent,
      })),
    })),
    weeklyHours: (club.weeklyHours ?? []).map((item) => ({
      dayOfWeek: item.dayOfWeek,
      periods: item.periods,
      isClosed: item.isClosed,
    })),
    closures: (club.closures ?? []).map((item) => ({
      startsAt: item.startsAt.toISOString(),
      endsAt: item.endsAt.toISOString(),
      reason: item.reason,
    })),
    audience: club.audience ?? ["mixed"],
    ...(club.minAge === undefined ? {} : { minAge: club.minAge }),
    ...(club.maxAge === undefined ? {} : { maxAge: club.maxAge }),
    currency: club.currency ?? "IRR",
    taxPercent: club.taxPercent ?? 0,
    averageRating: club.averageRating ?? 0,
    reviewsCount: club.reviewsCount ?? 0,
    operationalStatus: club.operationalStatus ?? "active",
    reviewStatus: club.reviewStatus,
    visibility: club.visibility,
    rejectionReason: club.rejectionReason ?? null,
    publishedAt: club.publishedAt?.toISOString() ?? null,
    archivedAt: club.archivedAt?.toISOString() ?? null,
    suspendedAt: club.suspendedAt?.toISOString() ?? null,
    qualityStatus: club.qualityStatus ?? "review_required",
    supplyVerifiedAt: club.supplyVerifiedAt?.toISOString() ?? null,
    supplyReviewDueAt: club.supplyReviewDueAt?.toISOString() ?? null,
    supplyAssigneeId: club.supplyAssigneeId
      ? String(club.supplyAssigneeId)
      : null,
    qualityReasons: club.qualityReasons ?? [],
    schemaVersion: club.schemaVersion ?? 1,
    createdAt: club.createdAt.toISOString(),
    updatedAt: club.updatedAt.toISOString(),
  };
}
