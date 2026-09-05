import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "club_manual_payments", timestamps: true })
export class ClubManualPayment {
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({
    type: Types.ObjectId,
    ref: "ClubStudent",
    required: true,
    index: true,
  })
  studentId: Types.ObjectId;
  @Prop({ type: String, enum: ["tuition", "session", "other"], required: true })
  type: "tuition" | "session" | "other";
  @Prop({ required: true, trim: true, maxlength: 120 }) title: string;
  @Prop({ type: Number, required: true, min: 0 }) amount: number;
  @Prop({ required: true, trim: true, maxlength: 8, default: "IRR" })
  currency: string;
  @Prop({ type: Date, required: true }) paidAt: Date;
  @Prop({
    type: String,
    enum: ["cash", "card", "transfer", "other"],
    default: "card",
  })
  method: "cash" | "card" | "transfer" | "other";
  @Prop({ trim: true, maxlength: 500, default: "" }) notes: string;
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ClubManualPaymentDocument = HydratedDocument<ClubManualPayment>;
export const ClubManualPaymentSchema =
  SchemaFactory.createForClass(ClubManualPayment);
ClubManualPaymentSchema.index({ clubId: 1, paidAt: -1 });
