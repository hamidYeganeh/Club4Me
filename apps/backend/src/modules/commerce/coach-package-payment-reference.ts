import { Connection, Types } from "mongoose";
import { AppError } from "../../common/errors/app.exception";
import { CoachPackagePurchase } from "../coaching/schemas/coach-purchase.schema";
import { Coach, CoachOffering } from "../coaching/schemas/coaching.schemas";

export class CoachPackagePaymentReference {
  constructor(private readonly db: Connection) {}
  private model() {
    return this.db.model<CoachPackagePurchase>(CoachPackagePurchase.name);
  }
  async payable(userId: string, referenceId: string) {
    const item = await this.model().findOne({
      _id: new Types.ObjectId(referenceId),
      athleteId: new Types.ObjectId(userId),
      status: "pending",
      paymentStatus: "pending",
      paymentExpiresAt: { $gt: new Date() },
    });
    if (!item)
      throw new AppError(
        409,
        "REFERENCE_NOT_PAYABLE",
        "خرید قابل پرداخت نیست.",
      );
    const [offering, coach] = await Promise.all([
      this.db
        .model<CoachOffering>(CoachOffering.name)
        .findById(item.offeringId),
      this.db.model<Coach>(Coach.name).findById(item.coachId),
    ]);
    if (
      offering?.status !== "published" ||
      coach?.reviewStatus !== "approved" ||
      coach.visibility !== "public"
    )
      throw new AppError(409, "SERVICE_NOT_AVAILABLE", "خدمت در دسترس نیست.");
    return {
      referenceId: item._id,
      coachId: item.coachId,
      clubId: undefined,
      classId: undefined,
      amount: item.priceSnapshot.amount,
      currency: item.priceSnapshot.currency,
      title: item.title,
      expiresAt: item.paymentExpiresAt,
      generationStartedAt: item.purchasedAt,
    };
  }
  async finalize(referenceId: Types.ObjectId, paid: boolean) {
    const original = await this.model().findById(referenceId);
    if (!original)
      throw new AppError(404, "REFERENCE_NOT_FOUND", "خرید پیدا نشد.");
    if (paid && original.status === "active") return null;
    const now = new Date();
    const updated = await this.model().findOneAndUpdate(
      {
        _id: referenceId,
        status: "pending",
        paymentStatus: "pending",
        ...(paid ? { paymentExpiresAt: { $gt: now } } : {}),
      },
      {
        $set: {
          status: paid ? "active" : "failed",
          paymentStatus: paid ? "paid" : "failed",
          activatedAt: paid ? now : null,
          expiresAt:
            paid && original.pricingType === "per_month"
              ? new Date(now.getTime() + 30 * 86400000)
              : null,
        },
      },
      { new: true },
    );
    if (!updated && paid)
      throw new AppError(
        409,
        "REFERENCE_STATUS_CHANGED",
        "خرید منقضی شده یا وضعیت آن تغییر کرده است.",
      );
    return updated
      ? {
          title: original.title,
          userId: original.athleteId,
          referenceId,
          href: "/athlete/packages",
        }
      : null;
  }
  async expire(referenceId: Types.ObjectId, now: Date) {
    const result = await this.model().updateOne(
      {
        _id: referenceId,
        status: "pending",
        paymentStatus: "pending",
        paymentExpiresAt: { $lte: now },
      },
      { $set: { status: "failed", paymentStatus: "failed" } },
    );
    return result.modifiedCount > 0;
  }
  async refund(referenceId: Types.ObjectId) {
    await this.model().updateOne(
      { _id: referenceId },
      {
        $set: {
          status: "refunded",
          paymentStatus: "refunded",
          remainingSessions: 0,
        },
      },
    );
  }
}
