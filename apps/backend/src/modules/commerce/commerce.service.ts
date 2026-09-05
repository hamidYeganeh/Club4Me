import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { createHash, randomUUID } from "node:crypto";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { NotificationsService } from "../notifications/notifications.service";
import { BusinessClassPortalService } from "../business-operations/class-portal.service";
import {
  Reservation,
  type ReservationDocument,
} from "../reservations/schemas/reservation.schema";
import {
  ReservableSession,
  type ReservableSessionDocument,
} from "../reservations/schemas/reservable-session.schema";
import type {
  CreatePaymentIntentDto,
  MockPaymentCallbackDto,
  RefundPaymentDto,
} from "./commerce.dto";
import { BenefitsService } from "./benefits.service";
import { EntitlementsService } from "./entitlements.service";
import { MockPaymentProvider } from "./mock-payment.provider";
import {
  LedgerEntry,
  type LedgerEntryDocument,
  PaymentCallbackEvent,
  type PaymentCallbackEventDocument,
  PaymentIntent,
  type PaymentIntentDocument,
  SettlementAccount,
  type SettlementAccountDocument,
} from "./schemas/commerce.schema";

const PLATFORM_FEE_PERCENT = 10;

@Injectable()
export class CommerceService {
  constructor(
    @InjectModel(PaymentIntent.name)
    private readonly intents: Model<PaymentIntentDocument>,
    @InjectModel(PaymentCallbackEvent.name)
    private readonly callbacks: Model<PaymentCallbackEventDocument>,
    @InjectModel(LedgerEntry.name)
    private readonly ledger: Model<LedgerEntryDocument>,
    @InjectModel(Reservation.name)
    private readonly reservations: Model<ReservationDocument>,
    @InjectModel(ReservableSession.name)
    private readonly sessions: Model<ReservableSessionDocument>,
    @InjectModel(SettlementAccount.name)
    private readonly settlementAccounts: Model<SettlementAccountDocument>,
    private readonly mockProvider: MockPaymentProvider,
    private readonly notifications: NotificationsService,
    private readonly benefits: BenefitsService,
    private readonly entitlements: EntitlementsService,
    private readonly classPortal: BusinessClassPortalService,
  ) {}

