import { CoachPackagePaymentReference } from "./coach-package-payment-reference";
import { Connection, Types } from "mongoose";
import { AppError } from "../../common/errors/app.exception";
import {
  ClassEnrollment,
  SessionBooking,
  TrainingClass,
  TrainingSession,
} from "../coaching/schemas/coaching.schemas";

export type CoachingPaymentReferenceType =
  "coach_booking" | "coach_class_enrollment" | "coach_package_purchase";
export function isCoachingReference(
  type: string,
): type is CoachingPaymentReferenceType {
  return (
    type === "coach_booking" ||
    type === "coach_class_enrollment" ||
    type === "coach_package_purchase"
  );
}

/** Model adapter keeps Commerce independent of the coaching portal services. */
export class CoachingPaymentReference {
  constructor(private readonly db: Connection) {}
  private model(type: CoachingPaymentReferenceType) {
    return this.db.model<SessionBooking | ClassEnrollment>(
      type === "coach_booking" ? SessionBooking.name : ClassEnrollment.name,
    );
  }
  async payable(
    userId: string,
    type: CoachingPaymentReferenceType,
    referenceId: string,
  ) {
    if (type === "coach_package_purchase")
      return new CoachPackagePaymentReference(this.db).payable(
        userId,
        referenceId,
      );
    const item = await this.model(type).findOne({
      _id: new Types.ObjectId(referenceId),
      athleteId: new Types.ObjectId(userId),
      status: "pending",
      paymentStatus: "pending",
      $or: [
        { paymentExpiresAt: null },
        { paymentExpiresAt: { $gt: new Date() } },
      ],
    });
    if (!item)
      throw new AppError(
        409,
        "REFERENCE_NOT_PAYABLE",
        "سفارش قابل پرداخت نیست.",
      );
    const data = item.toObject();
    const resource =
      "sessionId" in data
        ? await this.db
            .model<TrainingSession>(TrainingSession.name)
            .findById(data.sessionId)
        : await this.db
            .model<TrainingClass>(TrainingClass.name)
            .findById(data.classId);
    const start =
      resource &&
      ("startAt" in resource ? resource.startAt : resource.courseStartAt);
    if (
      !resource ||
      !start ||
      start <= new Date() ||
      ["cancelled", "completed", "archived"].includes(resource.status)
    )
      throw new AppError(
        409,
        "SERVICE_NOT_AVAILABLE",
        "زمان خدمت گذشته یا ارائه آن متوقف شده است.",
      );
    const venue = resource.venue;
    return {
      referenceId: item._id,
      coachId: item.coachId,
      clubId: venue?.clubId,
      amount: item.priceSnapshot.amount,
      currency: item.priceSnapshot.currency,
      title: resource.title,
      classId: "classId" in data ? data.classId : undefined,
      expiresAt: item.paymentExpiresAt ?? start,
      generationStartedAt:
        "bookedAt" in data ? data.bookedAt : data.registeredAt,
    };
  }
  async finalize(
    type: CoachingPaymentReferenceType,
    referenceId: Types.ObjectId,
    paid: boolean,
    intentId: Types.ObjectId,
    intentCreatedAt?: Date,
  ) {
    if (type === "coach_package_purchase")
      return new CoachPackagePaymentReference(this.db).finalize(
        referenceId,
        paid,
      );
    const model = this.model(type);
    const original = await model
      .findById(referenceId)
      .select("+paymentFailureIntentId");
    if (!original)
      throw new AppError(404, "REFERENCE_NOT_FOUND", "سفارش پیدا نشد.");
    const data = original.toObject();
    const generation = "bookedAt" in data ? data.bookedAt : data.registeredAt;
    if (intentCreatedAt && intentCreatedAt < generation) {
      if (paid)
        throw new AppError(
          409,
          "REFERENCE_GENERATION_CHANGED",
          "این پرداخت متعلق به ثبت‌نام قبلی است.",
        );
      return null;
    }
    const resource =
      "sessionId" in data
        ? await this.db
            .model<TrainingSession>(TrainingSession.name)
            .findById(data.sessionId)
        : await this.db
            .model<TrainingClass>(TrainingClass.name)
            .findById(data.classId);
    if (!resource)
      throw new AppError(404, "SERVICE_NOT_FOUND", "خدمت پیدا نشد.");
    const status = paid
      ? type === "coach_booking"
        ? "confirmed"
        : "enrollmentMode" in resource &&
            resource.enrollmentMode === "automatic"
          ? "active"
          : "pending"
      : "rejected";
    const updated = await model.findOneAndUpdate(
      { _id: referenceId, status: "pending", paymentStatus: "pending" },
      {
        $set: {
          status,
          paymentStatus: paid ? "paid" : "failed",
          ...(!paid
            ? {
                cancelledAt: new Date(),
                paymentFailureIntentId: intentId,
                refundAmount: 0,
                refundPercent: 0,
              }
            : {}),
        },
      },
      { new: true },
    );
    if (!updated && paid && original.paymentStatus !== "paid")
      throw new AppError(
        409,
        "REFERENCE_STATUS_CHANGED",
        "وضعیت سفارش تغییر کرده است.",
      );
    if (
      !paid &&
      (updated || String(original.paymentFailureIntentId) === String(intentId))
    ) {
      const key = `${intentId}:${generation.getTime()}`;
      if (type === "coach_booking") {
        await this.db
          .model<TrainingSession>(TrainingSession.name)
          .updateOne({ _id: resource._id, releasedPaymentIds: { $ne: key } }, [
            {
              $set: {
                bookedCount: { $max: [0, { $subtract: ["$bookedCount", 1] }] },
                status: {
                  $cond: [
                    { $eq: ["$status", "full"] },
                    "open_for_booking",
                    "$status",
                  ],
                },
                releasedPaymentIds: {
                  $concatArrays: [
                    { $ifNull: ["$releasedPaymentIds", []] },
                    [key],
                  ],
                },
              },
            },
          ]);
      } else {
        await this.db
          .model<TrainingClass>(TrainingClass.name)
          .updateOne({ _id: resource._id, releasedPaymentIds: { $ne: key } }, [
            {
              $set: {
                enrollmentCount: {
                  $max: [0, { $subtract: ["$enrollmentCount", 1] }],
                },
                releasedPaymentIds: {
                  $concatArrays: [
                    { $ifNull: ["$releasedPaymentIds", []] },
                    [key],
                  ],
                },
              },
            },
          ]);
      }
    }
    return {
      title: resource.title,
      userId: original.athleteId,
      referenceId,
      href:
        type === "coach_booking" ? "/athlete/reservations" : "/athlete/classes",
    };
  }
  async expire(
    type: CoachingPaymentReferenceType,
    referenceId: Types.ObjectId,
    now: Date,
  ) {
    if (type === "coach_package_purchase")
      return new CoachPackagePaymentReference(this.db).expire(referenceId, now);
    const item = await this.model(type).findOne({
      _id: referenceId,
      status: "pending",
      paymentStatus: "pending",
      paymentExpiresAt: { $lte: now, $ne: null },
    });
    if (!item) return false;
    await this.finalize(type, referenceId, false, referenceId);
    return true;
  }

  async refund(
    type: CoachingPaymentReferenceType,
    referenceId: Types.ObjectId,
    amount: number,
    full: boolean,
    intentCreatedAt?: Date,
  ) {
    if (type === "coach_package_purchase")
      return new CoachPackagePaymentReference(this.db).refund(referenceId);
    await this.model(type).updateOne(
      {
        _id: referenceId,
        ...(intentCreatedAt
          ? {
              [type === "coach_booking" ? "bookedAt" : "registeredAt"]: {
                $lte: intentCreatedAt,
              },
            }
          : {}),
      },
      {
        $set: {
          refundAmount: amount,
          paymentStatus: full ? "refunded" : "paid",
        },
      },
    );
  }
}
