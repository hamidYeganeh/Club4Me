import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ _id: false })
export class NotificationDelivery {
  @Prop({
    type: String,
    enum: ["pending", "processing", "accepted", "skipped", "failed"],
    default: "pending",
  })
  state: string;
  @Prop({ type: Number, default: 0 }) attempts: number;
  @Prop({ type: Date, default: Date.now }) nextAttemptAt: Date;
  @Prop({ type: Date, default: null }) leaseUntil: Date | null;
  @Prop({ type: String, default: null }) leaseToken: string | null;
  @Prop({ type: Date, default: null }) acceptedAt: Date | null;
  @Prop({ type: String, default: null }) errorCode: string | null;
}
const DeliverySchema = SchemaFactory.createForClass(NotificationDelivery);

@Schema({ collection: "notifications", timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;
  @Prop({ required: true, maxlength: 80 }) type: string;
  @Prop({ required: true, maxlength: 180 }) title: string;
  @Prop({ required: true, maxlength: 1000 }) body: string;
  @Prop({ maxlength: 500 }) href?: string;
  @Prop({ type: Date, default: null }) readAt: Date | null;
  // Null on legacy records: deployment must not resend old notifications.
  @Prop({ type: DeliverySchema, default: null })
  pushDelivery: NotificationDelivery | null;
  @Prop({ type: DeliverySchema, default: null })
  smsDelivery: NotificationDelivery | null;
  @Prop({ type: String, default: null }) smsTemplate: string | null;
  @Prop({ type: Object, default: null }) smsTokens: {
    token: string;
    token10?: string;
    token20?: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument = HydratedDocument<Notification>;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({
  "pushDelivery.state": 1,
  "pushDelivery.nextAttemptAt": 1,
  "pushDelivery.leaseUntil": 1,
});
NotificationSchema.index({
  "smsDelivery.state": 1,
  "smsDelivery.nextAttemptAt": 1,
  "smsDelivery.leaseUntil": 1,
});
