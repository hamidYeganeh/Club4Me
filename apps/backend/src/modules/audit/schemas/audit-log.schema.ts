import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

@Schema({
  collection: "audit_logs",
  timestamps: { createdAt: true, updatedAt: false },
})
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  actorId: Types.ObjectId;
  @Prop({ required: true, index: true }) action: string;
  @Prop({ required: true }) method: string;
  @Prop({ required: true }) path: string;
  @Prop({ type: Number, required: true }) statusCode: number;
  @Prop({ type: SchemaTypes.Mixed, default: {} }) metadata: Record<
    string,
    unknown
  >;
  @Prop({ type: String, maxlength: 80 }) ip?: string;
  createdAt: Date;
}

export type AuditLogDocument = HydratedDocument<AuditLog>;
export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
