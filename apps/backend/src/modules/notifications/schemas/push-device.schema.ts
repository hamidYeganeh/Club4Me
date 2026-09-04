import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "push_devices", timestamps: true })
export class PushDevice {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;
  @Prop({ required: true, unique: true, maxlength: 4096 }) token: string;
  @Prop({ required: true, maxlength: 200 }) deviceId: string;
  @Prop({ type: String, enum: ["android"], required: true })
  platform: "android";
  @Prop({ required: true, maxlength: 32 }) appVersion: string;
  @Prop({ required: true, maxlength: 20, default: "fa-IR" }) locale: string;
  @Prop({ type: Boolean, default: true }) enabled: boolean;
  @Prop({ type: Date, default: Date.now }) lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PushDeviceDocument = HydratedDocument<PushDevice>;
export const PushDeviceSchema = SchemaFactory.createForClass(PushDevice);
PushDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
