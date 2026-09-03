import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export const SOCIAL_PLATFORMS = [
  "instagram",
  "telegram",
  "whatsapp",
  "youtube",
  "aparat",
  "facebook",
  "linkedin",
  "x",
  "website",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

@Schema({ _id: false })
export class ClubGalleryItem {
  @Prop({ type: Types.ObjectId, ref: "Media", required: true })
  mediaId: Types.ObjectId;

  @Prop({ trim: true, maxlength: 120 })
  title?: string;
}

@Schema({ _id: false })
export class ClubResourceQuantity {
  @Prop({ type: Types.ObjectId, required: true })
  resourceId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 10_000 })
  quantity: number;
}

@Schema({ _id: false })
export class ClubSocialMedia {
  @Prop({ type: String, enum: SOCIAL_PLATFORMS, required: true })
  platform: SocialPlatform;

  @Prop({ required: true, trim: true, maxlength: 500 })
  link: string;
}

@Schema({ _id: false })
export class CancellationTier {
  @Prop({ type: Number, required: true, min: 0, max: 8760 })
  hoursBefore: number;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  refundPercent: number;
}

@Schema({ _id: false })
export class ClubCancellationRule {
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 80 })
  title: string;

  @Prop({ type: [CancellationTier], required: true })
  tiers: CancellationTier[];
}

@Schema({ _id: false })
export class ClubGeo {
  @Prop({ type: Types.ObjectId, required: true })
  countryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  provinceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  cityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null })
  districtId: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], default: [] })
  cityRegionIds: Types.ObjectId[];
}

@Schema({ _id: false })
export class ClubLocationPoint {
  @Prop({ type: String, enum: ["Point"], required: true })
  type: "Point";

  @Prop({ type: [Number], required: true })
  coordinates: [number, number];
}

@Schema({ collection: "clubs", timestamps: true })
export class Club {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 120 })
  name: string;

  @Prop({ required: true, select: false })
  normalizedName: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ trim: true, maxlength: 5000, default: "" })
  description: string;

  @Prop({ type: [ClubGalleryItem], default: [] })
  gallery: ClubGalleryItem[];

  @Prop({ type: [ClubResourceQuantity], default: [] })
  equipment: ClubResourceQuantity[];

  @Prop({ type: [ClubResourceQuantity], default: [] })
  amenities: ClubResourceQuantity[];

  @Prop({ type: [String], default: [] })
  rules: string[];

  @Prop({ type: ClubGeo })
  geo?: ClubGeo;

  @Prop({ trim: true, maxlength: 500 })
  address?: string;

  @Prop({ type: ClubLocationPoint })
  location?: ClubLocationPoint;

  @Prop({ type: [ClubSocialMedia], default: [] })
  socialMedia: ClubSocialMedia[];

  @Prop({ type: [Types.ObjectId], default: [] })
  clubTypeIds: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [ClubCancellationRule], default: [] })
  cancellationRules: ClubCancellationRule[];

  @Prop({
    type: String,
    enum: ["draft", "pending", "approved", "rejected"],
    default: "draft",
  })
  reviewStatus: "draft" | "pending" | "approved" | "rejected";

  @Prop({ type: String, enum: ["hidden", "public"], default: "hidden" })
  visibility: "hidden" | "public";

  @Prop({ type: String, trim: true, maxlength: 1000, default: null })
  rejectionReason: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export type ClubDocument = HydratedDocument<Club>;
export const ClubSchema = SchemaFactory.createForClass(Club);
ClubSchema.index({ location: "2dsphere" }, { sparse: true });
ClubSchema.index({ ownerId: 1, updatedAt: -1 });
ClubSchema.index({ reviewStatus: 1, visibility: 1, "geo.cityId": 1 });
ClubSchema.index({ clubTypeIds: 1 });
ClubSchema.index({ "amenities.resourceId": 1 });
ClubSchema.index({ "equipment.resourceId": 1 });
