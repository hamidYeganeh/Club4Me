import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ _id: true, timestamps: true })
export class TicketMessage {
  _id: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  authorId: Types.ObjectId;
  @Prop({ type: String, enum: ["user", "agent"], required: true }) authorType:
    "user" | "agent";
  @Prop({ type: String, required: true, maxlength: 5000 }) body: string;
  createdAt: Date;
}
const TicketMessageSchema = SchemaFactory.createForClass(TicketMessage);

@Schema({ collection: "support_tickets", timestamps: true })
export class SupportTicket {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  requesterId: Types.ObjectId;
  @Prop({ type: String, required: true, maxlength: 160 }) subject: string;
  @Prop({
    type: String,
    enum: ["payment", "reservation", "account", "club", "other"],
    required: true,
  })
  category: "payment" | "reservation" | "account" | "club" | "other";
  @Prop({ type: String, enum: ["in_app", "phone"], default: "in_app" })
  preferredContact: "in_app" | "phone";
  @Prop({
    type: String,
    enum: ["open", "in_progress", "waiting_for_user", "resolved", "closed"],
    default: "open",
    index: true,
  })
  status: "open" | "in_progress" | "waiting_for_user" | "resolved" | "closed";
  @Prop({ type: Types.ObjectId, ref: "User", default: null, index: true })
  assigneeId: Types.ObjectId | null;
  @Prop({ type: [TicketMessageSchema], default: [] }) messages: TicketMessage[];
  @Prop({ type: Date, default: null }) resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export type SupportTicketDocument = HydratedDocument<SupportTicket>;
export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
SupportTicketSchema.index({ requesterId: 1, createdAt: -1 });
