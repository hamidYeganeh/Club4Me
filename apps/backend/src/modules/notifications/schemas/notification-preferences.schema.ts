import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "notification_preferences", timestamps: true })
export class NotificationPreferences {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true })
  userId: Types.ObjectId;
  @Prop({ type: Boolean, default: true }) bookingUpdates: boolean;
  @Prop({ type: Boolean, default: true }) reminders: boolean;
  @Prop({ type: Boolean, default: true }) discovery: boolean;
  @Prop({ type: Boolean, default: false }) marketing: boolean;
}

export type NotificationPreferencesDocument =
  HydratedDocument<NotificationPreferences>;
export const NotificationPreferencesSchema = SchemaFactory.createForClass(
  NotificationPreferences,
);
