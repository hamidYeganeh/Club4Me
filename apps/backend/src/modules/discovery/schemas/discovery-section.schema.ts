import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

export const DISCOVERY_SECTION_TYPES = [
  "banners",
  "clubs",
  "coaches",
  "classes",
  "articles",
] as const;
export const DISCOVERY_SELECTION_MODES = ["manual", "query"] as const;
export const DISCOVERY_SORTS = ["manual", "newest", "rating", "name"] as const;

@Schema({ _id: false })
export class DiscoverySelection {
  @Prop({ type: String, enum: DISCOVERY_SELECTION_MODES, default: "query" })
  mode: (typeof DISCOVERY_SELECTION_MODES)[number];

  @Prop({ type: [Types.ObjectId], default: [] })
  itemIds: Types.ObjectId[];

  @Prop({ type: Number, min: 1, max: 50, default: 10 })
  limit: number;

  @Prop({ type: String, enum: DISCOVERY_SORTS, default: "newest" })
  sort: (typeof DISCOVERY_SORTS)[number];

  // Filters are validated by the DTO. Mixed keeps each content type extensible.
  @Prop({ type: SchemaTypes.Mixed, default: {} })
  filters: Record<string, unknown>;
}

@Schema({ _id: false })
export class DiscoveryBanner {
  @Prop({ required: true, trim: true, maxlength: 160 }) title: string;
  @Prop({ trim: true, maxlength: 300, default: "" }) subtitle: string;
  @Prop({ required: true, trim: true, maxlength: 1000 }) imageUrl: string;
  @Prop({ trim: true, maxlength: 120, default: "" }) actionLabel: string;
  @Prop({ trim: true, maxlength: 1000, default: "" }) actionUrl: string;
}

@Schema({ _id: false })
export class DiscoveryAppearance {
  @Prop({ trim: true, maxlength: 80, default: "transparent" })
  backgroundColor: string;
  @Prop({ trim: true, maxlength: 80, default: "" }) textColor: string;
  @Prop({ trim: true, maxlength: 80, default: "" }) accentColor: string;
  @Prop({ type: Boolean, default: true }) showHeader: boolean;
  @Prop({ type: Boolean, default: true }) showViewAll: boolean;
  @Prop({ type: String, enum: ["start", "center"], default: "start" })
  headerAlignment: "start" | "center";
  @Prop({ type: String, enum: ["link", "solid", "outline"], default: "link" })
  viewAllVariant: "link" | "solid" | "outline";
}

@Schema({ collection: "discovery_sections", timestamps: true })
export class DiscoverySection {
  @Prop({ required: true, unique: true, trim: true, maxlength: 80 })
  key: string;
  @Prop({ type: String, enum: DISCOVERY_SECTION_TYPES, required: true })
  type: (typeof DISCOVERY_SECTION_TYPES)[number];
  @Prop({ required: true, trim: true, maxlength: 160 }) title: string;
  @Prop({ trim: true, maxlength: 300, default: "" }) subtitle: string;
  @Prop({ trim: true, maxlength: 80, default: "carousel" }) layout: string;
  @Prop({ trim: true, maxlength: 120, default: "" }) viewAllLabel: string;
  @Prop({ trim: true, maxlength: 1000, default: "" }) viewAllUrl: string;
  @Prop({ type: DiscoveryAppearance, default: () => ({}) })
  appearance: DiscoveryAppearance;
  @Prop({ type: Boolean, default: true, index: true }) enabled: boolean;
  @Prop({ type: Number, min: 0, default: 0, index: true }) position: number;
  @Prop({ type: DiscoverySelection, default: () => ({}) })
  selection: DiscoverySelection;
  @Prop({ type: [DiscoveryBanner], default: [] }) banners: DiscoveryBanner[];
  createdAt: Date;
  updatedAt: Date;
}

export type DiscoverySectionDocument = HydratedDocument<DiscoverySection>;
export const DiscoverySectionSchema =
  SchemaFactory.createForClass(DiscoverySection);
DiscoverySectionSchema.index({ enabled: 1, position: 1, _id: 1 });
