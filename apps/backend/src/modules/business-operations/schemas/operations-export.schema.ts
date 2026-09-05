import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "operations_export_jobs", timestamps: true })
export class OperationsExportJob {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  actorId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({
    type: String,
    enum: ["students", "coaches", "classes", "payments", "attendance"],
    required: true,
  })
  kind: "students" | "coaches" | "classes" | "payments" | "attendance";
  @Prop({ type: String, enum: ["csv", "xlsx"], required: true })
  format: "csv" | "xlsx";
  @Prop({
    type: String,
    enum: ["queued", "processing", "ready", "failed", "expired"],
    default: "queued",
    index: true,
  })
  status: "queued" | "processing" | "ready" | "failed" | "expired";
  @Prop({ type: String, default: null }) storageKey: string | null;
  @Prop({ type: String, default: null }) filename: string | null;
  @Prop({ type: String, default: null }) mimeType: string | null;
  @Prop({ type: Number, default: null, min: 0 }) sizeBytes: number | null;
  @Prop({ type: String, default: "", maxlength: 1000 }) error: string;
  @Prop({ type: Date, default: null }) startedAt: Date | null;
  @Prop({ type: Date, default: null }) completedAt: Date | null;
  @Prop({ type: Date, default: null, index: true }) expiresAt: Date | null;
  @Prop({ type: Number, default: 0, min: 0 }) downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type OperationsExportJobDocument = HydratedDocument<OperationsExportJob>;
export const OperationsExportJobSchema =
  SchemaFactory.createForClass(OperationsExportJob);
OperationsExportJobSchema.index({ status: 1, createdAt: 1 });
OperationsExportJobSchema.index({ clubId: 1, actorId: 1, createdAt: -1 });
