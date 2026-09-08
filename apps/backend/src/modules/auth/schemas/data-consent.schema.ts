import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "data_consents", timestamps: true })
export class DataConsent {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true }) userId: Types.ObjectId;
  @Prop({ type: String, enum: ["analytics", "precise_location", "training_results", "marketing"], required: true }) purpose: "analytics" | "precise_location" | "training_results" | "marketing";
  @Prop({ required: true }) version: string;
  @Prop({ required: true }) granted: boolean;
  @Prop({ type: Date, required: true }) decidedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
export type DataConsentDocument = HydratedDocument<DataConsent>;
export const DataConsentSchema = SchemaFactory.createForClass(DataConsent);
DataConsentSchema.index({ userId: 1, purpose: 1 }, { unique: true });
