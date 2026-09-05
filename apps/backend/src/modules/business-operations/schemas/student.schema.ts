import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "club_students", timestamps: true })
export class ClubStudent {
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User", default: null, index: true })
  userId: Types.ObjectId | null;
  @Prop({ required: true, trim: true, maxlength: 80 }) firstName: string;
  @Prop({ required: true, trim: true, maxlength: 80 }) lastName: string;
  @Prop({ required: true, trim: true, maxlength: 20 }) phone: string;
  @Prop({ trim: true, maxlength: 120, default: "" }) sport: string;
  @Prop({ trim: true, maxlength: 120, default: "" }) membershipTitle: string;
  @Prop({ type: Date, default: null }) membershipEndsAt: Date | null;
  @Prop({ type: String, enum: ["active", "inactive"], default: "active" })
  status: "active" | "inactive";
  @Prop({ trim: true, maxlength: 500, default: "" }) notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ClubStudentDocument = HydratedDocument<ClubStudent>;
export const ClubStudentSchema = SchemaFactory.createForClass(ClubStudent);
ClubStudentSchema.index({ clubId: 1, phone: 1 }, { unique: true });
ClubStudentSchema.index(
  { clubId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { userId: { $type: "objectId" } } },
);
