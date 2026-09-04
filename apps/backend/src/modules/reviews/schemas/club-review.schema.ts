import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "club_reviews", timestamps: true })
export class ClubReview {
  @Prop({ type: Types.ObjectId, ref: "Club", required: true })
  clubId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: "Reservation",
    required: true,
    unique: true,
  })
  reservationId: Types.ObjectId;

  @Prop({ type: Number, min: 1, max: 5, required: true })
  rating: number;

  @Prop({ trim: true, maxlength: 120 })
  title?: string;

  @Prop({ trim: true, maxlength: 2000, default: "" })
  body: string;

  @Prop({ type: Object, default: {} })
  ratings: Record<string, number>;

  @Prop({ type: [Types.ObjectId], ref: "Media", default: [] })
  mediaIds: Types.ObjectId[];

  @Prop({ type: Boolean, default: true }) isVerifiedBooking: boolean;

  @Prop({ type: Object, default: null })
  ownerResponse: {
    body: string;
    respondedAt: Date;
    respondedBy: Types.ObjectId;
  } | null;

  @Prop({
    enum: ["pending", "published", "hidden", "reported"],
    default: "published",
  })
  status: "pending" | "published" | "hidden" | "reported";
  @Prop({ type: String, trim: true, maxlength: 500 }) moderationReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ClubReviewDocument = HydratedDocument<ClubReview>;
export const ClubReviewSchema = SchemaFactory.createForClass(ClubReview);
ClubReviewSchema.index({ clubId: 1, userId: 1 }, { unique: true });
ClubReviewSchema.index({ clubId: 1, status: 1, createdAt: -1 });
