export type SocialPlatform =
  | "instagram"
  | "telegram"
  | "whatsapp"
  | "youtube"
  | "aparat"
  | "facebook"
  | "linkedin"
  | "x"
  | "website";

export type ClubCancellationTier = {
  hoursBefore: number;
  refundPercent: number;
};

export type ClubCancellationRule = {
  title: string;
  tiers: ClubCancellationTier[];
};

export type ClubLocation = {
  countryId: string;
  provinceId: string;
  cityId: string;
  districtId?: string | null;
  cityRegionIds?: string[];
  address: string;
  latitude: number;
  longitude: number;
};

export type BusinessClub = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  gallery: Array<{ mediaId: string; title?: string }>;
  equipment: Array<{ equipmentId: string; quantity: number }>;
  amenities: Array<{ amenityId: string; quantity: number }>;
  rules: string[];
  location?: ClubLocation;
  socialMedia: Array<{ platform: SocialPlatform; link: string }>;
  clubTypeIds: string[];
  tags: string[];
  cancellationRules: ClubCancellationRule[];
  reviewStatus: "draft" | "pending" | "approved" | "rejected";
  visibility: "hidden" | "public";
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClubResourceQuantityPayload = {
  resourceId: string;
  quantity: number;
};

export type CreateBusinessClubPayload = {
  name: string;
  description?: string;
  gallery?: Array<{ mediaId: string; title?: string }>;
  equipment?: ClubResourceQuantityPayload[];
  amenities?: ClubResourceQuantityPayload[];
  rules?: string[];
  location?: ClubLocation;
  socialMedia?: Array<{ platform: SocialPlatform; link: string }>;
  clubTypeIds?: string[];
  tags?: string[];
  cancellationRules?: ClubCancellationRule[];
};

export type UpdateBusinessClubPayload = Partial<CreateBusinessClubPayload>;
export type ListBusinessClubsResponse = { items: BusinessClub[] };

export type BusinessCatalogItem = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  [key: string]: unknown;
};

export type BusinessCatalogResponse = {
  items: BusinessCatalogItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type BusinessMedia = {
  id: string;
  url: string;
  mimeType: string;
  status: "ready" | "blocked";
  createdAt: string;
};
