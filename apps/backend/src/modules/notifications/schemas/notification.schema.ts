import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "notifications", timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;
  @Prop({ required: true, maxlength: 80 }) type: string;
  @Prop({ required: true, maxlength: 180 }) title: string;
  @Prop({ required: true, maxlength: 1000 }) body: string;
  @Prop({ maxlength: 500 }) href?: string;
  @Prop({ type: Date, default: null }) readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument = HydratedDocument<Notification>;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, createdAt: -1 });