  async createIntent(userId: string, input: CreatePaymentIntentDto) {
    const existing = await this.intents.findOne({
      userId: oid(userId),
      idempotencyKey: input.idempotencyKey,
    });
    if (existing) return paymentDto(existing);

    const reservation =
      input.referenceType === "reservation"
        ? await this.reservations.findOne({
            _id: oid(input.referenceId),
            userId: oid(userId),
            status: "reserved",
            paymentStatus: "pending",
          })
        : null;
    const purchase =
      input.referenceType === "benefit_purchase"
        ? await this.entitlements.payablePurchase(userId, input.referenceId)
        : null;
    const classEnrollment =
      input.referenceType === "business_class_enrollment"
        ? await this.classPortal.payableEnrollment(userId, input.referenceId)
        : null;
    if (!reservation && !purchase && !classEnrollment) {
      throw new AppError(
        409,
        "REFERENCE_NOT_PAYABLE",
        "Reference is not payable",
      );
    }
    const grossAmount =
      reservation?.totalPrice ?? purchase?.amount ?? classEnrollment!.amount;
    const clubId =
      reservation?.clubId ?? purchase?.clubId ?? classEnrollment!.clubId;
    const referenceId =
      reservation?._id ?? purchase?._id ?? classEnrollment!.referenceId;
    const description =
      reservation?.sessionTitle ??
      (purchase ? `خرید مزایا ${String(purchase._id)}` : undefined) ??
      classEnrollment!.title;
    const session = reservation
      ? await this.sessions.findById(reservation.sessionId)
      : null;
    if (grossAmount <= 0) {
      throw new AppError(
        409,
        "PAYMENT_NOT_REQUIRED",
        "Payment is not required",
      );
    }

    const walletReservationKey = `payment-wallet-${input.idempotencyKey}`;
    try {
      const discount = input.couponCode
        ? await this.benefits.reserveDiscount(userId, input.couponCode, {
            referenceType: input.referenceType,
            referenceId,
            grossAmount,
            scopeValues: {
              club: [String(clubId)],
              coach: [
                ...(session?.coachId ? [String(session.coachId)] : []),
                ...(classEnrollment?.coachId
                  ? [String(classEnrollment.coachId)]
                  : []),
              ],
              class: [
                ...(session?.classId ? [String(session.classId)] : []),
                ...(classEnrollment?.classId
                  ? [String(classEnrollment.classId)]
                  : []),
              ],
              sport: classEnrollment?.sport
                ? [classEnrollment.sport.trim().toLocaleLowerCase("fa-IR")]
                : [],
              product: purchase ? [String(purchase.productId)] : [],
              session_type: reservation
                ? [reservation.sessionType]
                : classEnrollment
                  ? ["class"]
                  : [],
            },
          })
        : null;
      const discountAmount = discount?.amount ?? 0;
      const walletAmount = Math.min(
        input.walletAmount,
        grossAmount - discountAmount - 1,
      );
      if (walletAmount > 0)
        await this.benefits.reserveWallet(
          userId,
          walletAmount,
          walletReservationKey,
        );
      const amount = grossAmount - discountAmount - walletAmount;
      const providerPayment = await this.mockProvider.createPayment({
        amount,
        callbackUrl: input.returnUrl,
        description: `Club4Me - ${description}`.slice(0, 250),
      });
      const intent = await this.intents.create({
        userId: oid(userId),
        clubId,
        referenceType: input.referenceType,
        referenceId,
        amount,
        grossAmount,
        discountAmount,
        walletAmount,
        platformFee: Math.min(
          Math.round((grossAmount * PLATFORM_FEE_PERCENT) / 100),
          grossAmount - (discount?.providerFundedAmount ?? 0),
        ),
        platformFundedDiscount: discount?.platformFundedAmount ?? 0,
        providerFundedDiscount: discount?.providerFundedAmount ?? 0,
        discountCampaignId: discount?.campaignId ?? null,
        provider: "mock",
        authority: providerPayment.authority,
        checkoutUrl: providerPayment.checkoutUrl,
        walletReservationKey,
        idempotencyKey: input.idempotencyKey,
        returnUrl: input.returnUrl,
        status: "pending",
      });
      return paymentDto(intent);
    } catch (error) {
      const intent = await this.intents.findOne({
        userId: oid(userId),
        idempotencyKey: input.idempotencyKey,
      });
      if (intent) return paymentDto(intent);
      await this.benefits.finalizePayment(
        userId,
        referenceId,
        false,
        walletReservationKey,
      );
      throw error;
    }
  }

  async simulate(userId: string, intentId: string, status: "paid" | "failed") {
    const intent = await this.intents.findOne({
      _id: oid(intentId),
      userId: oid(userId),
    });
    if (!intent)
      throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found");
    if (intent.provider !== "mock") {
      throw new AppError(
        409,
        "MOCK_PAYMENT_DISABLED",
        "This payment does not use the mock provider",
      );
    }
    const callback = this.mockProvider.createCallback({
      intentId: String(intent._id),
      authority: intent.authority,
      amount: intent.amount,
      status,
    });
    return this.processCallback(callback.payload, callback.signature);
  }

  async processCallback(payload: MockPaymentCallbackDto, signature?: string) {
    if (!this.mockProvider.assertSignature(payload, signature)) {
      throw new AppError(
        401,
        "INVALID_CALLBACK_SIGNATURE",
        "Callback signature is invalid or expired",
      );
    }
    const previous = await this.callbacks.findOne({
      provider: "mock",
      eventId: payload.eventId,
    });
    if (previous) {
      const intent = await this.intents.findById(previous.intentId);
      if (!intent)
        throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found");
      return paymentDto(intent);
    }

    const intent = await this.intents.findOne({
      _id: oid(payload.intentId),
      authority: payload.authority,
      amount: payload.amount,
    });
    if (!intent)
      throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found");

    const result =
      payload.status === "paid"
        ? await this.capture(intent)
        : await this.fail(intent);
    try {
      await this.callbacks.create({
        provider: "mock",
        eventId: payload.eventId,
        intentId: intent._id,
        payloadHash: createHash("sha256")
          .update(JSON.stringify(payload))
          .digest("hex"),
        processedAt: new Date(),
      });
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }
    return result;
  }

