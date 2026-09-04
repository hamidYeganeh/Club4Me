import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "courts", timestamps: true })
export class Court {
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 120 })
  name: string;
  @Prop({ type: String, required: true, select: false }) normalizedName: string;
  @Prop({ type: String, trim: true, maxlength: 40 }) code?: string;
  @Prop({ type: Types.ObjectId })
  courtTypeId?: Types.ObjectId;
  @Prop({ type: [Types.ObjectId], default: [] }) sportIds: Types.ObjectId[];
  @Prop({ trim: true, maxlength: 2000, default: "" })
  description: string;
  @Prop({ type: Number, required: true, min: 1, max: 1000 })
  capacity: number;
  @Prop({
    type: String,
    enum: ["indoor", "outdoor", "covered"],
    default: "indoor",
  })
  environment: "indoor" | "outdoor" | "covered";
  @Prop({ type: Types.ObjectId }) surfaceTypeId?: Types.ObjectId;
  @Prop({ type: Number, min: 0 }) lengthMeters?: number;
  @Prop({ type: Number, min: 0 }) widthMeters?: number;
  @Prop({ type: String, trim: true, maxlength: 120 }) locationLabel?: string;
  @Prop({ type: String, trim: true, maxlength: 40 }) floor?: string;
  @Prop({ type: [Types.ObjectId], ref: "Media", default: [] })
  galleryMediaIds: Types.ObjectId[];
  @Prop({ type: Boolean, default: true })
  isReservable: boolean;
  @Prop({ type: Number, min: 1, default: 60 })
  minimumReservationMinutes: number;
  @Prop({ type: Number, min: 1, default: 480 })
  maximumReservationMinutes: number;
  @Prop({ type: Number, min: 0, default: 0 }) preparationMinutes: number;
  @Prop({ type: Number, min: 0, default: 0 }) cleanupMinutes: number;
  @Prop({ type: String, enum: ["active", "inactive"], default: "active" })
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}
export type CourtDocument = HydratedDocument<Court>;
export const CourtSchema = SchemaFactory.createForClass(Court);
CourtSchema.index({ clubId: 1, normalizedName: 1 }, { unique: true });
