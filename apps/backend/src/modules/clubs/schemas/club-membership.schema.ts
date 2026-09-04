import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "club_memberships", timestamps: true })
export class ClubMembership {
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Coach" }) coachId?: Types.ObjectId;
  @Prop({
    type: String,
    enum: ["owner", "manager", "receptionist", "finance", "coach"],
    required: true,
  })
  role: "owner" | "manager" | "receptionist" | "finance" | "coach";
  @Prop({ type: [String], default: [] }) permissions: string[];
  @Prop({
    type: String,
    enum: ["invited", "accepted", "rejected", "suspended"],
    default: "invited",
  })
  status: "invited" | "accepted" | "rejected" | "suspended";
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  invitedBy: Types.ObjectId;
  @Prop({ type: Date }) acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export type ClubMembershipDocument = HydratedDocument<ClubMembership>;
export const ClubMembershipSchema =
  SchemaFactory.createForClass(ClubMembership);
ClubMembershipSchema.index({ clubId: 1, userId: 1 }, { unique: true });
