import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema()
export class SessionOption {
  _id: Types.ObjectId;

  @Prop({ type: String, enum: ["equipment", "amenity"], required: true })
  type: "equipment" | "amenity";
  @Prop({ type: Types.ObjectId, required: true })
  resourceId: Types.ObjectId;
  @Prop({ trim: true, maxlength: 120 })
  title?: string;
  @Prop({ type: Number, required: true, min: 1 })
  availableQuantity: number;
  @Prop({ type: Number, default: 0, min: 0 })
  reservedQuantity: number;
  @Prop({ type: Number, required: true, min: 1 })
  maxPerReservation: number;
  @Prop({ type: Number, required: true, min: 0 })
  unitPrice: number;
}

@Schema({ _id: false })
export class SessionCancellationTier {
  @Prop({ type: Number, required: true, min: 0 })
  hoursBefore: number;
  @Prop({ type: Number, required: true, min: 0, max: 100 })
  refundPercent: number;
}

@Schema({ _id: false })
export class SessionCancellationPolicy {
  @Prop({ type: Types.ObjectId }) policyId?: Types.ObjectId;
  @Prop({ required: true, trim: true })
  title: string;
  @Prop({ type: Number, min: 1, default: 1 }) version: number;
  @Prop({ type: [SessionCancellationTier], required: true })
  tiers: SessionCancellationTier[];
  @Prop({ type: Number, min: 0, default: 0 }) reservationCutoffMinutes: number;
  @Prop({ type: Number, min: 0, default: 0 }) rescheduleCutoffMinutes: number;
  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  noShowRefundPercent: number;
  @Prop({ type: Number, min: 0, max: 100, default: 100 })
  ownerCancellationRefundPercent: number;
}

@Schema({ collection: "reservable_sessions", timestamps: true })
export class ReservableSession {
  @Prop({ type: [Types.ObjectId], default: [] })
  releasedReservationIds: Types.ObjectId[];
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Court" })
  courtId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Coach" })
  coachId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "TrainingClass" })
  classId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "TrainingSession" })
  classSessionId?: Types.ObjectId;
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 120 })
  title: string;
  @Prop({ type: Date, required: true })
  startsAt: Date;
  @Prop({ type: Date, required: true })
  endsAt: Date;
  @Prop({ type: Number, required: true, min: 1, max: 1000 })
  capacity: number;
  @Prop({ type: Number, default: 0, min: 0 })
  reservedCount: number;
  @Prop({ type: Number, required: true, min: 0 })
  basePrice: number;
  @Prop({ type: String, trim: true, uppercase: true, default: "IRR" })
  currency: string;
  @Prop({
    type: String,
    enum: ["per_participant", "per_session", "per_court"],
    default: "per_participant",
  })
  pricingUnit: "per_participant" | "per_session" | "per_court";
  @Prop({ type: [SessionOption], default: [] })
  options: SessionOption[];
  @Prop({ type: SessionCancellationPolicy, required: true })
  cancellationPolicy: SessionCancellationPolicy;
  @Prop({
    type: String,
    enum: ["active", "cancelled", "completed"],
    default: "active",
  })
  status: "active" | "cancelled" | "completed";
  createdAt: Date;
  updatedAt: Date;
}
export type ReservableSessionDocument = HydratedDocument<ReservableSession>;
export const ReservableSessionSchema =
  SchemaFactory.createForClass(ReservableSession);
ReservableSessionSchema.index({ clubId: 1, startsAt: 1 });
ReservableSessionSchema.index({ status: 1, startsAt: 1 });
ReservableSessionSchema.index(
  { classSessionId: 1 },
  { unique: true, sparse: true },
);
