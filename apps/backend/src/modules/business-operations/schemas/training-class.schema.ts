import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ _id: false })
export class BusinessClassSchedule {
  @Prop({ type: Number, required: true, min: 0, max: 6 }) dayOfWeek: number;
  @Prop({ required: true, match: /^\d{2}:\d{2}$/ }) startTime: string;
  @Prop({ type: Number, required: true, min: 15, max: 480 })
  durationMinutes: number;
}

@Schema({ collection: "business_training_classes", timestamps: true })
export class BusinessTrainingClass {
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({ required: true, trim: true, maxlength: 140 }) title: string;
  @Prop({ trim: true, maxlength: 3000, default: "" }) description: string;
  @Prop({
    type: [{ question: String, answer: String }],
    default: [],
    _id: false,
  })
  faqs: Array<{ question: string; answer: string }>;
  @Prop({ trim: true, maxlength: 120, default: "" }) sport: string;
  @Prop({ trim: true, maxlength: 80, default: "" }) level: string;
  @Prop({
    type: Types.ObjectId,
    ref: "skill_levels",
    default: null,
    index: true,
  })
  skillLevelId: Types.ObjectId | null;
  @Prop({
    type: String,
    enum: ["group", "private", "course", "single", "open"],
    required: true,
  })
  classModel: "group" | "private" | "course" | "single" | "open";
  @Prop({
    type: String,
    enum: ["monthly", "course", "per_session", "package"],
    required: true,
  })
  pricingModel: "monthly" | "course" | "per_session" | "package";
  @Prop({ type: Number, required: true, min: 0 }) price: number;
  @Prop({ trim: true, uppercase: true, default: "IRR" }) currency: string;
  @Prop({ type: Number, min: 1, max: 1000, default: null })
  packageSessionCount: number | null;
  @Prop({ type: Number, required: true, min: 1, max: 1000 }) capacity: number;
  @Prop({ type: Number, default: 0, min: 0 }) activeEnrollmentCount: number;
  @Prop({ type: Number, default: 0, min: 0 }) pendingEnrollmentCount: number;
  @Prop({ type: Types.ObjectId, ref: "ClubCoachProfile", default: null })
  coachProfileId: Types.ObjectId | null;
  @Prop({ type: Types.ObjectId, ref: "ClubBranch", default: null })
  branchId: Types.ObjectId | null;
  @Prop({ type: [Types.ObjectId], ref: "Media", default: [] })
  galleryMediaIds: Types.ObjectId[];
  @Prop({ type: Types.ObjectId, ref: "Media", default: null })
  coverMediaId: Types.ObjectId | null;
  @Prop({ type: [String], default: [] }) prerequisites: string[];
  @Prop({ type: [Types.ObjectId], default: [] })
  requiredEquipmentIds: Types.ObjectId[];
  @Prop({ type: [Types.ObjectId], default: [] }) amenityIds: Types.ObjectId[];
  @Prop({ type: Number, min: 0, max: 120, default: null }) minAge:
    number | null;
  @Prop({ type: Number, min: 0, max: 120, default: null }) maxAge:
    number | null;
  @Prop({ type: Date, default: null }) registrationStartAt: Date | null;
  @Prop({ type: Date, default: null }) registrationEndAt: Date | null;
  @Prop({ type: String, trim: true, maxlength: 1000, default: null })
  scheduleError: string | null;
  @Prop({ type: Date, required: true }) startDate: Date;
  @Prop({ type: Date, required: true }) endDate: Date;
  @Prop({ type: [BusinessClassSchedule], required: true })
  schedule: BusinessClassSchedule[];
  @Prop({ type: String, enum: ["public", "private"], default: "public" })
  visibility: "public" | "private";
  @Prop({
    type: String,
    enum: ["automatic", "requires_approval"],
    default: "automatic",
  })
  enrollmentMode: "automatic" | "requires_approval";
  @Prop({
    type: String,
    enum: ["draft", "active", "paused", "completed", "cancelled"],
    default: "active",
  })
  status: "draft" | "active" | "paused" | "completed" | "cancelled";
  @Prop({ type: Number, min: 0, max: 5, default: 0 }) averageRating: number;
  @Prop({ type: Number, min: 0, default: 0 }) reviewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}
export type BusinessTrainingClassDocument =
  HydratedDocument<BusinessTrainingClass>;
export const BusinessTrainingClassSchema = SchemaFactory.createForClass(
  BusinessTrainingClass,
);
BusinessTrainingClassSchema.index({ clubId: 1, status: 1, startDate: 1 });

