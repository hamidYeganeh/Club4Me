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
  items: ClubReview[];
  averageRating: number;
  reviewsCount: number;
};

export type CreateClubReviewPayload = {
  rating: number;
  title?: string;
  body: string;
};