  async refund(intentId: string, input: RefundPaymentDto) {
    const priorEntries = await this.ledger.find({
      sourceType: "refund",
      idempotencyKey: input.idempotencyKey,
    });
    if (priorEntries.length) {
      const intent = await this.intents.findById(intentId);
      if (!intent)
        throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found");
      return paymentDto(intent);
    }
    const intent = await this.intents.findById(intentId);
    if (!intent || !["paid", "partially_refunded"].includes(intent.status)) {
      throw new AppError(
        409,
        "PAYMENT_NOT_REFUNDABLE",
        "Payment is not refundable",
      );
    }
    const remainingGross = intent.grossAmount - intent.refundedAmount;
    const grossRefund = input.amount ?? remainingGross;
    if (grossRefund > remainingGross) {
      throw new AppError(
        409,
        "REFUND_EXCEEDS_PAYMENT",
        "Refund exceeds remaining paid amount",
      );
    }
    const cumulativeGrossRefund = intent.refundedAmount + grossRefund;
    const targetGatewayRefund = Math.round(
      (intent.amount * cumulativeGrossRefund) / intent.grossAmount,
    );
    const targetWalletRefund = Math.round(
      (intent.walletAmount * cumulativeGrossRefund) / intent.grossAmount,
    );
    const gatewayRefund =
      targetGatewayRefund - (intent.refundedGatewayAmount ?? 0);
    const walletRefund =
      targetWalletRefund - (intent.refundedWalletAmount ?? 0);
    const discountReversal = grossRefund - gatewayRefund - walletRefund;
    const targetTotalDiscountReversal =
      cumulativeGrossRefund - targetGatewayRefund - targetWalletRefund;
    const targetProviderDiscountReversal = Math.round(
      ((intent.providerFundedDiscount ?? 0) * cumulativeGrossRefund) /
        intent.grossAmount,
    );
    const targetPlatformDiscountReversal =
      targetTotalDiscountReversal - targetProviderDiscountReversal;
    const platformDiscountReversal =
      targetPlatformDiscountReversal -
      (intent.refundedPlatformFundedDiscount ?? 0);
    const providerDiscountReversal =
      targetProviderDiscountReversal -
      (intent.refundedProviderFundedDiscount ?? 0);
    const targetFeeReversal = Math.round(
      (intent.platformFee * cumulativeGrossRefund) / intent.grossAmount,
    );
    const previousFeeReversal = Math.round(
      (intent.platformFee * intent.refundedAmount) / intent.grossAmount,
    );
    const feeReversal = targetFeeReversal - previousFeeReversal;
    const providerReversal =
      grossRefund - feeReversal - providerDiscountReversal;

    if (providerReversal > 0) {
      const account = await this.settlementAccounts.findOneAndUpdate(
        {
          providerId: intent.clubId,
          availableAmount: { $gte: providerReversal },
        },
        { $inc: { availableAmount: -providerReversal } },
        { new: true },
      );
      if (!account) {
        throw new AppError(
          409,
          "PROVIDER_BALANCE_RESERVED",
          "Provider balance is currently reserved for payout",
        );
      }
    }
    const transactionId = randomUUID();
    await this.postEntries([
      {
        transactionId,
        account: "provider_payable",
        ownerId: intent.clubId,
        direction: "debit",
        amount: providerReversal,
        sourceType: "refund",
        sourceId: intent._id,
        idempotencyKey: input.idempotencyKey,
      },
      ...(feeReversal
        ? [
            {
              transactionId,
              account: "platform_revenue" as const,
              ownerId: null,
              direction: "debit" as const,
              amount: feeReversal,
              sourceType: "refund" as const,
              sourceId: intent._id,
              idempotencyKey: input.idempotencyKey,
            },
          ]
        : []),
      ...(gatewayRefund
        ? [
            {
              transactionId,
              account: "platform_cash" as const,
              ownerId: null,
              direction: "credit" as const,
              amount: gatewayRefund,
              sourceType: "refund" as const,
              sourceId: intent._id,
              idempotencyKey: input.idempotencyKey,
            },
          ]
        : []),
      ...(walletRefund
        ? [
            {
              transactionId,
              account: "wallet_liability" as const,
              ownerId: intent.userId,
              direction: "credit" as const,
              amount: walletRefund,
              sourceType: "refund" as const,
              sourceId: intent._id,
              idempotencyKey: input.idempotencyKey,
            },
          ]
        : []),
      ...(platformDiscountReversal
        ? [
            {
              transactionId,
              account: "promotion_expense" as const,
              ownerId: null,
              direction: "credit" as const,
              amount: platformDiscountReversal,
              sourceType: "refund" as const,
              sourceId: intent._id,
              idempotencyKey: input.idempotencyKey,
            },
          ]
        : []),
    ]);
    await this.benefits.refundWallet(
      String(intent.userId),
      walletRefund,
      intent._id,
      input.idempotencyKey,
    );
    intent.refundedAmount += grossRefund;
    intent.refundedGatewayAmount =
      (intent.refundedGatewayAmount ?? 0) + gatewayRefund;
    intent.refundedWalletAmount =
      (intent.refundedWalletAmount ?? 0) + walletRefund;
    intent.refundedDiscountAmount =
      (intent.refundedDiscountAmount ?? 0) + discountReversal;
    intent.refundedPlatformFundedDiscount =
      (intent.refundedPlatformFundedDiscount ?? 0) + platformDiscountReversal;
    intent.refundedProviderFundedDiscount =
      (intent.refundedProviderFundedDiscount ?? 0) + providerDiscountReversal;
    intent.status =
      intent.refundedAmount === intent.grossAmount
        ? "refunded"
        : "partially_refunded";
    await intent.save();
    if (intent.referenceType === "reservation") {
      await this.reservations.updateOne(
        { _id: intent.referenceId },
        {
          $set: {
            paymentStatus: intent.status === "refunded" ? "refunded" : "paid",
            refundAmount: intent.refundedAmount,
          },
        },
      );
    }
    if (intent.referenceType === "benefit_purchase") {
      await this.entitlements.refundPurchase(intent.referenceId);
    }
    if (
      intent.referenceType === "business_class_enrollment" &&
      intent.status === "refunded"
    ) {
      await this.classPortal.refundEnrollmentPayment(intent.referenceId);
    }
    return paymentDto(intent);
  }

