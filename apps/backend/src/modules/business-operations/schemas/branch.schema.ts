import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "club_branches", timestamps: true })
export class ClubBranch {
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({ required: true, trim: true, maxlength: 120 }) name: string;
  @Prop({ required: true, trim: true, maxlength: 300 }) address: string;
  @Prop({ trim: true, maxlength: 20, default: "" }) phone: string;
  @Prop({ trim: true, maxlength: 80, default: "Asia/Tehran" }) timezone: string;
  @Prop({ type: String, enum: ["active", "inactive"], default: "active" })
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

export type ClubBranchDocument = HydratedDocument<ClubBranch>;
export const ClubBranchSchema = SchemaFactory.createForClass(ClubBranch);
ClubBranchSchema.index({ clubId: 1, name: 1 }, { unique: true });
