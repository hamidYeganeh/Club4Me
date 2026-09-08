import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ServiceReviewTarget = "coach" | "class";
export type ServiceReviewTargetSource = "coach" | "coach_class" | "business_class";

@Schema({ collection: "service_reviews", timestamps: true })
export class ServiceReview {
  @Prop({ type: String, enum: ["coach", "class"], required: true, index: true })
  targetType: ServiceReviewTarget;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  targetId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ["coach", "coach_class", "business_class"],
    required: true,
  })
  targetSource: ServiceReviewTargetSource;

  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true }) attendanceId: Types.ObjectId;
  @Prop({ type: String, enum: ["coach", "class"], required: true })
  attendanceType: "coach" | "class";

  @Prop({ type: Number, min: 1, max: 5, required: true }) rating: number;
  @Prop({ trim: true, maxlength: 120 }) title?: string;
  @Prop({ trim: true, maxlength: 2000, default: "" }) body: string;
  @Prop({ type: [Types.ObjectId], ref: "Media", default: [] })
  mediaIds: Types.ObjectId[];
  @Prop({ type: Boolean, default: true }) isVerifiedAttendance: boolean;

  @Prop({ type: Object, default: null })
  ownerResponse: {
    body: string;
    respondedAt: Date;
    respondedBy: Types.ObjectId;
  } | null;

  @Prop({
    type: String,
    enum: ["pending", "published", "hidden", "reported"],
    default: "published",
    index: true,
  })
  status: "pending" | "published" | "hidden" | "reported";
  @Prop({ type: String, trim: true, maxlength: 500, default: "" })
  moderationReason: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ServiceReviewDocument = HydratedDocument<ServiceReview>;
export const ServiceReviewSchema = SchemaFactory.createForClass(ServiceReview);
ServiceReviewSchema.index(
  { targetType: 1, targetId: 1, userId: 1 },
  { unique: true },
);
ServiceReviewSchema.index({ targetType: 1, targetId: 1, status: 1, createdAt: -1 });
