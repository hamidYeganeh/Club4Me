import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import {
  supportReferenceTypes,
  type SupportReferenceType,
} from "./support-references.service";

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

@Schema({ _id: true, timestamps: true })
export class TicketInternalNote {
  _id: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  authorId: Types.ObjectId;
  @Prop({ type: String, required: true, maxlength: 5000 }) body: string;
  @Prop({
    type: String,
    enum: ["contacted", "no_answer", "callback_requested", "resolved_by_call"],
    default: null,
  })
  callOutcome:
    | "contacted"
    | "no_answer"
    | "callback_requested"
    | "resolved_by_call"
    | null;
  createdAt: Date;
}
const TicketInternalNoteSchema =
  SchemaFactory.createForClass(TicketInternalNote);

@Schema({ collection: "support_tickets", timestamps: true })
export class SupportTicket {
  @Prop({ type: String, enum: supportReferenceTypes, default: null })
  referenceType: SupportReferenceType | null;
  @Prop({ type: Types.ObjectId, default: null })
  referenceId: Types.ObjectId | null;
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
    enum: ["low", "normal", "high", "urgent"],
    default: "normal",
    index: true,
  })
  priority: "low" | "normal" | "high" | "urgent";
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
  @Prop({ type: [TicketInternalNoteSchema], default: [] })
  internalNotes: TicketInternalNote[];
  @Prop({ type: Date, required: true, index: true }) slaDueAt: Date;
  @Prop({ type: Date, default: null }) firstRespondedAt: Date | null;
  @Prop({ type: Date, default: null }) slaBreachedAt: Date | null;
  @Prop({ type: Number, default: 0, min: 0, max: 3 })
  escalationLevel: number;
  @Prop({ type: Date, default: null, index: true })
  nextEscalationAt: Date | null;
  @Prop({ type: Date, default: null }) resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export type SupportTicketDocument = HydratedDocument<SupportTicket>;
export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
SupportTicketSchema.index({ requesterId: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, firstRespondedAt: 1, slaDueAt: 1 });

SupportTicketSchema.index({ referenceType: 1, referenceId: 1 });
