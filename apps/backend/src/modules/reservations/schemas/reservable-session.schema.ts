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
  @Prop({ required: true, trim: true })
  title: string;
  @Prop({ type: [SessionCancellationTier], required: true })
  tiers: SessionCancellationTier[];
}

@Schema({ collection: "reservable_sessions", timestamps: true })
export class ReservableSession {
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Court" })
  courtId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User" })
  coachId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Class" })
  classId?: Types.ObjectId;
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
