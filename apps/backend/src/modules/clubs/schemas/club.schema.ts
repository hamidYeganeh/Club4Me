import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import type { ClubProfile, ClubBusyHour } from "../dto/club-profile.dto";

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
  "email",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

@Schema({ _id: false })
export class ClubGalleryItem {
  @Prop({ type: Types.ObjectId, ref: "Media", required: true })
  mediaId: Types.ObjectId;

  @Prop({ trim: true, maxlength: 120 })
  title?: string;

  @Prop({ trim: true, maxlength: 180 }) altText?: string;
  @Prop({ type: String, enum: ["image", "video"], default: "image" })
  kind: "image" | "video";
  @Prop({ type: Number, min: 0, default: 0 }) position: number;
  @Prop({ type: Boolean, default: false }) isCover: boolean;
  @Prop({
    type: String,
    enum: ["training", "equipment", "changing_room", "entrance", "other"],
  })
  category?: string;
  @Prop({ type: String }) takenOn?: string;
}

@Schema({ _id: false })
export class ClubResourceQuantity {
  @Prop({ type: Types.ObjectId, required: true })
  resourceId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 10_000 })
  quantity: number;

  @Prop({ type: Number, min: 0, default: 0 }) reservableQuantity: number;
  @Prop({
    type: String,
    enum: ["available", "maintenance", "unavailable"],
    default: "available",
  })
  status: "available" | "maintenance" | "unavailable";

  @Prop({ trim: true, maxlength: 2000, default: "" })
  description: string;
}

@Schema({ _id: false })
export class ClubMoney {
  @Prop({ type: Number, min: 0, required: true }) amount: number;
  @Prop({ type: String, trim: true, uppercase: true, default: "IRR" })
  currency: string;
}

@Schema({ _id: false })
export class ClubAmenity {
  @Prop({ type: Types.ObjectId, required: true }) resourceId: Types.ObjectId;
  @Prop({ type: Number, min: 0 }) quantity?: number;
  @Prop({
    type: String,
    enum: ["included", "paid", "unavailable"],
    default: "included",
  })
  availability: "included" | "paid" | "unavailable";
  @Prop({ type: ClubMoney }) price?: ClubMoney;
  @Prop({ trim: true, maxlength: 2000, default: "" })
  description: string;
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

@Schema()
export class ClubCancellationRule {
  _id: Types.ObjectId;
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 80 })
  title: string;

  @Prop({ type: [CancellationTier], required: true })
  tiers: CancellationTier[];

  @Prop({ type: Number, min: 1, default: 1 }) version: number;
  @Prop({ type: Number, default: 0 }) priority: number;
  @Prop({
    type: [String],
    enum: ["court", "class", "coached_session"],
    default: [],
  })
  sessionTypes: Array<"court" | "class" | "coached_session">;
  @Prop({ type: [Number], default: [] }) daysOfWeek: number[];
  @Prop({ type: [Types.ObjectId], default: [] }) courtIds: Types.ObjectId[];
  @Prop({ type: Number, min: 0, default: 0 }) reservationCutoffMinutes: number;
  @Prop({ type: Number, min: 0, default: 0 }) rescheduleCutoffMinutes: number;
  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  noShowRefundPercent: number;
  @Prop({ type: Number, min: 0, max: 100, default: 100 })
  ownerCancellationRefundPercent: number;
  @Prop({ type: Boolean, default: true }) isActive: boolean;
}

@Schema({ _id: false })
export class ClubOpeningPeriod {
  @Prop({ type: String, required: true }) opensAt: string;
  @Prop({ type: String, required: true }) closesAt: string;
}

@Schema({ _id: false })
export class ClubWeeklyHours {
  @Prop({ type: Number, min: 0, max: 6, required: true }) dayOfWeek: number;
  @Prop({ type: [ClubOpeningPeriod], default: [] })
  periods: ClubOpeningPeriod[];
  @Prop({ type: Boolean, default: false }) isClosed: boolean;
}

