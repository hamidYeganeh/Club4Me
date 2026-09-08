import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type SocialProvider = "google" | "facebook" | "x";

@Schema({ collection: "social_identities", timestamps: true })
export class SocialIdentity {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;
  @Prop({ type: String, enum: ["google", "facebook", "x"], required: true })
  provider: SocialProvider;
  @Prop({ required: true, select: false }) subject: string;
  @Prop({ type: String, trim: true, lowercase: true, default: null }) email:
    string | null;
  @Prop({ trim: true, default: "" }) displayName: string;
  @Prop({ type: Date, default: Date.now }) lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
export type SocialIdentityDocument = HydratedDocument<SocialIdentity>;
export const SocialIdentitySchema =
  SchemaFactory.createForClass(SocialIdentity);
SocialIdentitySchema.index({ provider: 1, subject: 1 }, { unique: true });
SocialIdentitySchema.index({ userId: 1, provider: 1 }, { unique: true });
