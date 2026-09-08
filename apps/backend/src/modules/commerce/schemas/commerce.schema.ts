import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "payment_intents", timestamps: true })
export class PaymentIntent {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Club", index: true })
  clubId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, index: true }) providerId?: Types.ObjectId;
  @Prop({ type: String, enum: ["club", "coach"], default: "club" })
  providerType: "club" | "coach";
  @Prop({
    type: String,
    enum: [
      "reservation",
      "benefit_purchase",
      "business_class_enrollment",
      "coach_booking",
      "coach_class_enrollment",
      "coach_package_purchase",
    ],
    required: true,
  })
  referenceType:
    | "reservation"
    | "benefit_purchase"
    | "business_class_enrollment"
    | "coach_booking"
    | "coach_class_enrollment"
    | "coach_package_purchase";
  @Prop({ type: Types.ObjectId, required: true, index: true })
  referenceId: Types.ObjectId;
  @Prop({ type: Number, required: true, min: 1 }) amount: number;
  @Prop({ type: Number, required: true, min: 1 }) grossAmount: number;
  @Prop({ type: Number, default: 0, min: 0 }) discountAmount: number;
  @Prop({ type: Number, default: 0, min: 0 }) walletAmount: number;
  @Prop({ type: Number, required: true, min: 0 }) platformFee: number;
  @Prop({ type: String, enum: ["mock"], default: "mock", required: true })
  provider: "mock";
  @Prop({ type: String, required: true, unique: true }) authority: string;
  @Prop({ type: String, default: "" }) checkoutUrl: string;
  @Prop({ type: String, default: null }) providerReference: string | null;
  @Prop({ type: String, required: true }) idempotencyKey: string;
  @Prop({ type: String, default: "" }) walletReservationKey: string;
  @Prop({ type: String, required: true }) returnUrl: string;
  @Prop({
    type: String,
    enum: ["pending", "paid", "failed", "partially_refunded", "refunded"],
    default: "pending",
    index: true,
  })
  status: "pending" | "paid" | "failed" | "partially_refunded" | "refunded";
  @Prop({ type: Number, default: 0, min: 0 }) refundedAmount: number;
  @Prop({ type: Number, default: null, min: 0 }) refundedPlatformFee:
    number | null;
  @Prop({ type: Number, default: 0, min: 0 }) refundedGatewayAmount: number;
  @Prop({ type: Number, default: 0, min: 0 }) refundedWalletAmount: number;
  @Prop({ type: Number, default: 0, min: 0 }) refundedDiscountAmount: number;
  @Prop({ type: Number, default: 0, min: 0 }) platformFundedDiscount: number;
  @Prop({ type: Number, default: 0, min: 0 }) providerFundedDiscount: number;
  @Prop({ type: Number, default: 0, min: 0 })
  refundedPlatformFundedDiscount: number;
  @Prop({ type: Number, default: 0, min: 0 })
  refundedProviderFundedDiscount: number;
  @Prop({ type: Types.ObjectId, ref: "DiscountCampaign", default: null })
  discountCampaignId: Types.ObjectId | null;
  @Prop({ type: String, default: null }) providerRefundId: string | null;
  @Prop({ type: Date, default: null }) expiresAt: Date | null;
  @Prop({ type: Date, default: null }) failureFinalizedAt: Date | null;
  @Prop({ type: Date, default: null }) paidAt: Date | null;
  @Prop({ type: Date, default: null }) failedAt: Date | null;
  @Prop({ type: Date, default: null }) reconciledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export type PaymentIntentDocument = HydratedDocument<PaymentIntent>;
export const PaymentIntentSchema = SchemaFactory.createForClass(PaymentIntent);
PaymentIntentSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
PaymentIntentSchema.index({ status: 1, expiresAt: 1 });
PaymentIntentSchema.index({ referenceType: 1, referenceId: 1, createdAt: -1 });