  async refundReservation(
    reservationId: string | Types.ObjectId,
    amount: number,
    reason: string,
  ) {
    if (amount <= 0) return null;
    const intent = await this.intents
      .findOne({
        referenceType: "reservation",
        referenceId: new Types.ObjectId(String(reservationId)),
        status: { $in: ["paid", "partially_refunded"] },
      })
      .sort({ createdAt: -1 });
    if (!intent) {
      throw new AppError(
        409,
        "PAID_INTENT_NOT_FOUND",
        "Paid payment intent was not found for reservation",
      );
    }
    return this.refund(String(intent._id), {
      amount,
      reason,
      idempotencyKey: `reservation-cancel-${String(reservationId)}`,
    });
  }

  async reconcile() {
    const candidates = await this.intents
      .find({
        status: { $in: ["paid", "partially_refunded", "refunded"] },
        reconciledAt: null,
      })
      .limit(500);
    const matchedIds: Types.ObjectId[] = [];
    const mismatches: Array<{ intentId: string; reason: string }> = [];
    for (const intent of candidates) {
      const entries = await this.ledger.find({
        sourceType: { $in: ["payment", "refund"] },
        sourceId: intent._id,
      });
      const debit = entries
        .filter((entry) => entry.direction === "debit")
        .reduce((sum, entry) => sum + entry.amount, 0);
      const credit = entries
        .filter((entry) => entry.direction === "credit")
        .reduce((sum, entry) => sum + entry.amount, 0);
      const hasPayment = entries.some(
        (entry) => entry.sourceType === "payment",
      );
      if (!hasPayment || debit !== credit) {
        mismatches.push({
          intentId: String(intent._id),
          reason: !hasPayment ? "PAYMENT_LEDGER_MISSING" : "LEDGER_UNBALANCED",
        });
      } else {
        matchedIds.push(intent._id);
      }
    }
    if (matchedIds.length) {
      await this.intents.updateMany(
        { _id: { $in: matchedIds } },
        { $set: { reconciledAt: new Date() } },
      );
    }
    return {
      checked: candidates.length,
      matched: matchedIds.length,
      mismatches,
    };
  }

