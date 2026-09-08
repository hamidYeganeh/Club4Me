import { Injectable } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { MediaService } from "../media/media.service";
import type { CreateServiceReviewDto } from "./dto/service-review.dto";
import type { ModerateServiceReviewDto } from "./dto/service-review.dto";
import type { RespondToClubReviewDto } from "./dto/create-club-review.dto";
import {
  ServiceReview,
  type ServiceReviewDocument,
  type ServiceReviewTarget,
  type ServiceReviewTargetSource,
} from "./schemas/service-review.schema";

type ResolvedTarget = {
  id: Types.ObjectId;
  source: ServiceReviewTargetSource;
  ownerId: Types.ObjectId;
  clubId?: Types.ObjectId;
};

@Injectable()
export class ServiceReviewsService {
  constructor(
    @InjectModel(ServiceReview.name)
    private readonly reviews: Model<ServiceReviewDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly media: MediaService,
  ) {}

  async list(type: ServiceReviewTarget, targetId: string) {
    const target = await this.resolveTarget(type, targetId);
    const [items, summary] = await Promise.all([
      this.reviews
        .find({ targetType: type, targetId: target.id, status: "published" })
        .sort({ createdAt: -1 })
        .limit(100)
        .exec(),
      this.reviews.aggregate<{ averageRating: number; reviewsCount: number }>([
        { $match: { targetType: type, targetId: target.id, status: "published" } },
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
      items: await Promise.all(items.map((item) => this.publicReview(item))),
      averageRating: summary[0]?.averageRating ?? 0,
      reviewsCount: summary[0]?.reviewsCount ?? 0,
    };
  }

  async create(
    userId: string,
    type: ServiceReviewTarget,
    targetId: string,
    input: CreateServiceReviewDto,
  ) {
    const target = await this.resolveTarget(type, targetId);
    const athleteId = oid(userId, "USER_NOT_FOUND");
    if (target.ownerId.equals(athleteId))
      throw new AppError(403, "OWNER_CANNOT_REVIEW_OWN_SERVICE", "You cannot review your own service");
    const attendance = await this.findAttendance(type, target, athleteId);
    if (!attendance)
      throw new AppError(403, "COMPLETED_ATTENDANCE_REQUIRED", "A completed attendance is required to review this service");
    await this.media.assertOwnedReady(userId, input.mediaIds);

    try {
      const review = await this.reviews.create({
        targetType: type,
        targetId: target.id,
        targetSource: target.source,
        userId: athleteId,
        attendanceId: attendance,
        attendanceType: type,
        rating: input.rating,
        title: input.title,
        body: input.body,
        mediaIds: input.mediaIds.map((id) => oid(id, "MEDIA_NOT_FOUND")),
        isVerifiedAttendance: true,
      });
      await this.refreshRating(type, target);
      return this.publicReview(review);
    } catch (error) {
      if (isDuplicate(error))
        throw new AppError(409, "SERVICE_REVIEW_EXISTS", "You have already reviewed this service");
      throw error;
    }
  }

  async respond(
    userId: string,
    type: ServiceReviewTarget,
    targetId: string,
    reviewId: string,
    input: RespondToClubReviewDto,
  ) {
    const target = await this.resolveTarget(type, targetId, false);
    if (!target.ownerId.equals(oid(userId, "USER_NOT_FOUND")))
      throw new AppError(403, "FORBIDDEN", "You do not own this service");
    const review = await this.reviews.findOneAndUpdate(
      {
        _id: oid(reviewId, "REVIEW_NOT_FOUND"),
        targetType: type,
        targetId: target.id,
        status: "published",
      },
      {
        $set: {
          ownerResponse: {
            body: input.body,
            respondedAt: new Date(),
            respondedBy: oid(userId, "USER_NOT_FOUND"),
          },
        },
      },
      { new: true },
    );
    if (!review) throw new AppError(404, "REVIEW_NOT_FOUND", "Review not found");
    return this.publicReview(review);
  }

  async adminList(status?: string) {
    const filter = status && ["published", "hidden", "reported"].includes(status)
      ? { status }
      : {};
    const items = await this.reviews.find(filter).sort({ createdAt: -1 }).limit(200);
    return { items: await Promise.all(items.map((item) => this.publicReview(item))) };
  }

  async moderate(reviewId: string, input: ModerateServiceReviewDto) {
    const review = await this.reviews.findByIdAndUpdate(
      oid(reviewId, "REVIEW_NOT_FOUND"),
      { $set: { status: input.status, moderationReason: input.reason } },
      { new: true },
    );
    if (!review) throw new AppError(404, "REVIEW_NOT_FOUND", "Review not found");
    const target = await this.resolveTarget(review.targetType, String(review.targetId), false);
    await this.refreshRating(review.targetType, target);
    return this.publicReview(review);
  }

  private async findAttendance(
    type: ServiceReviewTarget,
    target: ResolvedTarget,
    athleteId: Types.ObjectId,
  ) {
    if (type === "coach") {
      const attendance = await this.connection.collection("session_attendance").findOne({
        coachId: target.id,
        athleteId,
        status: "present",
      }, { sort: { updatedAt: -1 } });
      return attendance?._id as Types.ObjectId | undefined;
    }
    if (target.source === "coach_class") {
      const sessions = await this.connection.collection("class_sessions")
        .find({ classId: target.id }, { projection: { _id: 1 } }).toArray();
      const attendance = await this.connection.collection("session_attendance").findOne({
        sessionId: { $in: sessions.map((item) => item._id) },
        athleteId,
        status: "present",
      }, { sort: { updatedAt: -1 } });
      return attendance?._id as Types.ObjectId | undefined;
    }
    const student = await this.connection.collection("club_students").findOne({
      clubId: target.clubId,
      userId: athleteId,
    });
    if (!student) return undefined;
    const attendance = await this.connection.collection("business_class_attendance").findOne({
      classId: target.id,
      studentId: student._id,
      status: "present",
    }, { sort: { updatedAt: -1 } });
    return attendance?._id as Types.ObjectId | undefined;
  }

  private async resolveTarget(
    type: ServiceReviewTarget,
    targetId: string,
    requirePublic = true,
  ): Promise<ResolvedTarget> {
    const id = oid(targetId, "TARGET_NOT_FOUND");
    if (type === "coach") {
      const coach = await this.connection.collection("coaches").findOne({
        _id: id,
        ...(requirePublic ? { reviewStatus: "approved", visibility: "public" } : {}),
      });
      if (!coach) throw new AppError(404, "COACH_NOT_FOUND", "Coach not found");
      return { id, source: "coach", ownerId: coach.userId as Types.ObjectId };
    }
    const coachClass = await this.connection.collection("classes").findOne({
      _id: id,
      ...(requirePublic ? { status: { $in: ["published", "registration_closed", "in_progress", "completed"] } } : {}),
    });
    if (coachClass) {
      const coach = await this.connection.collection("coaches").findOne({ _id: coachClass.ownerCoachId });
      if (!coach) throw new AppError(404, "CLASS_NOT_FOUND", "Class not found");
      return { id, source: "coach_class", ownerId: coach.userId as Types.ObjectId };
    }
    const businessClass = await this.connection.collection("business_training_classes").findOne({
      _id: id,
      ...(requirePublic ? { visibility: "public", status: { $in: ["active", "completed"] } } : {}),
    });
    if (!businessClass) throw new AppError(404, "CLASS_NOT_FOUND", "Class not found");
    const club = await this.connection.collection("clubs").findOne({ _id: businessClass.clubId });
    if (!club) throw new AppError(404, "CLASS_NOT_FOUND", "Class not found");
    return {
      id,
      source: "business_class",
      ownerId: club.ownerId as Types.ObjectId,
      clubId: businessClass.clubId as Types.ObjectId,
    };
  }

  private async refreshRating(type: ServiceReviewTarget, target: ResolvedTarget) {
    const [summary] = await this.reviews.aggregate<{ averageRating: number; reviewsCount: number }>([
      { $match: { targetType: type, targetId: target.id, status: "published" } },
      { $group: { _id: null, averageRating: { $avg: "$rating" }, reviewsCount: { $sum: 1 } } },
    ]);
    const values = { averageRating: summary?.averageRating ?? 0, reviewsCount: summary?.reviewsCount ?? 0 };
    const collection = target.source === "coach" ? "coaches" : target.source === "coach_class" ? "classes" : "business_training_classes";
    await this.connection.collection(collection).updateOne({ _id: target.id }, { $set: values });
  }

  private async publicReview(review: ServiceReviewDocument) {
    const media = await this.media.getReadyByIds(review.mediaIds.map(String));
    return { ...toPublic(review), mediaUrls: media.map((item) => item.url) };
  }
}

function oid(value: string, code: string) {
  if (!Types.ObjectId.isValid(value)) throw new AppError(404, code, "Not found");
  return new Types.ObjectId(value);
}

function isDuplicate(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === 11000;
}

function toPublic(review: ServiceReviewDocument) {
  return {
    id: String(review._id),
    targetType: review.targetType,
    targetId: String(review.targetId),
    targetSource: review.targetSource,
    rating: review.rating,
    title: review.title,
    body: review.body,
    mediaIds: review.mediaIds.map(String),
    isVerifiedAttendance: review.isVerifiedAttendance,
    ownerResponse: review.ownerResponse ? { body: review.ownerResponse.body, respondedAt: review.ownerResponse.respondedAt.toISOString(), respondedBy: String(review.ownerResponse.respondedBy) } : undefined,
    status: review.status,
    moderationReason: review.moderationReason,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}
