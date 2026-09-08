import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomBytes } from "node:crypto";
import { Model, Types } from "mongoose";
import { AppError } from "../../common/errors/app.exception";
import {
  Reservation,
  type ReservationDocument,
} from "../reservations/schemas/reservation.schema";
import {
  ReservableSession,
  type ReservableSessionDocument,
} from "../reservations/schemas/reservable-session.schema";
import type { CreateDiscountDto, CreditWalletDto } from "./benefits.dto";
import {
  PaymentIntent,
  type PaymentIntentDocument,
} from "./schemas/commerce.schema";
import {
  DiscountCampaign,
  type DiscountCampaignDocument,
  DiscountRedemption,
  type DiscountRedemptionDocument,
  Referral,
  type ReferralDocument,
  ReferralCode,
  type ReferralCodeDocument,
  WalletAccount,
  type WalletAccountDocument,
  WalletTransaction,
  type WalletTransactionDocument,
} from "./schemas/benefits.schema";

const REFERRAL_REWARD = 100_000;

@Injectable()
export class BenefitsService {
  constructor(
    @InjectModel(WalletAccount.name)
    private accounts: Model<WalletAccountDocument>,
    @InjectModel(WalletTransaction.name)
    private walletTransactions: Model<WalletTransactionDocument>,
    @InjectModel(DiscountCampaign.name)
    private campaigns: Model<DiscountCampaignDocument>,
    @InjectModel(DiscountRedemption.name)
    private redemptions: Model<DiscountRedemptionDocument>,
    @InjectModel(ReferralCode.name)
    private referralCodes: Model<ReferralCodeDocument>,
    @InjectModel(Referral.name) private referrals: Model<ReferralDocument>,
    @InjectModel(Reservation.name)
    private reservations: Model<ReservationDocument>,
    @InjectModel(ReservableSession.name)
    private sessions: Model<ReservableSessionDocument>,
    @InjectModel(PaymentIntent.name)
    private paymentIntents: Model<PaymentIntentDocument>,
  ) {}

  async wallet(userId: string) {
    await this.expireCredits(userId);
    const account = await this.accounts.findOneAndUpdate(
      { userId: oid(userId) },
      { $setOnInsert: { availableAmount: 0, reservedAmount: 0 } },
      { upsert: true, new: true },
    );
    const transactions = await this.walletTransactions
      .find({ userId: oid(userId) })
      .sort({ createdAt: -1 })
      .limit(100);
    return {
      availableAmount: account.availableAmount,
      reservedAmount: account.reservedAmount,
      transactions,
    };
  }

  async credit(input: CreditWalletDto) {
    const existing = await this.walletTransactions.findOne({
      idempotencyKey: input.idempotencyKey,
    });
    if (existing) return existing;
    const transaction = await this.walletTransactions.create({
      userId: oid(input.userId),
      type: "credit",
      amount: input.amount,
      source: input.source,
      idempotencyKey: input.idempotencyKey,
      note: input.note,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    });
    await this.accounts.updateOne(
      { userId: oid(input.userId) },
      {
        $inc: { availableAmount: input.amount },
        $setOnInsert: { reservedAmount: 0 },
      },
      { upsert: true },
    );
    return transaction;
  }

  async reserveWallet(userId: string, amount: number, key: string) {
    if (amount <= 0) return 0;
    const existing = await this.walletTransactions.findOne({
      idempotencyKey: key,
    });
    if (existing) return existing.amount;
    const account = await this.accounts.findOneAndUpdate(
      { userId: oid(userId), availableAmount: { $gte: amount } },
      { $inc: { availableAmount: -amount, reservedAmount: amount } },
      { new: true },
    );
    if (!account)
      throw new AppError(
        409,
        "INSUFFICIENT_WALLET_BALANCE",
        "Insufficient wallet balance",
      );
    await this.walletTransactions.create({
      userId: oid(userId),
      type: "reserve",
      amount,
      source: "payment",
      idempotencyKey: key,
    });
    return amount;
  }

