import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

@Schema({
  collection: "product_telemetry",
  timestamps: { createdAt: "receivedAt", updatedAt: false },
})
export class ProductTelemetry {
  @Prop({ required: true, unique: true }) eventId: string;
  @Prop({ required: true, enum: ["identify", "group", "track"], index: true })
  kind: "identify" | "group" | "track";
  @Prop({ type: Types.ObjectId, ref: "User", default: null, index: true })
  actorId?: Types.ObjectId | null;
  @Prop({ type: String, default: null, index: true, select: false })
  anonymousHash?: string | null;
  @Prop({ type: [String], default: [] }) roles: string[];
  @Prop({ index: true }) event?: string;
  @Prop({ enum: ["club", "session"] }) groupType?: "club" | "session";
  @Prop({ type: Types.ObjectId, index: true }) groupId?: Types.ObjectId;
  @Prop({ type: SchemaTypes.Mixed, default: {} }) properties: Record<
    string,
    unknown
  >;
  @Prop({ type: SchemaTypes.Mixed, default: {} }) traits: Record<
    string,
    unknown
  >;
  @Prop({ required: true }) occurredAt: Date;
  @Prop({ required: true, enum: ["android", "web"] }) platform:
    "android" | "web";
  @Prop({ required: true, maxlength: 40 }) appVersion: string;
  @Prop({ required: true, maxlength: 40 }) backendRelease: string;
  @Prop({ required: true, enum: ["development", "production", "test"] })
  environment: "development" | "production" | "test";
  @Prop({ required: true }) expiresAt: Date;
  receivedAt: Date;
}

export type ProductTelemetryDocument = HydratedDocument<ProductTelemetry>;
export const ProductTelemetrySchema =
  SchemaFactory.createForClass(ProductTelemetry);
ProductTelemetrySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
ProductTelemetrySchema.index({ event: 1, occurredAt: -1 });
