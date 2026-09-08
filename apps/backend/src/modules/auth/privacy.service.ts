import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { DataConsent, type DataConsentDocument } from "./schemas/data-consent.schema";

export const PRIVACY_POLICY_VERSION = "2026-09-08";

@Injectable()
export class PrivacyService {
  constructor(@InjectModel(DataConsent.name) private readonly consents: Model<DataConsentDocument>) {}
  async get(userId: string) {
    const items = await this.consents.find({ userId: new Types.ObjectId(userId) }).sort({ purpose: 1 }).lean();
    return { policyVersion: PRIVACY_POLICY_VERSION, purposes: [
      { id: "analytics", required: false, label: "تحلیل بهبود محصول" },
      { id: "precise_location", required: false, label: "موقعیت دقیق برای پیشنهاد نزدیک" },
      { id: "training_results", required: false, label: "اشتراک نتیجه تمرین با مربی" },
      { id: "marketing", required: false, label: "پیام‌های پیشنهادی" },
    ], items: items.map((item) => ({ purpose: item.purpose, version: item.version, granted: item.granted, decidedAt: item.decidedAt.toISOString() })) };
  }
  async decide(userId: string, purpose: DataConsent["purpose"], granted: boolean, version: string) {
    if (version !== PRIVACY_POLICY_VERSION) return { policyChanged: true as const, ...(await this.get(userId)) };
    const decidedAt = new Date();
    await this.consents.updateOne({ userId: new Types.ObjectId(userId), purpose }, { $set: { granted, version, decidedAt } }, { upsert: true });
    return { policyChanged: false as const, purpose, granted, version, decidedAt: decidedAt.toISOString() };
  }
}
