import { Injectable } from "@nestjs/common";
import { ResourcesService } from "../resources/resources.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { ClubsService } from "../clubs/clubs.service";
import { ClubsRepository } from "../clubs/clubs.repository";
import { MediaService } from "../media/media.service";
import {
  Reservation,
  type ReservationDocument,
} from "../reservations/schemas/reservation.schema";
import type { CreateClubReviewDto } from "./dto/create-club-review.dto";
import type { RespondToClubReviewDto } from "./dto/create-club-review.dto";
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
    private readonly clubRepository: ClubsRepository,
    @InjectModel(Reservation.name)
    private readonly reservations: Model<ReservationDocument>,
    private readonly media: MediaService,
    private readonly resources: ResourcesService,
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
    const criteria = await this.activeCriteria();
    const criteriaSummary = await this.reviews.aggregate<{
      _id: string;
      averageRating: number;
      reviewsCount: number;
    }>([
      { $match: { clubId: id, status: "published" } },
      { $project: { scores: { $objectToArray: "$ratings" } } },
      { $unwind: "$scores" },
      {
        $group: {
          _id: "$scores.k",
          averageRating: { $avg: "$scores.v" },
          reviewsCount: { $sum: 1 },
        },
      },
    ]);
    return {
      criteria: criteria.map((item) => ({
        id: item.id,
        name: String(item.name),
        icon: typeof item.icon === "string" ? item.icon : undefined,
      })),
      criteriaSummary: criteria.map((item) => {
        const stats = criteriaSummary.find((row) => row._id === item.id);
        return {
          id: item.id,
          name: String(item.name),
          icon: typeof item.icon === "string" ? item.icon : undefined,
          averageRating: stats?.averageRating ?? 0,
          reviewsCount: stats?.reviewsCount ?? 0,
        };
      }),
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
    const reservation = await this.reservations
      .findOne({
        clubId: objectId(clubId, "CLUB_NOT_FOUND"),
        userId: objectId(userId, "USER_NOT_FOUND"),
        status: "completed",
      })
      .sort({ sessionStartsAt: -1 })
      .exec();
    await this.media.assertOwnedReady(userId, input.mediaIds);
    const criterionLabels: Record<string, string> = {};
    for (const id of Object.keys(input.ratings ?? {})) {
      const criterion = await this.resources.requireActive(
        "clubs",
        "review-criterion",
        id,
      );
      criterionLabels[id] = String(criterion.name);
    }
    try {
      const review = await this.reviews.create({
        clubId: objectId(clubId, "CLUB_NOT_FOUND"),
        userId: objectId(userId, "USER_NOT_FOUND"),
        reservationId: reservation?._id,
        rating: input.rating,
        title: input.title?.trim(),
        body: input.body.trim(),
        ratings: input.ratings ?? {},
        criterionLabels,
        mediaIds: input.mediaIds.map((id) => objectId(id, "MEDIA_NOT_FOUND")),
        isVerifiedBooking: Boolean(reservation),
      });
      await this.refreshClubRating(clubId);
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

  async respond(
    ownerId: string,
    clubId: string,
    reviewId: string,
    input: RespondToClubReviewDto,
  ) {
    await this.clubs.get(ownerId, clubId);
    const review = await this.reviews
      .findOneAndUpdate(
        {
          _id: objectId(reviewId, "REVIEW_NOT_FOUND"),
          clubId: objectId(clubId, "CLUB_NOT_FOUND"),
          status: "published",
        },
        {
          $set: {
            ownerResponse: {
              body: input.body.trim(),
              respondedAt: new Date(),
              respondedBy: objectId(ownerId, "OWNER_NOT_FOUND"),
            },
          },
        },
        { new: true },
      )
      .exec();
    if (!review)
      throw new AppError(404, "REVIEW_NOT_FOUND", "Review not found");
    return toPublic(review);
  }

  private async refreshClubRating(clubId: string) {
    const summary = await this.reviews.aggregate<{
      averageRating: number;
      reviewsCount: number;
    }>([
      {
        $match: {
          clubId: objectId(clubId, "CLUB_NOT_FOUND"),
          status: "published",
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          reviewsCount: { $sum: 1 },
        },
      },
    ]);
    await this.clubRepository.updateRatingStats(
      clubId,
      summary[0]?.averageRating ?? 0,
      summary[0]?.reviewsCount ?? 0,
    );
  }

  private async activeCriteria() {
    const items: Array<{ id: string; name?: unknown; icon?: unknown }> = [];
    for (let page = 1; ; page++) {
      const result = await this.resources.list("clubs", "review-criterion", {
        isActive: "true",
        limit: "100",
        page: String(page),
      });
      items.push(
        ...result.items.map((item) => ({
          id: String(item.id),
          name: item.name,
          icon: item.icon,
        })),
      );
      if (page >= result.totalPages) return items;
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
    ratings: review.ratings,
    criterionLabels: review.criterionLabels ?? {},
    mediaIds: review.mediaIds.map(String),
    isVerifiedBooking: review.isVerifiedBooking,
    ownerResponse: review.ownerResponse,
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