  async createDiscount(input: CreateDiscountDto) {
    if (new Date(input.startsAt) >= new Date(input.endsAt))
      throw new AppError(
        400,
        "INVALID_CAMPAIGN_RANGE",
        "Invalid campaign range",
      );
    const scopeType =
      input.scopeType === "global" && input.clubIds.length
        ? "club"
        : input.scopeType;
    const scopeIds =
      scopeType === "club" && !input.scopeIds.length
        ? input.clubIds
        : input.scopeIds;
    return this.campaigns.create({
      ...input,
      code: input.code.toUpperCase(),
      budgetRemaining: input.budget,
      clubIds: input.clubIds.map(oid),
      scopeType,
      scopeIds,
      eligibleUserIds: input.eligibleUserIds.map(oid),
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      isActive: true,
    });
  }

  async quoteDiscount(userId: string, code: string, referenceId: string) {
    const reservation = await this.reservations.findOne({
      _id: oid(referenceId),
      userId: oid(userId),
      status: "reserved",
    });
    if (!reservation)
      throw new AppError(404, "RESERVATION_NOT_FOUND", "Reservation not found");
    const session = await this.sessions.findById(reservation.sessionId);
    return this.quoteDiscountForContext(userId, code, {
      referenceType: "reservation",
      referenceId: reservation._id,
      grossAmount: reservation.totalPrice,
      scopeValues: {
        club: [String(reservation.clubId)],
        coach: session?.coachId ? [String(session.coachId)] : [],
        class: session?.classId ? [String(session.classId)] : [],
        sport: [],
        product: [],
        session_type: [reservation.sessionType],
      },
    });
  }

