import type { ClubDocument } from "../schemas/club.schema";

export type PublicClub = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  gallery: Array<{ mediaId: string; title?: string }>;
  equipment: Array<{ equipmentId: string; quantity: number }>;
  amenities: Array<{ amenityId: string; quantity: number }>;
  rules: string[];
  location?: {
    countryId: string;
    provinceId: string;
    cityId: string;
    districtId: string | null;
    cityRegionIds: string[];
    address: string;
    latitude: number;
    longitude: number;
  };
  socialMedia: Array<{ platform: string; link: string }>;
  clubTypeIds: string[];
  tags: string[];
  cancellationRules: Array<{
    title: string;
    tiers: Array<{ hoursBefore: number; refundPercent: number }>;
  }>;
  reviewStatus: "draft" | "pending" | "approved" | "rejected";
  visibility: "hidden" | "public";
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toPublicClub(club: ClubDocument): PublicClub {
  return {
    id: String(club._id),
    ownerId: String(club.ownerId),
    name: club.name,
    slug: club.slug,
    description: club.description,
    gallery: club.gallery.map((item) => ({
      mediaId: String(item.mediaId),
      ...(item.title ? { title: item.title } : {}),
    })),
    equipment: club.equipment.map((item) => ({
      equipmentId: String(item.resourceId),
      quantity: item.quantity,
    })),
    amenities: club.amenities.map((item) => ({
      amenityId: String(item.resourceId),
      quantity: item.quantity,
    })),
    rules: club.rules,
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
          },
        }
      : {}),
    socialMedia: club.socialMedia.map((item) => ({
      platform: item.platform,
      link: item.link,
    })),
    clubTypeIds: club.clubTypeIds.map(String),
    tags: club.tags,
    cancellationRules: club.cancellationRules.map((rule) => ({
      title: rule.title,
      tiers: rule.tiers.map((tier) => ({
        hoursBefore: tier.hoursBefore,
        refundPercent: tier.refundPercent,
      })),
    })),
    reviewStatus: club.reviewStatus,
    visibility: club.visibility,
    rejectionReason: club.rejectionReason ?? null,
    createdAt: club.createdAt.toISOString(),
    updatedAt: club.updatedAt.toISOString(),
  };
}
