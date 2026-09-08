import { CoachPackagePurchase } from "../coaching/schemas/coach-purchase.schema";
import { allocateRefund } from "./refund-allocation";
import { paymentDeadline } from "./payment-deadline";
import {
  Atomic,
  inAtomicOperation,
  lockPaymentReference,
} from "../../infrastructure/database/atomic-operation";
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
  QuotePaymentDto,
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

import {
  CoachingPaymentReference,
  isCoachingReference,
} from "./coaching-payment-reference";

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
    try {
      return await this.createIntentAtomic(userId, input);
    } catch (error) {
      if (isDuplicateKey(error)) {
        const existing = await this.intents.findOne({
          userId: oid(userId),
          idempotencyKey: input.idempotencyKey,
        });
        if (existing) {
          if (
            existing.referenceType !== input.referenceType ||
            String(existing.referenceId) !== input.referenceId
          )
            throw new AppError(
              409,
              "IDEMPOTENCY_KEY_REUSED",
              "کلید پرداخت قبلاً برای سفارش دیگری استفاده شده است.",
            );
          return paymentDto(existing);
        }
      }
      throw error;
    }
  }

  private async paymentContext(
    userId: string,
    input: Pick<CreatePaymentIntentDto, "referenceType" | "referenceId">,
  ) {
    const reservation =
      input.referenceType === "reservation"
        ? await this.reservations.findOne({
            _id: oid(input.referenceId),
            userId: oid(userId),
            status: "reserved",
            paymentStatus: "pending",
            $or: [
              { paymentExpiresAt: null },
              { paymentExpiresAt: { $gt: new Date() } },
            ],
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
    const coaching = isCoachingReference(input.referenceType)
      ? await new CoachingPaymentReference(this.intents.db).payable(
          userId,
          input.referenceType,
          input.referenceId,
        )
      : null;
    if (!reservation && !purchase && !classEnrollment && !coaching) {
      throw new AppError(
        409,
        "REFERENCE_NOT_PAYABLE",
        "Reference is not payable",
      );
    }
    const grossAmount =
      reservation?.totalPrice ??
      purchase?.amount ??
      classEnrollment?.amount ??
      coaching!.amount;
    const currency =
      reservation?.currency ??
      classEnrollment?.currency ??
      coaching?.currency ??
      "IRR";
    if (currency !== "IRR")
      throw new AppError(
        409,
        "UNSUPPORTED_PAYMENT_CURRENCY",
        "قیمت این خدمت باید به ریال ثبت شود.",
      );
    const clubId =
      reservation?.clubId ??
      purchase?.clubId ??
      classEnrollment?.clubId ??
      coaching?.clubId;
    const referenceId =
      reservation?._id ??
      purchase?._id ??
      classEnrollment?.referenceId ??
      coaching!.referenceId;
    const description =
      reservation?.sessionTitle ??
      (purchase ? `خرید مزایا ${String(purchase._id)}` : undefined) ??
      classEnrollment?.title ??
      coaching!.title;
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

    const discountContext = {
      referenceType: input.referenceType,
      referenceId,
      grossAmount,
      scopeValues: {
        club: clubId ? [String(clubId)] : [],
        coach: [
          ...(coaching ? [String(coaching.coachId)] : []),
          ...(session?.coachId ? [String(session.coachId)] : []),
          ...(classEnrollment?.coachId
            ? [String(classEnrollment.coachId)]
            : []),
        ],
        class: [
          ...(coaching?.classId ? [String(coaching.classId)] : []),
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
    };
    return {
      reservation,
      purchase,
      classEnrollment,
      coaching,
      grossAmount,
      clubId,
      referenceId,
      description,
      session,
      discountContext,
    };
  }

  @Atomic("intents")
  private async createIntentAtomic(
    userId: string,
    input: CreatePaymentIntentDto,
  ) {
    await lockPaymentReference(
      this.intents.db,
      input.referenceType,
      input.referenceId,
    );
    const existing = await this.intents.findOne({
      userId: oid(userId),
      idempotencyKey: input.idempotencyKey,
    });
    if (existing) {
      if (
        existing.referenceType !== input.referenceType ||
        String(existing.referenceId) !== input.referenceId
      )
        throw new AppError(
          409,
          "IDEMPOTENCY_KEY_REUSED",
          "کلید پرداخت برای سفارش دیگری استفاده شده است.",
        );
      return paymentDto(existing);
    }

    const {
      reservation,
      purchase,
      classEnrollment,
      coaching,
      grossAmount,
      clubId,
      referenceId,
      description,
      session,
      discountContext,
    } = await this.paymentContext(userId, input);
    const pending = await this.intents.findOne({
      userId: oid(userId),
      referenceType: input.referenceType,
      referenceId: oid(input.referenceId),
      status: "pending",
      ...(coaching || classEnrollment
        ? {
            createdAt: {
              $gte:
                coaching?.generationStartedAt ??
                classEnrollment!.generationStartedAt,
            },
          }
        : {}),
    });
    if (pending) {
      if (
        input.expectedAmount !== undefined &&
        input.expectedAmount !== pending.amount
      )
        throw new AppError(
          409,
          "PAYMENT_PRICE_CHANGED",
          "مبلغ پرداخت باز را دوباره بررسی کنید.",
        );
      return paymentDto(pending);
    }

    const walletReservationKey = `payment-wallet-${userId}-${input.idempotencyKey}`;
    try {
      const discount = input.couponCode
        ? await this.benefits.reserveDiscount(
            userId,
            input.couponCode,
            discountContext,
          )
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
      if (input.expectedAmount !== undefined && input.expectedAmount !== amount)
        throw new AppError(
          409,
          "PAYMENT_PRICE_CHANGED",
          "مبلغ تغییر کرده است؛ قیمت جدید را دوباره تأیید کنید.",
        );
      const providerPayment = await this.mockProvider.createPayment({
        amount,
        callbackUrl: input.returnUrl,
        description: `Club4Me - ${description}`.slice(0, 250),
      });
      const intent = await this.intents.create({
        userId: oid(userId),
        clubId,
        providerId: coaching?.coachId ?? clubId,
        providerType: coaching ? "coach" : "club",
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
        expiresAt:
          reservation?.paymentExpiresAt ??
          paymentDeadline(coaching?.expiresAt ?? classEnrollment?.expiresAt),
      });
      return paymentDto(intent);
    } catch (error) {
      if (inAtomicOperation()) throw error;
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

  async quotePayment(userId: string, input: QuotePaymentDto) {
    const context = await this.paymentContext(userId, input);
    const generation =
      context.coaching?.generationStartedAt ??
      context.classEnrollment?.generationStartedAt;
    const pending = await this.intents.findOne({
      userId: oid(userId),
      referenceType: input.referenceType,
      referenceId: oid(input.referenceId),
      status: "pending",
      ...(generation ? { createdAt: { $gte: generation } } : {}),
    });
    if (pending)
      return {
        referenceType: pending.referenceType,
        referenceId: String(pending.referenceId),
        currency: "IRR" as const,
        grossAmount: pending.grossAmount,
        discountAmount: pending.discountAmount,
        walletAmount: pending.walletAmount,
        amount: pending.amount,
        expiresAt: pending.expiresAt?.toISOString() ?? null,
        intentId: String(pending._id),
        priceBreakdown: context.reservation?.priceBreakdown ?? null,
      };
    const discount = input.couponCode
      ? await this.benefits.quoteDiscountForContext(
          userId,
          input.couponCode,
          context.discountContext,
        )
      : null;
    const discountAmount = discount?.amount ?? 0;
    const walletAmount = Math.min(
      input.walletAmount ?? 0,
      context.grossAmount - discountAmount - 1,
    );
    if (
      walletAmount > 0 &&
      walletAmount > (await this.benefits.wallet(userId)).availableAmount
    )
      throw new AppError(
        409,
        "INSUFFICIENT_WALLET_BALANCE",
        "موجودی کیف پول کافی نیست.",
      );
    return {
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      currency: "IRR" as const,
      grossAmount: context.grossAmount,
      discountAmount,
      walletAmount,
      amount: context.grossAmount - discountAmount - walletAmount,
      expiresAt: paymentDeadline(
        context.reservation?.paymentExpiresAt ??
          context.coaching?.expiresAt ??
          context.classEnrollment?.expiresAt,
      ).toISOString(),
      intentId: null,
      priceBreakdown: context.reservation?.priceBreakdown ?? null,
    };
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
    try {
      return await this.processCallbackAtomic(payload, signature);
    } catch (error) {
      if (error instanceof AppError && error.code === "PAYMENT_EXPIRED") {
        const expired = await this.intents.findOne({
          _id: oid(payload.intentId),
          authority: payload.authority,
          amount: payload.amount,
          status: "pending",
          expiresAt: { $lte: new Date() },
        });
        if (expired) await this.fail(expired);
      }
      throw error;
    }
  }

  @Atomic("intents")
  private async processCallbackAtomic(
    payload: MockPaymentCallbackDto,
    signature?: string,
  ) {
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
      if (inAtomicOperation() || !isDuplicateKey(error)) throw error;
    }
    return result;
  }

  @Atomic("intents")
  async refund(intentId: string, input: RefundPaymentDto) {
    const refundKey = `${intentId}:${input.idempotencyKey}`;
    const priorEntries = await this.ledger.find({
      sourceType: "refund",
      sourceId: oid(intentId),
      idempotencyKey: { $in: [input.idempotencyKey, refundKey] },
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
    if (intent.referenceType === "coach_package_purchase") {
      const purchase = await this.intents.db
        .model<CoachPackagePurchase>(CoachPackagePurchase.name)
        .findById(intent.referenceId);
      if (
        !purchase ||
        purchase.status !== "active" ||
        purchase.usedSessions > 0 ||
        grossRefund !== remainingGross
      )
        throw new AppError(
          409,
          "PACKAGE_NOT_REFUNDABLE",
          "فقط بازپرداخت کامل بسته مصرف‌نشده مجاز است.",
        );
    }
    const {
      gatewayRefund,
      walletRefund,
      discountReversal,
      platformDiscountReversal,
      providerDiscountReversal,
      feeReversal,
      providerReversal,
      refundedPlatformFee,
    } = allocateRefund(intent, grossRefund);

    if (providerReversal > 0) {
      const account = await this.settlementAccounts.findOneAndUpdate(
        {
          providerId: intent.providerId ?? intent.clubId,
        },
        { $inc: { availableAmount: -providerReversal } },
        { new: true },
      );
      if (!account) {
        throw new AppError(
          409,
          "PROVIDER_ACCOUNT_NOT_FOUND",
          "حساب مالی ارائه‌دهنده پیدا نشد.",
        );
      }
    }
    const transactionId = randomUUID();
    await this.postEntries([
      {
        transactionId,
        account: "provider_payable",
        ownerId: intent.providerId ?? intent.clubId,
        direction: "debit",
        amount: providerReversal,
        sourceType: "refund",
        sourceId: intent._id,
        idempotencyKey: refundKey,
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
              idempotencyKey: refundKey,
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
              idempotencyKey: refundKey,
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
              idempotencyKey: refundKey,
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
              idempotencyKey: refundKey,
            },
          ]
        : []),
    ]);
    await this.benefits.refundWallet(
      String(intent.userId),
      walletRefund,
      intent._id,
      refundKey,
    );
    intent.refundedAmount += grossRefund;
    intent.refundedPlatformFee = refundedPlatformFee;
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
      await this.classPortal.refundEnrollmentPayment(
        intent.referenceId,
        intent.createdAt,
      );
    }
    if (isCoachingReference(intent.referenceType))
      await new CoachingPaymentReference(this.intents.db).refund(
        intent.referenceType,
        intent.referenceId,
        intent.refundedAmount,
        intent.status === "refunded",
        intent.createdAt,
      );
    return paymentDto(intent);
  }

  async refundCoaching(
    referenceType: "coach_booking" | "coach_class_enrollment",
    referenceId: Types.ObjectId,
    amount: number,
  ) {
    if (amount <= 0) return null;
    const intent = await this.intents
      .findOne({
        referenceType,
        referenceId,
        status: { $in: ["paid", "partially_refunded", "refunded"] },
      })
      .sort({ createdAt: -1 });
    // Older simulated purchases did not create a ledger entry.
    if (!intent) return null;
    return this.refund(String(intent._id), {
      amount,
      reason: "لغو خدمت مربی",
      idempotencyKey: `coach-cancel-${referenceId}`,
    });
  }

  async refundBusinessClass(referenceId: Types.ObjectId, amount: number) {
    const intent = await this.intents
      .findOne({
        referenceType: "business_class_enrollment",
        referenceId,
        status: { $in: ["paid", "partially_refunded", "refunded"] },
      })
      .sort({ createdAt: -1 });
    if (!intent)
      throw new AppError(
        409,
        "PAID_INTENT_NOT_FOUND",
        "سابقه پرداخت برای بازپرداخت پیدا نشد.",
      );
    return this.refund(String(intent._id), {
      amount,
      reason: "لغو کلاس باشگاه",
      idempotencyKey: `class-cancel-${referenceId}`,
    });
  }

  async quoteReservationRefund(reservationId: Types.ObjectId, amount: number) {
    if (amount === 0) return { gatewayRefund: 0, walletRefund: 0 };
    const intent = await this.intents
      .findOne({
        referenceType: "reservation",
        referenceId: reservationId,
        status: { $in: ["paid", "partially_refunded"] },
      })
      .sort({ createdAt: -1 });
    if (!intent)
      throw new AppError(
        409,
        "PAID_INTENT_NOT_FOUND",
        "سابقه مالی رزرو برای محاسبه بازپرداخت پیدا نشد.",
      );
    return allocateRefund(intent, amount);
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
    if (
      intent.status === "pending" &&
      intent.expiresAt &&
      intent.expiresAt <= new Date()
    ) {
      await this.fail(intent);
      throw new AppError(
        409,
        "PAYMENT_EXPIRED",
        "مهلت پرداخت تمام شده است؛ دوباره رزرو کنید.",
      );
    }
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
        idempotencyKey: `payment-${paid._id}`,
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
              idempotencyKey: `payment-${paid._id}`,
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
              idempotencyKey: `payment-${paid._id}`,
            },
          ]
        : []),
      ...(paid.grossAmount - paid.platformFee - paid.providerFundedDiscount > 0
        ? [
            {
              transactionId,
              account: "provider_payable" as const,
              ownerId: paid.providerId ?? paid.clubId,
              direction: "credit" as const,
              amount:
                paid.grossAmount -
                paid.platformFee -
                paid.providerFundedDiscount,
              sourceType: "payment" as const,
              sourceId: paid._id,
              idempotencyKey: `payment-${paid._id}`,
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
              idempotencyKey: `payment-${paid._id}`,
            },
          ]
        : []),
    ]);
    await this.settlementAccounts.updateOne(
      { providerId: paid.providerId ?? paid.clubId },
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
    if (paid.referenceType === "reservation" && !reservation)
      throw new AppError(
        409,
        "REFERENCE_STATUS_CHANGED",
        "وضعیت رزرو تغییر کرده است.",
      );
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
        paid.createdAt,
      );
      await this.notifications.notifyBookingConfirmed({
        userId: paid.userId,
        bookingId: paid.referenceId,
        title: enrollment.title,
        href: `/discovery/business-class?classId=${enrollment.classId}`,
      });
    }
    if (isCoachingReference(paid.referenceType)) {
      const reference = await new CoachingPaymentReference(
        this.intents.db,
      ).finalize(
        paid.referenceType,
        paid.referenceId,
        true,
        paid._id,
        paid.createdAt,
      );
      if (!reference)
        throw new AppError(
          409,
          "REFERENCE_GENERATION_CHANGED",
          "وضعیت سفارش تغییر کرده است.",
        );
      await this.notifications.notifyBookingConfirmed({
        userId: reference.userId,
        bookingId: reference.referenceId,
        title: reference.title,
        href: reference.href,
      });
    }
    await this.benefits.settleReferral(String(paid.userId));
    return paymentDto(paid);
  }

  @Atomic("intents")
  private async fail(intent: PaymentIntentDocument) {
    if (intent.status === "failed" && intent.failureFinalizedAt)
      return paymentDto(intent);
    const failed =
      intent.status === "failed"
        ? intent
        : await this.intents.findOneAndUpdate(
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
    let reservation =
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
                cancellationReason: "payment_failed",
                cancelledAt: new Date(),
                refundPercent: 0,
                refundAmount: 0,
              },
            },
            { new: true },
          )
        : null;
    if (!reservation && failed.referenceType === "reservation") {
      reservation = await this.reservations.findOne({
        _id: failed.referenceId,
        status: "cancelled",
        cancellationReason: "payment_failed",
      });
    }
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
        failed.createdAt,
      );
      await this.notifications.notifyPaymentFailed({
        userId: failed.userId,
        paymentId: failed._id,
        title: enrollment.title,
      });
    }
    if (isCoachingReference(failed.referenceType)) {
      const reference = await new CoachingPaymentReference(
        this.intents.db,
      ).finalize(
        failed.referenceType,
        failed.referenceId,
        false,
        failed._id,
        failed.createdAt,
      );
      if (reference)
        await this.notifications.notifyPaymentFailed({
          userId: reference.userId,
          paymentId: failed._id,
          title: reference.title,
          href: reference.href,
        });
    }
    await this.intents.updateOne(
      { _id: failed._id, status: "failed" },
      { $set: { failureFinalizedAt: new Date() } },
    );
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
      {
        _id: reservation.sessionId,
        status: "active",
        releasedReservationIds: { $ne: reservation._id },
      },
      {
        $inc: increments,
        $addToSet: { releasedReservationIds: reservation._id },
      },
      reservation.selectedOptions.length
        ? {
            arrayFilters: reservation.selectedOptions.map((item, index) => ({
              [`option${index}._id`]: item.optionId,
            })),
          }
        : {},
    );
  }

  /** Retries failure cleanup; capacity release is idempotent on the session document. */
  async expirePendingPayments(now = new Date()) {
    const intents = await this.intents
      .find({
        $or: [
          {
            provider: "mock",
            status: "pending",
            expiresAt: { $lte: now, $ne: null },
          },
          {
            status: "failed",
            failureFinalizedAt: null,
            expiresAt: { $ne: null },
          },
        ],
      })
      .limit(100);
    const errors: string[] = [];
    let expired = 0;
    for (const intent of intents) {
      try {
        await this.fail(intent);
        expired++;
      } catch {
        errors.push(String(intent._id));
      }
    }
    const abandoned = await this.reservations
      .find({
        paymentExpiresAt: { $lte: now, $ne: null },
        $or: [
          { status: "reserved", paymentStatus: "pending" },
          {
            status: "cancelled",
            cancellationReason: "payment_expired",
            inventoryReleasedAt: null,
          },
        ],
      })
      .limit(100);
    for (const item of abandoned) {
      try {
        if (await this.expireReservationHold(item._id, now)) expired++;
      } catch {
        errors.push(String(item._id));
      }
    }
    for (const [type, modelName] of [
      ["coach_booking", "SessionBooking"],
      ["coach_class_enrollment", "ClassEnrollment"],
      ["coach_package_purchase", "CoachPackagePurchase"],
    ] as const) {
      const holds = await this.intents.db
        .model(modelName)
        .find({
          status: "pending",
          paymentStatus: "pending",
          paymentExpiresAt: { $lte: now, $ne: null },
        })
        .limit(100);
      for (const hold of holds) {
        try {
          if (await this.expireCoachingHold(type, hold._id, now)) expired++;
        } catch {
          errors.push(String(hold._id));
        }
      }
    }
    const classes = await this.classPortal.expirePaymentHolds(now);
    return {
      expired: expired + classes.expired,
      errors: [...errors, ...classes.errors],
    };
  }

  @Atomic("intents")
  private async expireReservationHold(id: Types.ObjectId, now: Date) {
    const item = await this.reservations.findOne({
      _id: id,
      paymentExpiresAt: { $lte: now, $ne: null },
      $or: [
        { status: "reserved", paymentStatus: "pending" },
        {
          status: "cancelled",
          cancellationReason: "payment_expired",
          inventoryReleasedAt: null,
        },
      ],
    });
    if (!item) return false;
    if (
      await this.intents.exists({
        referenceType: "reservation",
        referenceId: item._id,
        status: { $in: ["pending", "paid", "partially_refunded"] },
      })
    )
      return false;
    const cancelled =
      item.status === "cancelled"
        ? item
        : await this.reservations.findOneAndUpdate(
            { _id: item._id, status: "reserved", paymentStatus: "pending" },
            {
              $set: {
                status: "cancelled",
                paymentStatus: "failed",
                cancelledAt: now,
                cancellationReason: "payment_expired",
                refundAmount: 0,
                refundPercent: 0,
              },
            },
            { new: true },
          );
    if (!cancelled) return false;
    await this.entitlements.finalizeReservation(cancelled._id, false);
    await this.releaseInventory(cancelled);
    await this.reservations.updateOne(
      { _id: cancelled._id },
      { $set: { inventoryReleasedAt: new Date() } },
    );
    return true;
  }

  @Atomic("intents")
  private async expireCoachingHold(
    type: "coach_booking" | "coach_class_enrollment" | "coach_package_purchase",
    id: Types.ObjectId,
    now: Date,
  ) {
    return new CoachingPaymentReference(this.intents.db).expire(type, id, now);
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
      if (inAtomicOperation() || !isDuplicateKey(error)) throw error;
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
    expiresAt: intent.expiresAt?.toISOString() ?? null,
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