  async quoteDiscountForContext(
    userId: string,
    code: string,
    context: DiscountContext,
  ) {
    const now = new Date();
    const campaign = await this.campaigns.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    });
    if (
      !campaign ||
      context.grossAmount < campaign.minOrderAmount ||
      !scopeMatches(campaign, context)
    )
      throw new AppError(
        409,
        "DISCOUNT_NOT_APPLICABLE",
        "Discount is not applicable",
      );
    if (
      campaign.eligibleUserIds.length > 0 &&
      !campaign.eligibleUserIds.some((id) => id.equals(oid(userId)))
    ) {
      throw new AppError(
        409,
        "DISCOUNT_NOT_APPLICABLE",
        "Discount is not applicable",
      );
    }
    if (
      campaign.referredOnly &&
      !(await this.referrals.exists({
        inviteeId: oid(userId),
        status: { $ne: "rejected" },
      }))
    ) {
      throw new AppError(
        409,
        "DISCOUNT_REQUIRES_REFERRAL",
        "Discount requires a referral",
      );
    }
    if (
      campaign.firstPurchaseOnly &&
      (await this.paymentIntents.exists({
        userId: oid(userId),
        status: "paid",
      }))
    ) {
      throw new AppError(
        409,
        "DISCOUNT_FIRST_PURCHASE_ONLY",
        "Discount is limited to the first purchase",
      );
    }
    if (
      campaign.usageLimit !== null &&
      campaign.usageCount >= campaign.usageLimit
    ) {
      throw new AppError(
        409,
        "DISCOUNT_LIMIT_REACHED",
        "Discount usage limit reached",
      );
    }
    const used = await this.redemptions.countDocuments({
      campaignId: campaign._id,
      userId: oid(userId),
      status: { $ne: "released" },
    });
    if (used >= campaign.perUserLimit)
      throw new AppError(
        409,
        "DISCOUNT_LIMIT_REACHED",
        "Discount usage limit reached",
      );
    const raw =
      campaign.kind === "fixed"
        ? campaign.value
        : Math.round((context.grossAmount * campaign.value) / 100);
    const amount = Math.min(
      raw,
      campaign.maxDiscount ?? raw,
      campaign.budgetRemaining,
      context.grossAmount - 1,
    );
    if (amount <= 0)
      throw new AppError(
        409,
        "DISCOUNT_EXHAUSTED",
        "Discount budget is exhausted",
      );
    const platformPercentage =
      campaign.funding.find((item) => item.source === "platform")?.percentage ??
      100;
    const platformFundedAmount = Math.round(
      (amount * platformPercentage) / 100,
    );
    return {
      campaignId: String(campaign._id),
      code: campaign.code,
      amount,
      payableAmount: context.grossAmount - amount,
      platformFundedAmount,
      providerFundedAmount: amount - platformFundedAmount,
    };
  }

  async reserveDiscount(
    userId: string,
    code: string,
    context: DiscountContext,
  ) {
    const quote = await this.quoteDiscountForContext(userId, code, context);
    const existing = await this.redemptions.findOne({
      campaignId: oid(quote.campaignId),
      userId: oid(userId),
      referenceId: context.referenceId,
    });
    if (existing && existing.status !== "released") {
      return redemptionReservation(existing);
    }
    const campaign = await this.campaigns.findOneAndUpdate(
      {
        _id: oid(quote.campaignId),
        budgetRemaining: { $gte: quote.amount },
        ...quoteUsageAvailabilityFilter(),
      },
      { $inc: { budgetRemaining: -quote.amount, usageCount: 1 } },
      { new: true },
    );
    if (!campaign)
      throw new AppError(
        409,
        "DISCOUNT_EXHAUSTED",
        "Discount budget is exhausted",
      );
    try {
      const payload = {
        amount: quote.amount,
        platformFundedAmount: quote.platformFundedAmount,
        providerFundedAmount: quote.providerFundedAmount,
        referenceType: context.referenceType,
        status: "reserved" as const,
        expiresAt: new Date(Date.now() + 15 * 60_000),
      };
      if (existing) {
        await this.redemptions.updateOne(
          { _id: existing._id, status: "released" },
          { $set: payload },
        );
      } else {
        await this.redemptions.create({
          campaignId: campaign._id,
          userId: oid(userId),
          referenceId: context.referenceId,
          ...payload,
        });
      }
    } catch (error) {
      await this.campaigns.updateOne(
        { _id: campaign._id },
        { $inc: { budgetRemaining: quote.amount, usageCount: -1 } },
      );
      if (isDuplicate(error)) {
        const existing = await this.redemptions.findOne({
          campaignId: campaign._id,
          userId: oid(userId),
          referenceId: context.referenceId,
        });
        if (existing) return redemptionReservation(existing);
      }
      throw error;
    }
    return {
      amount: quote.amount,
      campaignId: campaign._id,
      platformFundedAmount: quote.platformFundedAmount,
      providerFundedAmount: quote.providerFundedAmount,
    };
  }

  async finalizePayment(
    userId: string,
    referenceId: Types.ObjectId,
    paid: boolean,
    walletReservationKey?: string,
  ) {
    const walletKey =
      walletReservationKey?.trim() || `payment-wallet-${referenceId}`;
    const wallet = await this.walletTransactions.findOne({
      idempotencyKey: walletKey,
    });
    if (wallet?.type === "reserve") {
      await this.accounts.updateOne(
        { userId: oid(userId), reservedAmount: { $gte: wallet.amount } },
        {
          $inc: paid
            ? { reservedAmount: -wallet.amount }
            : {
                reservedAmount: -wallet.amount,
                availableAmount: wallet.amount,
              },
        },
      );
      await this.walletTransactions.updateOne(
        {
          idempotencyKey: `${walletKey}-${paid ? "consume" : "release"}`,
        },
        {
          $setOnInsert: {
            userId: oid(userId),
            type: paid ? "consume" : "release",
            amount: wallet.amount,
            source: "payment",
          },
        },
        { upsert: true },
      );
    }
    const redemption = await this.redemptions.findOne({
      userId: oid(userId),
      referenceId,
      status: "reserved",
    });
    if (redemption) {
      redemption.status = paid ? "consumed" : "released";
      await redemption.save();
      if (!paid)
        await this.campaigns.updateOne(
          { _id: redemption.campaignId },
          {
            $inc: {
              budgetRemaining: redemption.amount,
              usageCount: -1,
            },
          },
        );
    }
  }

  async myReferralCode(userId: string) {
    let item = await this.referralCodes.findOne({ userId: oid(userId) });
    if (!item)
      item = await this.referralCodes.create({
        userId: oid(userId),
        code: randomBytes(5).toString("hex").toUpperCase(),
      });
    return { code: item.code };
  }

  async redeemReferral(userId: string, code: string) {
    const owner = await this.referralCodes.findOne({
      code: code.toUpperCase(),
    });
    if (!owner || String(owner.userId) === userId)
      throw new AppError(409, "INVALID_REFERRAL", "Referral code is invalid");
    const item = await this.referrals.findOneAndUpdate(
      { inviteeId: oid(userId) },
      { $setOnInsert: { inviterId: owner.userId, status: "pending" } },
      { upsert: true, new: true },
    );
    return { status: item.status };
  }

  async settleReferral(userId: string) {
    const item = await this.referrals.findOneAndUpdate(
      { inviteeId: oid(userId), status: "pending" },
      { $set: { status: "rewarded", rewardedAt: new Date() } },
      { new: true },
    );
    if (!item) return;
    await this.credit({
      userId: String(item.inviterId),
      amount: REFERRAL_REWARD,
      source: "referral",
      idempotencyKey: `referral-inviter-${item._id}`,
      note: "Referral reward",
      expiresAt: null,
    });
    await this.credit({
      userId: String(item.inviteeId),
      amount: REFERRAL_REWARD,
      source: "referral",
      idempotencyKey: `referral-invitee-${item._id}`,
      note: "Referral reward",
      expiresAt: null,
    });
  }

  async refundWallet(
    userId: string,
    amount: number,
    paymentIntentId: Types.ObjectId,
    idempotencyKey: string,
  ) {
    if (amount <= 0) return null;
    return this.credit({
      userId,
      amount,
      source: "refund",
      idempotencyKey: `wallet-refund-${paymentIntentId}-${idempotencyKey}`,
      note: "Payment refund",
      expiresAt: null,
    });
  }

  private async expireCredits(userId: string) {
    const expired = await this.walletTransactions.find({
      userId: oid(userId),
      type: "credit",
      expiresAt: { $lte: new Date() },
      expirationProcessedAt: null,
    });
    // Expiration is capped by current available balance; immutable credit rows remain auditable.
    for (const row of expired) {
      const key = `expire-${row.id}`;
      if (await this.walletTransactions.exists({ idempotencyKey: key }))
        continue;
      const current = await this.accounts.findOne({ userId: oid(userId) });
      const amount = Math.min(row.amount, current?.availableAmount ?? 0);
      if (amount > 0) {
        await this.accounts.updateOne(
          { userId: oid(userId) },
          { $inc: { availableAmount: -amount } },
        );
        await this.walletTransactions.create({
          userId: oid(userId),
          type: "expire",
          amount,
          source: row.source,
          idempotencyKey: key,
        });
      }
      await this.walletTransactions.updateOne(
        { _id: row._id },
        { $set: { expirationProcessedAt: new Date() } },
      );
    }
  }
}