@Schema({ collection: "business_class_sessions", timestamps: true })
export class BusinessClassSession {
  @Prop({
    type: Types.ObjectId,
    ref: BusinessTrainingClass.name,
    required: true,
    index: true,
  })
  classId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({ type: Date, required: true }) startsAt: Date;
  @Prop({ type: Date, required: true }) endsAt: Date;
  @Prop({ type: Number, required: true, min: 1 }) capacity: number;
  @Prop({
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled",
  })
  status: "scheduled" | "completed" | "cancelled";
  @Prop({ type: Date, default: null }) reminder24hSentAt: Date | null;
  @Prop({ type: Date, default: null }) reminder2hSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export type BusinessClassSessionDocument =
  HydratedDocument<BusinessClassSession>;
export const BusinessClassSessionSchema =
  SchemaFactory.createForClass(BusinessClassSession);
BusinessClassSessionSchema.index({ classId: 1, startsAt: 1 }, { unique: true });

@Schema({ collection: "business_class_enrollments", timestamps: true })
export class BusinessClassEnrollment {
  @Prop({
    type: Types.ObjectId,
    ref: BusinessTrainingClass.name,
    required: true,
    index: true,
  })
  classId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({
    type: Types.ObjectId,
    ref: "ClubStudent",
    required: true,
    index: true,
  })
  studentId: Types.ObjectId;
  @Prop({
    type: String,
    enum: ["pending", "active", "waitlisted", "cancelled", "completed"],
    default: "active",
  })
  status: "pending" | "active" | "waitlisted" | "cancelled" | "completed";
  @Prop({ type: Number, required: true, min: 0 }) agreedPrice: number;
  @Prop({
    type: String,
    enum: ["pending", "paid", "partial", "waived", "failed", "refunded"],
    default: "pending",
  })
  paymentStatus:
    "pending" | "paid" | "partial" | "waived" | "failed" | "refunded";
  // Legacy balances are never inferred from an old "partial" flag.
  @Prop({ type: String, enum: ["legacy", "ledger"], default: "legacy" })
  billingMode: "legacy" | "ledger";
  @Prop({ type: Number, default: 0, min: 0 }) openingPaidAmount: number;
  @Prop({ type: Number, default: 0, min: 0 }) waivedAmount: number;
  @Prop({ type: Number, default: 0 }) billingRevision: number;
  @Prop({ type: [Object], default: [] }) billingChanges: Array<{
    actorId: string;
    at: Date;
    action: string;
    reason: string;
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  }>;
  @Prop({ type: Date, default: null, index: true })
  paymentExpiresAt: Date | null;
  @Prop({ type: Boolean, default: false }) paymentSeatHeld: boolean;
  @Prop({ type: Number, min: 1, default: null }) totalSessions: number | null;
  @Prop({ type: Number, min: 0, default: null }) remainingSessions:
    number | null;
  @Prop({ type: Date, default: Date.now }) enrolledAt: Date;
  @Prop({ type: Date, default: null, index: true })
  waitlistRequestedAt: Date | null;
  @Prop({ type: Date, default: null }) waitlistOfferExpiresAt: Date | null;
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export type BusinessClassEnrollmentDocument =
  HydratedDocument<BusinessClassEnrollment>;
export const BusinessClassEnrollmentSchema = SchemaFactory.createForClass(
  BusinessClassEnrollment,
);
BusinessClassEnrollmentSchema.index(
  { classId: 1, studentId: 1 },
  { unique: true },
);

@Schema({ collection: "business_class_attendance", timestamps: true })
export class BusinessClassAttendance {
  @Prop({
    type: Types.ObjectId,
    ref: BusinessClassSession.name,
    required: true,
    index: true,
  })
  sessionId: Types.ObjectId;
  @Prop({
    type: Types.ObjectId,
    ref: BusinessTrainingClass.name,
    required: true,
    index: true,
  })
  classId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "ClubStudent", required: true })
  studentId: Types.ObjectId;
  @Prop({
    type: String,
    enum: ["present", "absent", "excused"],
    required: true,
  })
  status: "present" | "absent" | "excused";
  @Prop({ trim: true, maxlength: 500, default: "" }) notes: string;
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  recordedBy: Types.ObjectId;
  @Prop({ type: String, enum: ["manual", "qr", "code"], default: "manual" })
  checkInMethod: "manual" | "qr" | "code";
  @Prop({ type: Date, default: null }) checkedInAt: Date | null;
  @Prop({ type: Date, default: null }) checkedOutAt: Date | null;
  @Prop({ type: [Object], default: [] }) changes: Array<{
    actorId: string;
    at: Date;
    before: string;
    after: string;
    beforeCredits: number | null;
    afterCredits: number | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
export type BusinessClassAttendanceDocument =
  HydratedDocument<BusinessClassAttendance>;
export const BusinessClassAttendanceSchema = SchemaFactory.createForClass(
  BusinessClassAttendance,
);
BusinessClassAttendanceSchema.index(
  { sessionId: 1, studentId: 1 },
  { unique: true },
);

@Schema({ collection: "business_class_checkin_credentials", timestamps: true })
export class BusinessClassCheckInCredential {
  @Prop({
    type: Types.ObjectId,
    ref: BusinessClassSession.name,
    required: true,
    unique: true,
  })
  sessionId: Types.ObjectId;
  @Prop({
    type: Types.ObjectId,
    ref: BusinessTrainingClass.name,
    required: true,
    index: true,
  })
  classId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({ type: String, required: true }) codeHash: string;
  @Prop({ type: String, required: true }) qrHash: string;
  @Prop({ type: Number, default: 0, min: 0 }) attempts: number;
  @Prop({ type: Date, required: true, index: { expires: 0 } }) expiresAt: Date;
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;
  createdAt: Date;
}
export type BusinessClassCheckInCredentialDocument =
  HydratedDocument<BusinessClassCheckInCredential>;
export const BusinessClassCheckInCredentialSchema =
  SchemaFactory.createForClass(BusinessClassCheckInCredential);

@Schema({ collection: "business_calendar_feeds", timestamps: true })
export class BusinessCalendarFeed {
  @Prop({ type: String, enum: ["club", "coach"], required: true })
  scopeType: "club" | "coach";
  @Prop({ type: Types.ObjectId, required: true, index: true })
  scopeId: Types.ObjectId;
  @Prop({ type: String, required: true, unique: true }) tokenHash: string;
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;
  @Prop({ type: Boolean, default: true }) isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type BusinessCalendarFeedDocument =
  HydratedDocument<BusinessCalendarFeed>;
export const BusinessCalendarFeedSchema =
  SchemaFactory.createForClass(BusinessCalendarFeed);
BusinessCalendarFeedSchema.index(
  { scopeType: 1, scopeId: 1, createdBy: 1 },
  { unique: true },
);