  private async capture(intent: PaymentIntentDocument) {
    if (intent.status === "paid") return paymentDto(intent);
    if (intent.status !== "pending") {
      throw new AppError(
        409,
        "PAYMENT_STATUS_CHANGED",
        "Payment is no longer pending",
      );
    }
    const paid = await this.intents.findOneAndUpdate(
      { _id: intent._id, status: "pending" },
      { $set: { status: "paid", paidAt: new Date() } },
      { new: true },
    );
    if (!paid) {
      const current = await this.intents.findById(intent._id);
      if (!current)
        throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found");
      return paymentDto(current);
    }
    const transactionId = randomUUID();
    await this.postEntries([
      {
        transactionId,
        account: "platform_cash",
        ownerId: null,
        direction: "debit",
        amount: paid.amount,
        sourceType: "payment",
        sourceId: paid._id,
        idempotencyKey: paid.idempotencyKey,
      },
      ...(paid.walletAmount
        ? [
            {
              transactionId,
              account: "wallet_liability" as const,
              ownerId: paid.userId,
              direction: "debit" as const,
              amount: paid.walletAmount,
              sourceType: "payment" as const,
              sourceId: paid._id,
              idempotencyKey: paid.idempotencyKey,
            },
          ]
        : []),
      ...(paid.platformFundedDiscount
        ? [
            {
              transactionId,
              account: "promotion_expense" as const,
              ownerId: null,
              direction: "debit" as const,
              amount: paid.platformFundedDiscount,
              sourceType: "payment" as const,
              sourceId: paid._id,
              idempotencyKey: paid.idempotencyKey,
            },
          ]
        : []),
      ...(paid.grossAmount - paid.platformFee - paid.providerFundedDiscount > 0
        ? [
            {
              transactionId,
              account: "provider_payable" as const,
              ownerId: paid.clubId,
              direction: "credit" as const,
              amount:
                paid.grossAmount -
                paid.platformFee -
                paid.providerFundedDiscount,
              sourceType: "payment" as const,
              sourceId: paid._id,
              idempotencyKey: paid.idempotencyKey,
            },
          ]
        : []),
      ...(paid.platformFee
        ? [
            {
              transactionId,
              account: "platform_revenue" as const,
              ownerId: null,
              direction: "credit" as const,
              amount: paid.platformFee,
              sourceType: "payment" as const,
              sourceId: paid._id,
              idempotencyKey: paid.idempotencyKey,
            },
          ]
        : []),
    ]);
    await this.settlementAccounts.updateOne(
      { providerId: paid.clubId },
      {
        $inc: {
          availableAmount:
            paid.grossAmount - paid.platformFee - paid.providerFundedDiscount,
        },
      },
      { upsert: true },
    );
    const reservation =
      paid.referenceType === "reservation"
        ? await this.reservations.findOneAndUpdate(
            {
              _id: paid.referenceId,
              paymentStatus: "pending",
              status: "reserved",
            },
            { $set: { paymentStatus: "paid" } },
            { new: true },
          )
        : null;
    if (reservation) {
      await this.entitlements.finalizeReservation(reservation._id, true);
      await this.notifications.notifyBookingConfirmed({
        userId: reservation.userId,
        bookingId: reservation._id,
        title: reservation.sessionTitle,
      });
    }
    await this.benefits.finalizePayment(
      String(paid.userId),
      paid.referenceId,
      true,
      paid.walletReservationKey,
    );
    if (paid.referenceType === "benefit_purchase") {
      await this.entitlements.finalizePurchase(paid.referenceId, true);
    }
    if (paid.referenceType === "business_class_enrollment") {
      const enrollment = await this.classPortal.finalizeEnrollmentPayment(
        paid.referenceId,
        true,
      );
      await this.notifications.notifyBookingConfirmed({
        userId: paid.userId,
        bookingId: paid.referenceId,
        title: enrollment.title,
        href: `/athlete/classes/${String(paid.referenceId)}`,
      });
    }
    await this.benefits.settleReferral(String(paid.userId));
    return paymentDto(paid);
  }

