import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "benefit_products", timestamps: true })
export class BenefitProduct {
  @Prop({ type: [Object], default: [] }) accessClubs: Array<{
    id: string;
    name: string;
  }>;
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({ required: true, trim: true, maxlength: 120 }) title: string;
  @Prop({ trim: true, maxlength: 1000, default: "" }) description: string;
  @Prop({
    type: String,
    enum: ["session_pack", "time_membership"],
    required: true,
  })
  type: "session_pack" | "time_membership";
  @Prop({ type: Number, required: true, min: 0 }) price: number;
  @Prop({ type: Number, default: null, min: 1, max: 1000 })
  sessionCount: number | null;
  @Prop({ type: Number, required: true, min: 1, max: 730 })
  validityDays: number;
  @Prop({ type: Number, default: 0, min: 0, max: 90 }) maxPauseDays: number;
  @Prop({
    type: String,
    enum: ["iso_utc", "iran_saturday"],
    default: "iso_utc",
  })
  weekCalendar: "iso_utc" | "iran_saturday";
  @Prop({ type: Number, default: null, min: 1, max: 50 })
  weeklyLimit: number | null;
  @Prop({
    type: [String],
    enum: ["court", "class", "coached_session"],
    default: [],
  })
  sessionTypes: Array<"court" | "class" | "coached_session">;
  @Prop({ type: String, enum: ["active", "inactive"], default: "active" })
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}
export type BenefitProductDocument = HydratedDocument<BenefitProduct>;
export const BenefitProductSchema =
  SchemaFactory.createForClass(BenefitProduct);
BenefitProductSchema.index({ clubId: 1, status: 1, createdAt: -1 });

@Schema({ collection: "benefit_purchases", timestamps: true })
export class BenefitPurchase {
  @Prop({ type: Types.ObjectId, ref: "BenefitProduct", required: true })
  productId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;
  @Prop({ type: Number, required: true, min: 1 }) amount: number;
  @Prop({ type: Object, default: null }) productSnapshot: BenefitProduct | null;
  @Prop({
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  })
  status: "pending" | "paid" | "failed" | "refunded";
  @Prop({ type: Types.ObjectId, ref: "UserEntitlement", default: null })
  entitlementId: Types.ObjectId | null;
  @Prop({ type: Types.ObjectId, ref: "UserEntitlement", default: null })
  renewedFromId: Types.ObjectId | null;
  @Prop({
    type: String,
    enum: ["immediate", "after_expiry"],
    default: "immediate",
  })
  startMode: "immediate" | "after_expiry";
  createdAt: Date;
  updatedAt: Date;
}
export type BenefitPurchaseDocument = HydratedDocument<BenefitPurchase>;
export const BenefitPurchaseSchema =
  SchemaFactory.createForClass(BenefitPurchase);

@Schema({ collection: "user_entitlements", timestamps: true })
export class UserEntitlement {
  @Prop({ type: [Object], default: [] }) accessClubs: Array<{
    id: string;
    name: string;
  }>;
  @Prop({ type: Types.ObjectId, ref: "BenefitProduct", required: true })
  productId: Types.ObjectId;
  @Prop({
    type: Types.ObjectId,
    ref: "BenefitPurchase",
    required: true,
    unique: true,
  })
  purchaseId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop({
    type: String,
    enum: ["session_pack", "time_membership"],
    required: true,
  })
  type: "session_pack" | "time_membership";
  @Prop({ type: Number, default: null, min: 0 }) remainingSessions:
    number | null;
  @Prop({ type: Number, default: null, min: 1 }) weeklyLimit: number | null;
  @Prop({
    type: String,
    enum: ["iso_utc", "iran_saturday"],
    default: "iso_utc",
  })
  weekCalendar: "iso_utc" | "iran_saturday";
  @Prop({ type: String, default: null }) usageWeekKey: string | null;
  @Prop({ type: Number, default: 0, min: 0 }) weeklyUsed: number;
  @Prop({ type: Map, of: Number, default: {} })
  weeklyReservations: Map<string, number>;
  @Prop({ type: [String], default: [] }) sessionTypes: string[];
  @Prop({ type: Date, required: true }) startsAt: Date;
  @Prop({ type: Date, required: true, index: true }) endsAt: Date;
  @Prop({ type: Number, default: 0 }) maxPauseDays: number;
  @Prop({ type: Number, default: 0 }) pauseUsedMs: number;
  @Prop({ type: Date, default: null }) pauseStartedAt: Date | null;
  @Prop({ type: Date, default: null }) pauseUntil: Date | null;
  @Prop({ type: Number, default: 0 }) renewalRevision: number;
  @Prop({ type: Date, default: null }) expiryRemindedFor: Date | null;
  @Prop({ type: Types.ObjectId, ref: "UserEntitlement", default: null })
  renewedFromId: Types.ObjectId | null;
  @Prop({ type: [Object], default: [] }) changes: Array<{
    action: "pause" | "resume" | "renewal";
    actorId: string;
    at: Date;
    beforeEndsAt: Date;
    afterEndsAt: Date;
    pauseUntil?: Date;
    purchaseId?: string;
  }>;
  @Prop({
    type: String,
    enum: ["active", "exhausted", "expired", "revoked"],
    default: "active",
  })
  status: "active" | "exhausted" | "expired" | "revoked";
  createdAt: Date;
  updatedAt: Date;
}
export type UserEntitlementDocument = HydratedDocument<UserEntitlement>;
export const UserEntitlementSchema =
  SchemaFactory.createForClass(UserEntitlement);
UserEntitlementSchema.index({ userId: 1, clubId: 1, status: 1, endsAt: 1 });

@Schema({ collection: "entitlement_usages", timestamps: true })
export class EntitlementUsage {
  @Prop({
    type: Types.ObjectId,
    ref: "UserEntitlement",
    required: true,
    index: true,
  })
  entitlementId: Types.ObjectId;
  @Prop({
    type: Types.ObjectId,
    ref: "Reservation",
    required: true,
    unique: true,
  })
  reservationId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;
  @Prop({ type: Date, required: true }) sessionStartsAt: Date;
  @Prop({
    type: String,
    enum: ["reserved", "consumed", "released"],
    default: "reserved",
  })
  status: "reserved" | "consumed" | "released";
  createdAt: Date;
  updatedAt: Date;
}
export type EntitlementUsageDocument = HydratedDocument<EntitlementUsage>;
export const EntitlementUsageSchema =
  SchemaFactory.createForClass(EntitlementUsage);
EntitlementUsageSchema.index({
  entitlementId: 1,
  sessionStartsAt: 1,
  status: 1,
});
