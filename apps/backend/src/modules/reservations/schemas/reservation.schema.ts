import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { SessionCancellationPolicy } from "./reservable-session.schema";

@Schema({ _id: false })
export class ReservedOption {
  @Prop({ type: Types.ObjectId, required: true }) optionId: Types.ObjectId;
  @Prop({ type: String, enum: ["equipment", "amenity"], required: true }) type:
    "equipment" | "amenity";
  @Prop({ type: Types.ObjectId, required: true }) resourceId: Types.ObjectId;
  @Prop({ type: Number, required: true, min: 1 }) quantity: number;
  @Prop({ type: Number, required: true, min: 0 }) unitPrice: number;
}

@Schema({ collection: "session_reservations", timestamps: true })
export class Reservation {
  @Prop({ type: Boolean, default: false }) isTrial: boolean;
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({
    type: Types.ObjectId,
    ref: "ReservableSession",
    required: true,
    index: true,
  })
  sessionId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;
  @Prop({
    type: String,
    enum: ["court", "class", "coached_session"],
    required: true,
  })
  sessionType: "court" | "class" | "coached_session";
  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  sessionTitle: string;
  @Prop({ type: Date, required: true }) sessionStartsAt: Date;
  @Prop({ type: Date, required: true }) sessionEndsAt: Date;
  @Prop({ type: Number, required: true, min: 1 }) participantCount: number;
  @Prop({ type: [ReservedOption], default: [] })
  selectedOptions: ReservedOption[];
  @Prop({ type: Number, required: true, min: 0 }) totalPrice: number;
  @Prop({ type: Types.ObjectId, ref: "UserEntitlement", default: null })
  entitlementId: Types.ObjectId | null;
  @Prop({ type: Number, default: 0, min: 0 }) entitlementCoveredAmount: number;
  @Prop({
    type: String,
    enum: ["not_required", "pending", "paid", "failed", "refunded"],
    default: "not_required",
  })
  paymentStatus: "not_required" | "pending" | "paid" | "failed" | "refunded";
  @Prop({ type: SessionCancellationPolicy, required: true })
  cancellationPolicy: SessionCancellationPolicy;
  @Prop({ type: Number, default: null }) refundPercent: number | null;
  @Prop({ type: Number, default: null }) refundAmount: number | null;
  @Prop({
    type: String,
    enum: ["reserved", "cancelled", "completed", "no_show"],
    default: "reserved",
  })
  status: "reserved" | "cancelled" | "completed" | "no_show";
  @Prop({ type: Date, default: null }) cancelledAt: Date | null;
  @Prop({ type: Date, default: null }) reminder24hSentAt: Date | null;
  @Prop({ type: Date, default: null }) reminder2hSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export type ReservationDocument = HydratedDocument<Reservation>;
export const ReservationSchema = SchemaFactory.createForClass(Reservation);
ReservationSchema.index(
  { sessionId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { status: "reserved" } },
);
// A cancelled trial releases eligibility; attendance and no-shows consume it.
// The unique index, not a preflight read, protects simultaneous requests.
ReservationSchema.index(
  { clubId: 1, userId: 1, isTrial: 1 },
  {
    name: "one_trial_per_club_user",
    unique: true,
    partialFilterExpression: {
      isTrial: true,
      status: { $in: ["reserved", "completed", "no_show"] },
    },
  },
);