  private async fail(intent: PaymentIntentDocument) {
    if (intent.status === "failed") return paymentDto(intent);
    const failed = await this.intents.findOneAndUpdate(
      { _id: intent._id, status: "pending" },
      { $set: { status: "failed", failedAt: new Date() } },
      { new: true },
    );
    if (!failed) {
      throw new AppError(
        409,
        "PAYMENT_STATUS_CHANGED",
        "Payment is no longer pending",
      );
    }
    const reservation =
      failed.referenceType === "reservation"
        ? await this.reservations.findOneAndUpdate(
            {
              _id: failed.referenceId,
              paymentStatus: "pending",
              status: "reserved",
            },
            {
              $set: {
                paymentStatus: "failed",
                status: "cancelled",
                cancelledAt: new Date(),
                refundPercent: 0,
                refundAmount: 0,
              },
            },
            { new: true },
          )
        : null;
    if (reservation) {
      await this.entitlements.finalizeReservation(reservation._id, false);
      await this.releaseInventory(reservation);
      await this.notifications.notifyPaymentFailed({
        userId: reservation.userId,
        paymentId: failed._id,
        title: reservation.sessionTitle,
      });
    }
    await this.benefits.finalizePayment(
      String(failed.userId),
      failed.referenceId,
      false,
      failed.walletReservationKey,
    );
    if (failed.referenceType === "benefit_purchase") {
      await this.entitlements.finalizePurchase(failed.referenceId, false);
    }
    if (failed.referenceType === "business_class_enrollment") {
      const enrollment = await this.classPortal.finalizeEnrollmentPayment(
        failed.referenceId,
        false,
      );
      await this.notifications.notifyPaymentFailed({
        userId: failed.userId,
        paymentId: failed._id,
        title: enrollment.title,
      });
    }
    return paymentDto(failed);
  }

  private async releaseInventory(reservation: ReservationDocument) {
    const increments: Record<string, number> = {
      reservedCount: -reservation.participantCount,
    };
    reservation.selectedOptions.forEach((item, index) => {
      increments[`options.$[option${index}].reservedQuantity`] = -item.quantity;
    });
    await this.sessions.updateOne(
      { _id: reservation.sessionId },
      { $inc: increments },
      reservation.selectedOptions.length
        ? {
            arrayFilters: reservation.selectedOptions.map((item, index) => ({
              [`option${index}._id`]: item.optionId,
            })),
          }
        : {},
    );
  }

  private async postEntries(entries: Array<Omit<LedgerEntry, "createdAt">>) {
    const debit = entries
      .filter((entry) => entry.direction === "debit")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const credit = entries
      .filter((entry) => entry.direction === "credit")
      .reduce((sum, entry) => sum + entry.amount, 0);
    if (debit !== credit || debit <= 0) {
      throw new Error("Unbalanced ledger transaction");
    }
    try {
      await this.ledger.insertMany(entries, { ordered: true });
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }
  }
}

function paymentDto(intent: PaymentIntentDocument) {
  return {
    id: String(intent._id),
    provider: intent.provider,
    authority: intent.authority,
    referenceType: intent.referenceType,
    referenceId: String(intent.referenceId),
    amount: intent.amount,
    grossAmount: intent.grossAmount,
    discountAmount: intent.discountAmount,
    walletAmount: intent.walletAmount,
    platformFee: intent.platformFee,
    refundedAmount: intent.refundedAmount,
    refundedGatewayAmount: intent.refundedGatewayAmount ?? 0,
    refundedWalletAmount: intent.refundedWalletAmount ?? 0,
    refundedDiscountAmount: intent.refundedDiscountAmount ?? 0,
    status: intent.status,
    platformFundedDiscount: intent.platformFundedDiscount ?? 0,
    providerFundedDiscount: intent.providerFundedDiscount ?? 0,
    checkoutUrl: intent.checkoutUrl || `/payments/mock/${intent.authority}`,
    returnUrl: intent.returnUrl,
    paidAt: intent.paidAt?.toISOString() ?? null,
    reconciledAt: intent.reconciledAt?.toISOString() ?? null,
    createdAt: intent.createdAt.toISOString(),
  };
}

function oid(value: string) {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(400, "INVALID_OBJECT_ID", "Invalid id");
  }
  return new Types.ObjectId(value);
}

function isDuplicateKey(error: unknown): error is { code: 11000 } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}
