import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "club_reviews", timestamps: true })
export class ClubReview {
  @Prop({ type: Types.ObjectId, ref: "Club", required: true })
  clubId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ type: Number, min: 1, max: 5, required: true })
  rating: number;

  @Prop({ trim: true, maxlength: 120 })
  title?: string;

  @Prop({ trim: true, maxlength: 2000, default: "" })
  body: string;

  @Prop({ enum: ["published", "hidden"], default: "published" })
  status: "published" | "hidden";

  createdAt: Date;
  updatedAt: Date;
}

export type ClubReviewDocument = HydratedDocument<ClubReview>;
export const ClubReviewSchema = SchemaFactory.createForClass(ClubReview);
ClubReviewSchema.index({ clubId: 1, userId: 1 }, { unique: true });
ClubReviewSchema.index({ clubId: 1, status: 1, createdAt: -1 });
