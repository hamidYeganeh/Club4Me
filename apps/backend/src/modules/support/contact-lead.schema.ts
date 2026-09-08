import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ collection: "contact_leads", timestamps: true })
export class ContactLead {
  @Prop({ required: true, trim: true, maxlength: 120 }) name: string;
  @Prop({ required: true, trim: true, lowercase: true, maxlength: 254 }) email: string;
  @Prop({ trim: true, maxlength: 3000, default: "" }) note: string;
  @Prop({ type: String, enum: ["website"], default: "website" }) source: "website";
  @Prop({ type: String, enum: ["new", "contacted", "closed"], default: "new", index: true })
  status: "new" | "contacted" | "closed";
  @Prop({ type: Date, required: true }) consentedAt: Date;
  @Prop({ type: String, required: true, default: "website-contact-v1" }) consentVersion: string;
  @Prop({ type: String, default: "", select: false }) fingerprint: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ContactLeadDocument = HydratedDocument<ContactLead>;
export const ContactLeadSchema = SchemaFactory.createForClass(ContactLead);
ContactLeadSchema.index({ fingerprint: 1, createdAt: -1 });
