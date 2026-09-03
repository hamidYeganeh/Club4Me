import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { ClubsService } from "../clubs/clubs.service";
import type { CreateClubReviewDto } from "./dto/create-club-review.dto";
import {
  ClubReview,
  type ClubReviewDocument,
} from "./schemas/club-review.schema";

@Injectable()
export class ClubReviewsService {
  constructor(
    @InjectModel(ClubReview.name)
    private readonly reviews: Model<ClubReviewDocument>,
    private readonly clubs: ClubsService,
  ) {}

  async list(clubId: string) {
    await this.clubs.getPublic(clubId);
    const id = objectId(clubId, "CLUB_NOT_FOUND");
    const [items, summary] = await Promise.all([
      this.reviews
        .find({ clubId: id, status: "published" })
        .sort({ createdAt: -1 })
        .limit(100)
        .exec(),
      this.reviews.aggregate<{ averageRating: number; reviewsCount: number }>([
        { $match: { clubId: id, status: "published" } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            reviewsCount: { $sum: 1 },
          },
        },
      ]),
    ]);
    return {
      items: items.map(toPublic),
      averageRating: summary[0]?.averageRating ?? 0,
      reviewsCount: summary[0]?.reviewsCount ?? 0,
    };
  }

  async create(userId: string, clubId: string, input: CreateClubReviewDto) {
    const club = await this.clubs.getPublic(clubId);
    if (club.ownerId === userId) {
      throw new AppError(
        403,
        "OWNER_CANNOT_REVIEW_OWN_CLUB",
        "An owner cannot review their own club",
      );
    }
    try {
      const review = await this.reviews.create({
        clubId: objectId(clubId, "CLUB_NOT_FOUND"),
        userId: objectId(userId, "USER_NOT_FOUND"),
        rating: input.rating,
        title: input.title?.trim(),
        body: input.body.trim(),
      });
      return toPublic(review);
    } catch (error) {
      if (isDuplicate(error)) {
        throw new AppError(
          409,
          "CLUB_REVIEW_EXISTS",
          "This user has already reviewed the club",
        );
      }
      throw error;
    }
  }
}

function toPublic(review: ClubReviewDocument) {
  return {
    id: String(review._id),
    clubId: String(review.clubId),
    userId: String(review.userId),
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

function objectId(value: string, code: string) {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, code, "Not found");
  }
  return new Types.ObjectId(value);
}

function isDuplicate(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}
