import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "content_reports", timestamps: true })
export class ContentReport {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  reporterId: Types.ObjectId;
  @Prop({ type: String, enum: ["club", "coach", "class"], required: true })
  targetType: "club" | "coach" | "class";
  @Prop({ type: Types.ObjectId, required: true, index: true })
  targetId: Types.ObjectId;
  @Prop({ required: true, maxlength: 120 }) reason: string;
  @Prop({ default: "", maxlength: 2000 }) details: string;
  @Prop({
    type: String,
    enum: ["pending", "resolved", "rejected", "closed"],
    default: "pending",
    index: true,
  })
  status: "pending" | "resolved" | "rejected" | "closed";
  @Prop({ default: "", maxlength: 1000 }) resolutionNote: string;
  @Prop({ type: Types.ObjectId, ref: "User" }) handledBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentReportDocument = HydratedDocument<ContentReport>;
export const ContentReportSchema = SchemaFactory.createForClass(ContentReport);
ContentReportSchema.index({ status: 1, createdAt: -1 });
