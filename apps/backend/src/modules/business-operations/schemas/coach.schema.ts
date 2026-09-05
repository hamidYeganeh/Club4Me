import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "club_coach_profiles", timestamps: true })
export class ClubCoachProfile {
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User", default: null, index: true })
  userId: Types.ObjectId | null;
  @Prop({ required: true, trim: true, maxlength: 80 }) firstName: string;
  @Prop({ required: true, trim: true, maxlength: 80 }) lastName: string;
  @Prop({ required: true, trim: true, maxlength: 20 }) phone: string;
  @Prop({ type: [String], default: [] }) specialties: string[];
  @Prop({ trim: true, maxlength: 120, default: "" }) employmentType: string;
  @Prop({ type: String, enum: ["active", "inactive"], default: "active" })
  status: "active" | "inactive";
  @Prop({ trim: true, maxlength: 500, default: "" }) notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ClubCoachProfileDocument = HydratedDocument<ClubCoachProfile>;
export const ClubCoachProfileSchema =
  SchemaFactory.createForClass(ClubCoachProfile);
ClubCoachProfileSchema.index({ clubId: 1, phone: 1 }, { unique: true });
ClubCoachProfileSchema.index(
  { clubId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { userId: { $type: "objectId" } } },
);
