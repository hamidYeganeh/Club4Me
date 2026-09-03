import type {
  BusinessClub,
  SocialPlatform,
} from "../business/business-clubs.dto";

export type PublicClubDetails = Omit<
  BusinessClub,
  "gallery" | "socialMedia"
> & {
  gallery: Array<{
    mediaId: string;
    title?: string;
    url: string;
    mimeType: string;
  }>;
  socialMedia: Array<{ platform: SocialPlatform; link: string }>;
};

export type ClubReview = {
  id: string;
  clubId: string;
  userId: string;
  rating: number;
  title?: string;
  body: string;
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
