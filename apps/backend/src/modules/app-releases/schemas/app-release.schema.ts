import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import { APP_PLATFORMS, type AppPlatform } from "../app-version";

@Schema({ collection: "app_releases", timestamps: true })
export class AppRelease {
  @Prop({ type: String, enum: APP_PLATFORMS, required: true, unique: true })
  platform: AppPlatform;

  @Prop({ required: true, trim: true }) latestVersion: string;
  @Prop({ required: true, trim: true }) minimumSupportedVersion: string;
  @Prop({ required: true, trim: true, maxlength: 160 }) title: string;
  @Prop({ type: [String], default: [] }) releaseNotes: string[];
  @Prop({ required: true, trim: true, maxlength: 1000 }) storeUrl: string;
  @Prop({ type: Boolean, default: true, index: true }) active: boolean;
  @Prop({ type: Boolean, default: false }) maintenanceEnabled: boolean;
  @Prop({
    type: String,
    default: "در حال به‌روزرسانی سرویس",
    maxlength: 160,
  })
  maintenanceTitle: string;
  @Prop({
    type: String,
    default: "چند دقیقه دیگر دوباره تلاش کنید.",
    maxlength: 1000,
  })
  maintenanceMessage: string;
  @Prop({ type: Object, default: {} }) featureFlags: Record<string, boolean>;
  @Prop({ type: Date, default: Date.now }) publishedAt: Date;
  @Prop({ type: Types.ObjectId, required: true }) updatedBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export type AppReleaseDocument = HydratedDocument<AppRelease>;
export const AppReleaseSchema = SchemaFactory.createForClass(AppRelease);
