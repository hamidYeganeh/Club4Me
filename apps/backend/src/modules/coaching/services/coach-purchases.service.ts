import {
  withReferenceSummaries,
  classDisplayReferences,
} from "../../../common/utils/reference-summaries";
import { paymentDeadline } from "../../commerce/payment-deadline";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  Atomic,
  lockPaymentReference,
} from "../../../infrastructure/database/atomic-operation";
import { AppError } from "../../../common/errors/app.exception";
import { CoachPackagePurchase } from "../schemas/coach-purchase.schema";
import { CoachOffering } from "../schemas/coaching.schemas";
import { CoachesService } from "./coaches.service";
import { objectId, toPublicDocument } from "../coaching.utils";

@Injectable()
export class CoachPurchasesService {
  constructor(
    @InjectModel(CoachPackagePurchase.name)
    private readonly purchases: Model<CoachPackagePurchase>,
    @InjectModel(CoachOffering.name)
    private readonly offerings: Model<CoachOffering>,
    private readonly coaches: CoachesService,
  ) {}
  async list(userId: string) {
    const items = await this.purchases
      .find({ athleteId: objectId(userId) })
      .sort({ purchasedAt: -1 })
      .limit(200);
    return {
      items: await withReferenceSummaries(
        this.purchases.db,
        items.map(toPublicDocument),
        classDisplayReferences,
      ),
    };
  }
  @Atomic("purchases")
  async create(userId: string, offeringId: string, key: string) {
    const athleteId = objectId(userId);
    await lockPaymentReference(
      this.purchases.db,
      "coach-package-order",
      `${athleteId}:${key}`,
    );
    const existing = await this.purchases.findOne({
      athleteId,
      idempotencyKey: key,
    });
    if (existing) {
      if (String(existing.offeringId) !== offeringId)
        throw new AppError(
          409,
          "IDEMPOTENCY_CONFLICT",
          "کلید خرید متعلق به خدمت دیگری است.",
        );
      return toPublicDocument(existing);
    }
    const offering = await this.offerings.findById(objectId(offeringId));
    if (
      !offering ||
      offering.status !== "published" ||
      offering.pricingType === "per_session"
    )
      throw new AppError(
        409,
        "PACKAGE_NOT_AVAILABLE",
        "این بسته قابل خرید نیست.",
      );
    const coach = await this.coaches.requireCoach(String(offering.coachId));
    if (coach.reviewStatus !== "approved" || coach.visibility !== "public")
      throw new AppError(409, "COACH_NOT_AVAILABLE", "مربی در دسترس نیست.");
    if (offering.pricingType === "package" && !offering.sessionCount)
      throw new AppError(
        409,
        "PACKAGE_TERMS_INVALID",
        "تعداد جلسات بسته مشخص نیست.",
      );
    const now = new Date();
    const free = offering.price.amount === 0;
    return toPublicDocument(
      await this.purchases.create({
        athleteId,
        coachId: offering.coachId,
        offeringId: offering._id,
        title: offering.title,
        pricingType: offering.pricingType,
        priceSnapshot: offering.price,
        sessionCount: offering.sessionCount ?? null,
        remainingSessions: offering.sessionCount ?? null,
        status: free ? "active" : "pending",
        paymentStatus: free ? "not_required" : "pending",
        purchasedAt: now,
        activatedAt: free ? now : null,
        expiresAt:
          free && offering.pricingType === "per_month"
            ? new Date(now.getTime() + 30 * 86400000)
            : null,
        paymentExpiresAt: paymentDeadline(undefined, now.getTime()),
        idempotencyKey: key,
      }),
    );
  }
}
