export type SocialPlatform =
  | "instagram"
  | "telegram"
  | "whatsapp"
  | "youtube"
  | "aparat"
  | "facebook"
  | "linkedin"
  | "x"
  | "website"
  | "email";

export type ClubCancellationTier = {
  hoursBefore: number;
  refundPercent: number;
};

export type ClubCancellationRule = {
  id?: string;
  title: string;
  tiers: ClubCancellationTier[];
  version?: number;
  priority?: number;
  sessionTypes?: Array<"court" | "class" | "coached_session">;
  daysOfWeek?: number[];
  courtIds?: string[];
  reservationCutoffMinutes?: number;
  rescheduleCutoffMinutes?: number;
  noShowRefundPercent?: number;
  ownerCancellationRefundPercent?: number;
  isActive?: boolean;
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
  postalCode?: string;
  timezone?: string;
  locationNotes?: string;
};

export type BusinessClub = {
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
  }>;
  equipment: Array<{
    equipmentId: string;
    quantity: number;
    reservableQuantity: number;
    status: "available" | "maintenance" | "unavailable";
    description?: string;
  }>;
  amenities: Array<{
    amenityId: string;
    quantity?: number;
    availability: "included" | "paid" | "unavailable";
    price?: { amount: number; currency: string };
    description?: string;
  }>;
  rules: string[];
  faqs: Array<{ question: string; answer: string }>;
  location?: ClubLocation;
  socialMedia: Array<{ platform: SocialPlatform; link: string }>;
  clubTypeIds: string[];
  sportIds: string[];
  tags: string[];
  cancellationRules: ClubCancellationRule[];
  weeklyHours: Array<{
    dayOfWeek: number;
    periods: Array<{ opensAt: string; closesAt: string }>;
    isClosed: boolean;
  }>;
  closures: Array<{ startsAt: string; endsAt: string; reason: string }>;
  audience: Array<"men" | "women" | "mixed" | "children" | "family">;
  minAge?: number;
  maxAge?: number;
  currency: string;
  taxPercent: number;
  averageRating: number;
  reviewsCount: number;
  operationalStatus:
    | "active"
    | "temporarily_closed"
    | "permanently_closed"
    | "under_maintenance";
  reviewStatus: "draft" | "pending" | "approved" | "rejected";
  visibility: "hidden" | "public";
  rejectionReason: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  suspendedAt: string | null;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type ClubResourceQuantityPayload = {
  resourceId: string;
  quantity: number;
  reservableQuantity?: number;
  status?: "available" | "maintenance" | "unavailable";
  description?: string;
};

export type CreateBusinessClubPayload = {
  name: string;
  shortDescription?: string;
  description?: string;
  logoMediaId?: string | null;
  coverMediaId?: string | null;
  gallery?: Array<{
    mediaId: string;
    title?: string;
    altText?: string;
    kind?: "image" | "video";
    position?: number;
    isCover?: boolean;
  }>;
  equipment?: ClubResourceQuantityPayload[];
  amenities?: Array<{
    resourceId: string;
    quantity?: number;
    availability?: "included" | "paid" | "unavailable";
    price?: { amount: number; currency: string };
    description?: string;
  }>;
  rules?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  location?: ClubLocation;
  socialMedia?: Array<{ platform: SocialPlatform; link: string }>;
  clubTypeIds?: string[];
  sportIds?: string[];
  tags?: string[];
  cancellationRules?: ClubCancellationRule[];
  weeklyHours?: Array<{
    dayOfWeek: number;
    periods: Array<{ opensAt: string; closesAt: string }>;
    isClosed: boolean;
  }>;
  closures?: Array<{ startsAt: string; endsAt: string; reason: string }>;
  audience?: Array<"men" | "women" | "mixed" | "children" | "family">;
  minAge?: number | null;
  maxAge?: number | null;
  currency?: string;
  taxPercent?: number;
  operationalStatus?:
    | "active"
    | "temporarily_closed"
    | "permanently_closed"
    | "under_maintenance";
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
