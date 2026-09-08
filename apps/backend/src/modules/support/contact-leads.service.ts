import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { createHash } from "node:crypto";
import { Model } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { ContactLead, type ContactLeadDocument } from "./contact-lead.schema";

@Injectable()
export class ContactLeadsService {
  constructor(
    @InjectModel(ContactLead.name)
    private readonly leads: Model<ContactLeadDocument>,
  ) {}

  async create(input: { name: string; email: string; note: string; consent: true; website?: string }) {
    if (input.website) return { accepted: true as const };
    const email = input.email.trim().toLowerCase();
    const fingerprint = createHash("sha256")
      .update(`${email}:${input.note.trim()}`)
      .digest("hex");
    const recent = await this.leads.exists({
      fingerprint,
      createdAt: { $gt: new Date(Date.now() - 10 * 60_000) },
    });
    if (recent) return { accepted: true as const };
    await this.leads.create({
      name: input.name.trim(),
      email,
      note: input.note.trim(),
      consentedAt: new Date(),
      consentVersion: "website-contact-v1",
      fingerprint,
    });
    return { accepted: true as const };
  }

  async list(status?: string) {
    const filter = status && ["new", "contacted", "closed"].includes(status) ? { status } : {};
    const items = await this.leads.find(filter).sort({ createdAt: -1 }).limit(500).select("-fingerprint");
    return { items };
  }

  async update(id: string, status: "new" | "contacted" | "closed") {
    const item = await this.leads.findByIdAndUpdate(id, { $set: { status } }, { new: true }).select("-fingerprint");
    if (!item) throw new AppError(404, "CONTACT_LEAD_NOT_FOUND", "Contact lead not found");
    return item;
  }
}