@Schema({ collection: "payment_callback_events", timestamps: true })
export class PaymentCallbackEvent {
  @Prop({ type: String, enum: ["mock"], required: true })
  provider: "mock";
  @Prop({ type: String, required: true }) eventId: string;
  @Prop({ type: Types.ObjectId, ref: "PaymentIntent", required: true })
  intentId: Types.ObjectId;
  @Prop({ type: String, required: true }) payloadHash: string;
  @Prop({ type: Date, required: true }) processedAt: Date;
}
export type PaymentCallbackEventDocument =
  HydratedDocument<PaymentCallbackEvent>;
export const PaymentCallbackEventSchema =
  SchemaFactory.createForClass(PaymentCallbackEvent);
PaymentCallbackEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

@Schema({ collection: "ledger_entries", timestamps: true })
export class LedgerEntry {
  @Prop({ type: String, required: true, index: true }) transactionId: string;
  @Prop({
    type: String,
    enum: [
      "platform_cash",
      "platform_revenue",
      "provider_payable",
      "wallet_liability",
      "promotion_expense",
    ],
    required: true,
    index: true,
  })
  account:
    | "platform_cash"
    | "platform_revenue"
    | "provider_payable"
    | "wallet_liability"
    | "promotion_expense";
  @Prop({ type: Types.ObjectId, default: null, index: true })
  ownerId: Types.ObjectId | null;
  @Prop({ type: String, enum: ["debit", "credit"], required: true })
  direction: "debit" | "credit";
  @Prop({ type: Number, required: true, min: 1 }) amount: number;
  @Prop({ type: String, enum: ["payment", "refund", "payout"], required: true })
  sourceType: "payment" | "refund" | "payout";
  @Prop({ type: Types.ObjectId, required: true, index: true })
  sourceId: Types.ObjectId;
  @Prop({ type: String, required: true }) idempotencyKey: string;
  createdAt: Date;
}
export type LedgerEntryDocument = HydratedDocument<LedgerEntry>;
export const LedgerEntrySchema = SchemaFactory.createForClass(LedgerEntry);
LedgerEntrySchema.index({ transactionId: 1, account: 1, direction: 1 });
LedgerEntrySchema.index(
  { sourceType: 1, idempotencyKey: 1, account: 1, direction: 1 },
  { unique: true },
);

@Schema({ collection: "payout_requests", timestamps: true })
export class PayoutRequest {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  requestedBy: Types.ObjectId;
  @Prop({ type: String, enum: ["club", "coach"], required: true })
  providerType: "club" | "coach";
  @Prop({ type: Types.ObjectId, required: true, index: true })
  providerId: Types.ObjectId;
  @Prop({ type: Number, required: true, min: 1 }) amount: number;
  @Prop({ type: String, required: true }) iban: string;
  @Prop({
    type: String,
    enum: ["requested", "under_review", "paid", "rejected", "cancelled"],
    default: "requested",
    index: true,
  })
  status: "requested" | "under_review" | "paid" | "rejected" | "cancelled";
  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  reviewedBy: Types.ObjectId | null;
  @Prop({ type: String, default: "" }) reviewNote: string;
  @Prop({ type: String, default: null }) bankReference: string | null;
  @Prop({ type: Date, default: null }) reviewedAt: Date | null;
  @Prop({ type: Date, default: null }) paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export type PayoutRequestDocument = HydratedDocument<PayoutRequest>;
export const PayoutRequestSchema = SchemaFactory.createForClass(PayoutRequest);
PayoutRequestSchema.index({ providerId: 1, status: 1, createdAt: -1 });

@Schema({ collection: "settlement_accounts", timestamps: true })
export class SettlementAccount {
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  providerId: Types.ObjectId;
  // A refund after payout creates debt; future proceeds offset this signed balance.
  @Prop({ type: Number, default: 0 }) availableAmount: number;
  @Prop({ type: Number, default: 0, min: 0 }) reservedAmount: number;
  updatedAt: Date;
}
export type SettlementAccountDocument = HydratedDocument<SettlementAccount>;
export const SettlementAccountSchema =
  SchemaFactory.createForClass(SettlementAccount);
