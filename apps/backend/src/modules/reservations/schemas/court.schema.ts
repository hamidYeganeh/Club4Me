import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "courts", timestamps: true })
export class Court {
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 120 })
  name: string;
  @Prop({ type: Types.ObjectId })
  courtTypeId?: Types.ObjectId;
  @Prop({ trim: true, maxlength: 2000, default: "" })
  description: string;
  @Prop({ type: Number, required: true, min: 1, max: 1000 })
  capacity: number;
  @Prop({ type: Boolean, default: true })
  isReservable: boolean;
  @Prop({ type: String, enum: ["active", "inactive"], default: "active" })
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}
export type CourtDocument = HydratedDocument<Court>;
export const CourtSchema = SchemaFactory.createForClass(Court);
CourtSchema.index({ clubId: 1, name: 1 }, { unique: true });
