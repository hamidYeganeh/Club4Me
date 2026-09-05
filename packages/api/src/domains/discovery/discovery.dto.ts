export type Club = {
  id: string;
  name: string;
  slug: string;
  city?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClubClass = {
  id: string;
  clubId: string;
  name: string;
  sport?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClubSlot = {
  id: string;
  clubId: string;
  classId?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  reservedCount: number;
};

export type Reservation = {
  id: string;
  clubId: string;
  slotId: string;
  userId: string;
  participantCount: number;
  status: "reserved";
  createdAt: string;
};

export type ListClubsParams = {
  city?: string;
  q?: string;
  latitude?: number;
  longitude?: number;
  page?: number;
  limit?: number;
};

export type ListClubsResponse = {
  items: Club[];
  page: number;
  limit: number;
  total: number;
};

export type CreateClubPayload = {
  name: string;
  city?: string;
  description?: string;
};

export type CreateClassPayload = {
  name: string;
  sport?: string;
};

export type CreateSlotPayload = {
  classId?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
};

export type ReserveSlotPayload = {
  slotId: string;
  participantCount?: number;
};

export type ListClassesResponse = {
  items: ClubClass[];
};

export type ListSlotsResponse = {
  items: ClubSlot[];
};

export type DiscoveryBannerItem = {
  title: string;
  subtitle: string;
  imageUrl: string;
  actionLabel: string;
  actionUrl: string;
};

export type DiscoveryClubItem = Pick<Club, "id" | "name" | "slug"> & {
  shortDescription: string;
  logoMediaId: string | null;
  coverMediaId: string | null;
  averageRating: number;
  reviewsCount: number;
  sportIds: string[];
  tags: string[];
};

export type DiscoveryCoachItem = {
  id: string;
  slug: string;
  displayName: string;
  shortBio: string;
  avatarMediaId: string | null;
  coverMediaId: string | null;
  imageUrl?: string | null;
  experienceYears: number;
  serviceModes: string[];
  averageRating: number;
  reviewsCount: number;
};

export type DiscoveryArticleItem = {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  categoryId: string;
  excerpt: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
  readTimeMinutes?: number;
};

export type PublicCatalogArticle = DiscoveryArticleItem & {
  bodyHtml: string;
};

type DiscoverySectionBase<TType extends string, TItem> = {
  id: string;
  key: string;
  type: TType;
  position: number;
  title: string;
  subtitle: string;
  layout: string;
  viewAllLabel: string;
  viewAllUrl: string;
  appearance: DiscoverySectionAppearance;
  items: TItem[];
};

export type DiscoverySectionAppearance = {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  showHeader: boolean;
  showViewAll: boolean;
  headerAlignment: "start" | "center";
  viewAllVariant: "link" | "solid" | "outline";
};

export type DiscoverySection =
  | DiscoverySectionBase<"banners", DiscoveryBannerItem>
  | DiscoverySectionBase<"clubs", DiscoveryClubItem>
  | DiscoverySectionBase<"coaches", DiscoveryCoachItem>
  | DiscoverySectionBase<"classes", PublicCatalogClass>
  | DiscoverySectionBase<"articles", DiscoveryArticleItem>;

export type PublicCatalogParams = {
  q?: string;
  page?: number;
  limit?: number;
  sort?: "newest" | "rating";
  cityId?: string;
  districtId?: string;
  cityRegionId?: string;
  sportId?: string;
  clubTypeId?: string;
  amenityId?: string;
  equipmentId?: string;
  coachId?: string;
  clubId?: string;
  categoryId?: string;
  serviceMode?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
};

export type PublicCatalogSearchKind = "club" | "coach" | "class";

export type PublicCatalogSearchParams = PublicCatalogParams & {
  kind?: PublicCatalogSearchKind;
};

export type PublicCatalogClub = DiscoveryClubItem & {
  imageUrl: string | null;
  address: string;
  geo: {
    cityId: string | null;
    districtId: string | null;
    cityRegionIds: string[];
  } | null;
  location: { type: "Point"; coordinates: [number, number] } | null;
  clubTypeIds: string[];
  amenityIds: string[];
  equipmentIds: string[];
  socialMedia: Array<{ platform: string; link: string }>;
  weeklyHours: Array<{
    dayOfWeek: number;
    periods: Array<{ opensAt: string; closesAt: string }>;
    isClosed: boolean;
  }>;
  operationalStatus: string;
};

export type PublicCatalogClubType = {
  id: string;
  slug: string;
  name: string;
  code: string;
  icon: string | null;
  clubsCount: number;
};

export type PublicCatalogClubTypesResponse = {
  items: PublicCatalogClubType[];
};

export type PublicCatalogCoach = DiscoveryCoachItem & {
  imageUrl: string | null;
  contact: Record<string, unknown>;
};

export type PublicCatalogClass = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageMediaId: string | null;
  imageUrl: string | null;
  sportId: string;
  clubId: string | null;
  coachIds: string[];
  deliveryMode: string;
  capacity: number;
  enrollmentCount: number;
  courseStartAt: string;
  courseEndAt: string;
  registrationStartAt: string | null;
  registrationEndAt: string | null;
  price: { amount: number; currency: string };
  venue: {
    clubId?: string;
    courtId?: string;
    address?: string;
    onlineUrl?: string;
  } | null;
  prerequisites: string[];
  status: string;
};

export type PublicCatalogPage<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PublicCatalogSearchResponse = {
  clubs: PublicCatalogClub[];
  coaches: PublicCatalogCoach[];
  classes: PublicCatalogClass[];
  total: number;
};

export type PublicResourceItem = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  [key: string]: unknown;
};

export type PublicResourcePage = PublicCatalogPage<PublicResourceItem>;