export type DiscountReferenceType =
  | "reservation"
  | "benefit_purchase"
  | "business_class_enrollment"
  | "coach_booking"
  | "coach_class_enrollment"
  | "coach_package_purchase";

export type DiscountScopeType =
  "club" | "coach" | "class" | "sport" | "product" | "session_type";

export type DiscountContext = {
  referenceType: DiscountReferenceType;
  referenceId: Types.ObjectId;
  grossAmount: number;
  scopeValues: Record<DiscountScopeType, string[]>;
};

function scopeMatches(
  campaign: DiscountCampaignDocument,
  context: DiscountContext,
) {
  const scopeType = campaign.scopeType ?? "global";
  if (scopeType === "global") {
    return (
      !campaign.clubIds.length ||
      campaign.clubIds.some((id) =>
        context.scopeValues.club.includes(String(id)),
      )
    );
  }
  const allowed = campaign.scopeIds ?? [];
  return context.scopeValues[scopeType].some((value) =>
    allowed.includes(value),
  );
}

function quoteUsageAvailabilityFilter() {
  return {
    $expr: {
      $or: [
        { $eq: [{ $ifNull: ["$usageLimit", null] }, null] },
        {
          $lt: [
            { $ifNull: ["$usageCount", 0] },
            { $ifNull: ["$usageLimit", Number.MAX_SAFE_INTEGER] },
          ],
        },
      ],
    },
  };
}

function redemptionReservation(item: DiscountRedemptionDocument) {
  return {
    amount: item.amount,
    campaignId: item.campaignId,
    platformFundedAmount: item.platformFundedAmount ?? item.amount,
    providerFundedAmount: item.providerFundedAmount ?? 0,
  };
}

function oid(value: string) {
  if (!Types.ObjectId.isValid(value))
    throw new AppError(400, "INVALID_OBJECT_ID", "Invalid id");
  return new Types.ObjectId(value);
}
function isDuplicate(error: unknown): error is { code: 11000 } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}
