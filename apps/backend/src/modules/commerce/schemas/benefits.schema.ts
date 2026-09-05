import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ _id: false })
export class DiscountFundingShare {
  @Prop({ type: String, enum: ["platform", "provider"], required: true })
  source: "platform" | "provider";
  @Prop({ type: Number, required: true, min: 1, max: 100 })
  percentage: number;
}
const DiscountFundingShareSchema =
  SchemaFactory.createForClass(DiscountFundingShare);

@Schema({ collection: "wallet_accounts", timestamps: true })
export class WalletAccount {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true })
  userId: Types.ObjectId;
  @Prop({ type: Number, default: 0, min: 0 }) availableAmount: number;
  @Prop({ type: Number, default: 0, min: 0 }) reservedAmount: number;
  updatedAt: Date;
}
export type WalletAccountDocument = HydratedDocument<WalletAccount>;
export const WalletAccountSchema = SchemaFactory.createForClass(WalletAccount);

@Schema({ collection: "wallet_transactions", timestamps: true })
export class WalletTransaction {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;
  @Prop({
    type: String,
    enum: ["credit", "reserve", "consume", "release", "expire"],
    required: true,
  })
  type: "credit" | "reserve" | "consume" | "release" | "expire";
  @Prop({ type: Number, required: true, min: 1 }) amount: number;
  @Prop({
    type: String,
    enum: ["refund", "promotion", "referral", "admin", "payment"],
    required: true,
  })
  source: "refund" | "promotion" | "referral" | "admin" | "payment";
  @Prop({ type: String, required: true, unique: true }) idempotencyKey: string;
  @Prop({ type: Date, default: null }) expiresAt: Date | null;
  @Prop({ type: Date, default: null }) expirationProcessedAt: Date | null;
  @Prop({ type: String, default: "" }) note: string;
  createdAt: Date;
}
export type WalletTransactionDocument = HydratedDocument<WalletTransaction>;
export const WalletTransactionSchema =
  SchemaFactory.createForClass(WalletTransaction);

@Schema({ collection: "discount_campaigns", timestamps: true })
export class DiscountCampaign {
  @Prop({
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  code: string;
  @Prop({ type: String, required: true }) title: string;
  @Prop({ type: String, enum: ["percent", "fixed"], required: true }) kind:
    "percent" | "fixed";
  @Prop({ type: Number, required: true, min: 1 }) value: number;
  @Prop({ type: Number, default: null }) maxDiscount: number | null;
  @Prop({ type: Number, default: 0 }) minOrderAmount: number;
  @Prop({ type: Number, required: true, min: 1 }) budgetRemaining: number;
  @Prop({ type: Number, default: 1, min: 1 }) perUserLimit: number;
  @Prop({ type: Number, default: null, min: 1 }) usageLimit: number | null;
  @Prop({ type: Number, default: 0, min: 0 }) usageCount: number;
  @Prop({ type: [Types.ObjectId], default: [] }) clubIds: Types.ObjectId[];
  @Prop({
    type: String,
    enum: [
      "global",
      "club",
      "coach",
      "class",
      "sport",
      "product",
      "session_type",
    ],
    default: "global",
  })
  scopeType:
    | "global"
    | "club"
    | "coach"
    | "class"
    | "sport"
    | "product"
    | "session_type";
  @Prop({ type: [String], default: [] }) scopeIds: string[];
  @Prop({ type: [DiscountFundingShareSchema], default: [] })
  funding: DiscountFundingShare[];
  @Prop({ type: Boolean, default: false }) firstPurchaseOnly: boolean;
  @Prop({ type: Boolean, default: false }) referredOnly: boolean;
  @Prop({ type: [Types.ObjectId], default: [] })
  eligibleUserIds: Types.ObjectId[];
  @Prop({ type: Date, required: true }) startsAt: Date;
  @Prop({ type: Date, required: true }) endsAt: Date;
  @Prop({ type: Boolean, default: true }) isActive: boolean;
  createdAt: Date;
}
export type DiscountCampaignDocument = HydratedDocument<DiscountCampaign>;
export const DiscountCampaignSchema =
  SchemaFactory.createForClass(DiscountCampaign);

@Schema({ collection: "discount_redemptions", timestamps: true })
export class DiscountRedemption {
  @Prop({
    type: Types.ObjectId,
    ref: "DiscountCampaign",
    required: true,
    index: true,
  })
  campaignId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true }) referenceId: Types.ObjectId;
  @Prop({ type: Number, required: true }) amount: number;
  @Prop({ type: Number, default: 0, min: 0 }) platformFundedAmount: number;
  @Prop({ type: Number, default: 0, min: 0 }) providerFundedAmount: number;
  @Prop({
    type: String,
    enum: ["reservation", "benefit_purchase", "business_class_enrollment"],
    default: "reservation",
  })
  referenceType:
    "reservation" | "benefit_purchase" | "business_class_enrollment";
  @Prop({
    type: String,
    enum: ["reserved", "consumed", "released"],
    default: "reserved",
  })
  status: "reserved" | "consumed" | "released";
  @Prop({ type: Date, required: true }) expiresAt: Date;
}
export type DiscountRedemptionDocument = HydratedDocument<DiscountRedemption>;
export const DiscountRedemptionSchema =
  SchemaFactory.createForClass(DiscountRedemption);
DiscountRedemptionSchema.index(
  { campaignId: 1, userId: 1, referenceId: 1 },
  { unique: true },
);

@Schema({ collection: "referral_codes", timestamps: true })
export class ReferralCode {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true })
  userId: Types.ObjectId;
  @Prop({ type: String, required: true, unique: true, uppercase: true })
  code: string;
}
export type ReferralCodeDocument = HydratedDocument<ReferralCode>;
export const ReferralCodeSchema = SchemaFactory.createForClass(ReferralCode);

@Schema({ collection: "referrals", timestamps: true })
export class Referral {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  inviterId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true })
  inviteeId: Types.ObjectId;
  @Prop({
    type: String,
    enum: ["pending", "rewarded", "rejected"],
    default: "pending",
  })
  status: "pending" | "rewarded" | "rejected";
  @Prop({ type: Date, default: null }) rewardedAt: Date | null;
}
export type ReferralDocument = HydratedDocument<Referral>;
export const ReferralSchema = SchemaFactory.createForClass(Referral);
