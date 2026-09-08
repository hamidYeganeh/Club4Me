import type {
  BusinessClub,
  SocialPlatform,
} from "../business/business-clubs.dto";

export type PublicClubFacilityDetails = {
  title?: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
};

export type PublicClubDetails = Omit<
  BusinessClub,
  "gallery" | "socialMedia" | "equipment" | "amenities"
> & {
  gallery: Array<{
    mediaId: string;
    title?: string;
    url: string;
    mimeType: string;
    category?: import("../business/club-profile.dto").ClubGalleryCategory;
    takenOn?: string;
  }>;
  socialMedia: Array<{ platform: SocialPlatform; link: string }>;
  equipment: Array<
    BusinessClub["equipment"][number] & PublicClubFacilityDetails
  >;
  amenities: Array<
    BusinessClub["amenities"][number] & PublicClubFacilityDetails
  >;
};

export type ClubReview = {
  ratings?: Record<string, number>;
  criterionLabels?: Record<string, string>;
  isVerifiedBooking?: boolean;
  id: string;
  clubId: string;
  userId: string;
  rating: number;
  title?: string;
  body: string;
  ownerResponse?: { body: string; respondedAt: string; respondedBy: string };
  createdAt: string;
  updatedAt: string;
};

export type ClubReviewsResponse = {
  criteria?: Array<{ id: string; name: string; icon?: string }>;
  criteriaSummary?: Array<{
    id: string;
    name: string;
    icon?: string;
    averageRating: number;
    reviewsCount: number;
  }>;
  items: ClubReview[];
  averageRating: number;
  reviewsCount: number;
};

export type CreateClubReviewPayload = {
  ratings?: Record<string, number>;
  rating: number;
  title?: string;
  body: string;
};

export type ServiceReviewTarget = "coach" | "class";
export type ServiceReview = {
  id: string;
  targetType: ServiceReviewTarget;
  targetId: string;
  targetSource: "coach" | "coach_class" | "business_class";
  rating: number;
  title?: string;
  body: string;
  mediaIds: string[];
  mediaUrls: string[];
  isVerifiedAttendance: boolean;
  ownerResponse?: { body: string; respondedAt: string; respondedBy: string };
  status: "pending" | "published" | "hidden" | "reported";
  createdAt: string;
  updatedAt: string;
};

export type ServiceReviewsResponse = {
  items: ServiceReview[];
  averageRating: number;
  reviewsCount: number;
};

export type CreateServiceReviewPayload = {
  rating: number;
  title?: string;
  body: string;
  mediaIds?: string[];
};
