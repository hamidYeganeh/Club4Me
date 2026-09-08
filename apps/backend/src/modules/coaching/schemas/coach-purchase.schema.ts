import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SchemaTypes, Types } from "mongoose";

@Schema({ collection: "coach_package_purchases", timestamps: true })
export class CoachPackagePurchase {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  athleteId: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true }) coachId: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  offeringId: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop({ required: true, enum: ["package", "per_month"] }) pricingType:
    "package" | "per_month";
  @Prop({ type: { amount: Number, currency: String }, required: true })
  priceSnapshot: { amount: number; currency: string };
  @Prop({ type: Number, default: null }) sessionCount: number | null;
  @Prop({ type: Number, default: 0 }) usedSessions: number;
  @Prop({ type: Number, default: null }) remainingSessions: number | null;
  @Prop({
    required: true,
    enum: ["pending", "active", "failed", "refunded"],
    default: "pending",
  })
  status: string;
  @Prop({ required: true, default: "pending" }) paymentStatus: string;
  @Prop({ required: true }) purchasedAt: Date;
  @Prop({ type: Date, default: null }) activatedAt: Date | null;
  @Prop({ type: Date, default: null }) expiresAt: Date | null;
  @Prop({ required: true }) paymentExpiresAt: Date;
  @Prop({ required: true }) idempotencyKey: string;
}
export const CoachPackagePurchaseSchema =
  SchemaFactory.createForClass(CoachPackagePurchase);
CoachPackagePurchaseSchema.index(
  { athleteId: 1, idempotencyKey: 1 },
  { unique: true },
);
CoachPackagePurchaseSchema.index({ athleteId: 1, offeringId: 1, status: 1 });