@Schema({ _id: false })
export class ClubClosure {
  @Prop({ type: Date, required: true }) startsAt: Date;
  @Prop({ type: Date, required: true }) endsAt: Date;
  @Prop({ type: String, trim: true, maxlength: 300, default: "" })
  reason: string;
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
  @Prop({ type: Object, default: {} }) profile: ClubProfile;
  @Prop({ type: Boolean, default: false }) trialBookingEnabled: boolean;
  @Prop({ type: [Object], default: [] }) busyHours: ClubBusyHour[];
  @Prop({ type: Date, default: null }) busyHoursUpdatedAt: Date | null;
  @Prop({ type: Object, default: {} }) verifications: Partial<
    Record<
      "identity" | "documents" | "on_site",
      { verifiedAt: string; verifiedBy: string }
    >
  >;
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

  @Prop({ trim: true, maxlength: 300, default: "" })
  shortDescription: string;

  @Prop({ type: Types.ObjectId, ref: "Media" }) logoMediaId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Media" }) coverMediaId?: Types.ObjectId;

  @Prop({ type: [ClubGalleryItem], default: [] })
  gallery: ClubGalleryItem[];

  @Prop({ type: [ClubResourceQuantity], default: [] })
  equipment: ClubResourceQuantity[];

  @Prop({ type: [ClubAmenity], default: [] })
  amenities: ClubAmenity[];

  @Prop({ type: [String], default: [] })
  rules: string[];

  @Prop({
    type: [{ question: String, answer: String }],
    default: [],
    _id: false,
  })
  faqs: Array<{ question: string; answer: string }>;

  @Prop({ type: ClubGeo })
  geo?: ClubGeo;

  @Prop({ trim: true, maxlength: 500 })
  address?: string;

  @Prop({ type: ClubLocationPoint })
  location?: ClubLocationPoint;

  @Prop({ trim: true, maxlength: 20, default: "" }) postalCode: string;
  @Prop({ trim: true, maxlength: 80, default: "Asia/Tehran" }) timezone: string;
  @Prop({ trim: true, maxlength: 500, default: "" }) locationNotes: string;

  @Prop({ type: [ClubSocialMedia], default: [] })
  socialMedia: ClubSocialMedia[];

  @Prop({ type: [Types.ObjectId], default: [] })
  clubTypeIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] }) sportIds: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [ClubCancellationRule], default: [] })
  cancellationRules: ClubCancellationRule[];

  @Prop({ type: [ClubWeeklyHours], default: [] })
  weeklyHours: ClubWeeklyHours[];
  @Prop({ type: [ClubClosure], default: [] }) closures: ClubClosure[];
  @Prop({
    type: [String],
    enum: ["men", "women", "mixed", "children", "family"],
    default: ["mixed"],
  })
  audience: Array<"men" | "women" | "mixed" | "children" | "family">;
  @Prop({ type: Number, min: 0, max: 120 }) minAge?: number;
  @Prop({ type: Number, min: 0, max: 120 }) maxAge?: number;
  @Prop({ type: String, trim: true, uppercase: true, default: "IRR" })
  currency: string;
  @Prop({ type: Number, min: 0, max: 100, default: 0 }) taxPercent: number;
  @Prop({ type: Number, min: 0, max: 5, default: 0 }) averageRating: number;
  @Prop({ type: Number, min: 0, default: 0 }) reviewsCount: number;
  @Prop({
    type: String,
    enum: [
      "active",
      "temporarily_closed",
      "permanently_closed",
      "under_maintenance",
    ],
    default: "active",
  })
  operationalStatus:
    | "active"
    | "temporarily_closed"
    | "permanently_closed"
    | "under_maintenance";

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

  @Prop({ type: Date }) publishedAt?: Date;
  @Prop({ type: Date }) archivedAt?: Date;
  @Prop({ type: Date }) suspendedAt?: Date;
  @Prop({ type: Types.ObjectId, ref: "User" }) createdBy?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User" }) updatedBy?: Types.ObjectId;
  @Prop({ type: Number, min: 1, default: 2 }) schemaVersion: number;

  createdAt: Date;
  updatedAt: Date;
}

export type ClubDocument = HydratedDocument<Club>;
export const ClubSchema = SchemaFactory.createForClass(Club);
ClubSchema.index({ location: "2dsphere" }, { sparse: true });
ClubSchema.index({ ownerId: 1, updatedAt: -1 });
ClubSchema.index({ reviewStatus: 1, visibility: 1, "geo.cityId": 1 });
ClubSchema.index({ clubTypeIds: 1 });
ClubSchema.index({ sportIds: 1 });
ClubSchema.index({ "amenities.resourceId": 1 });
ClubSchema.index({ "equipment.resourceId": 1 });
