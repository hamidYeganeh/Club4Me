import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

import {
  ATTENDANCE_STATUSES,
  BOOKING_STATUSES,
  CLASS_STATUSES,
  COACH_REVIEW_STATUSES,
  COACH_VISIBILITIES,
  DELIVERY_MODES,
  ENROLLMENT_STATUSES,
  OFFERING_STATUSES,
  OFFERING_TYPES,
  PAYMENT_STATUSES,
  SESSION_STATUSES,
  type AttendanceStatus,
  type BookingStatus,
  type CoachReviewStatus,
  type CoachVisibility,
  type DeliveryMode,
  type EnrollmentStatus,
  type OfferingStatus,
  type OfferingType,
  type PaymentStatus,
  type TrainingClassStatus,
  type TrainingSessionStatus,
} from "../coaching.constants";

@Schema({ _id: false })
export class CoachGeo {
  @Prop({ type: Types.ObjectId }) countryId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId }) provinceId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId }) cityId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId }) districtId?: Types.ObjectId;
  @Prop({ type: [Types.ObjectId], default: [] })
  cityRegionIds: Types.ObjectId[];
}

@Schema({ collection: "coaches", timestamps: true })
export class Coach {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true })
  userId: Types.ObjectId;
  @Prop({ required: true, unique: true }) slug: string;
  @Prop({ trim: true, maxlength: 120, default: "" }) displayName: string;
  @Prop({ trim: true, maxlength: 300, default: "" }) shortBio: string;
  @Prop({ trim: true, maxlength: 5000, default: "" }) bio: string;
  @Prop({ type: Types.ObjectId, ref: "Media" }) avatarMediaId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Media" }) coverMediaId?: Types.ObjectId;
  @Prop({ type: [Types.ObjectId], ref: "Media", default: [] })
  galleryMediaIds: Types.ObjectId[];
  @Prop({
    type: [{ title: String, description: String, icon: String }],
    default: [],
    _id: false,
  })
  specialties: Array<{ title: string; description: string; icon?: string }>;
  @Prop({
    type: [{ title: String, description: String, imageMediaId: Types.ObjectId }],
    default: [],
    _id: false,
  })
  trainingStyles: Array<{
    title: string;
    description: string;
    imageMediaId?: Types.ObjectId;
  }>;
  @Prop({ trim: true, maxlength: 1500, default: "" })
  experienceSummary: string;
  @Prop({
    type: [
      {
        title: String,
        organization: String,
        period: String,
        description: String,
      },
    ],
    default: [],
    _id: false,
  })
  experience: Array<{
    title: string;
    organization?: string;
    period?: string;
    description?: string;
  }>;
  @Prop({
    type: [{ question: String, answer: String }],
    default: [],
    _id: false,
  })
  faqs: Array<{ question: string; answer: string }>;
  @Prop({ min: 0, max: 80, default: 0 }) experienceYears: number;
  @Prop({ type: [String], default: [] }) languages: string[];
  @Prop({ type: [String], enum: DELIVERY_MODES, default: [] })
  serviceModes: DeliveryMode[];
  @Prop({ type: Number, min: 0, max: 120 }) minAcceptedAge?: number;
  @Prop({ type: Number, min: 0, max: 120 }) maxAcceptedAge?: number;
  @Prop({ type: CoachGeo }) geo?: CoachGeo;
  @Prop({ min: 0, max: 1000, default: 0 }) travelRadiusKm: number;
  @Prop({ type: SchemaTypes.Mixed, default: {} }) contact: Record<
    string,
    unknown
  >;
  @Prop({ type: String, enum: COACH_REVIEW_STATUSES, default: "draft" })
  reviewStatus: CoachReviewStatus;
  @Prop({ type: String, enum: COACH_VISIBILITIES, default: "hidden" })
  visibility: CoachVisibility;
  @Prop({ type: String, trim: true, maxlength: 1000, default: null })
  rejectionReason: string | null;
  @Prop({ min: 0, max: 5, default: 0 }) averageRating: number;
  @Prop({ min: 0, default: 0 }) reviewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}
export type CoachDocument = HydratedDocument<Coach>;
export const CoachSchema = SchemaFactory.createForClass(Coach);
CoachSchema.index({ reviewStatus: 1, visibility: 1, "geo.cityId": 1 });

@Schema({ collection: "coach_sports", timestamps: true })
export class CoachSport {
  @Prop({ type: Types.ObjectId, ref: Coach.name, required: true })
  coachId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true }) sportId: Types.ObjectId;
  @Prop({ type: [Types.ObjectId], default: [] }) specialtyIds: Types.ObjectId[];
  @Prop({ type: Types.ObjectId }) skillLevelId?: Types.ObjectId;
  @Prop({ min: 0, max: 80, default: 0 }) experienceYears: number;
  @Prop({ type: [Types.ObjectId], ref: "Media", default: [] })
  certificateMediaIds: Types.ObjectId[];
  @Prop({ type: [String], default: [] }) achievements: string[];
  @Prop({ type: SchemaTypes.Mixed, default: {} }) customAttributes: Record<
    string,
    unknown
  >;
  @Prop({
    type: String,
    enum: ["unverified", "pending", "verified", "rejected"],
    default: "unverified",
  })
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}
export type CoachSportDocument = HydratedDocument<CoachSport>;
export const CoachSportSchema = SchemaFactory.createForClass(CoachSport);
CoachSportSchema.index({ coachId: 1, sportId: 1 }, { unique: true });
CoachSportSchema.index({ sportId: 1, verificationStatus: 1 });

@Schema({ _id: false })
export class MoneySnapshot {
  @Prop({ type: Number, min: 0, required: true }) amount: number;
  @Prop({ trim: true, uppercase: true, default: "IRR" }) currency: string;
}

@Schema({ collection: "coach_services", timestamps: true })
export class CoachOffering {
  @Prop({ type: Types.ObjectId, ref: Coach.name, required: true })
  coachId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true }) sportId: Types.ObjectId;
  @Prop({ required: true, trim: true, maxlength: 140 }) title: string;
  @Prop({ required: true, select: false }) normalizedTitle: string;
  @Prop({ trim: true, maxlength: 4000, default: "" }) description: string;
  @Prop({ type: String, enum: OFFERING_TYPES, required: true })
  type: OfferingType;
  @Prop({ type: [String], enum: DELIVERY_MODES, required: true })
  deliveryModes: DeliveryMode[];
  @Prop({ min: 15, max: 480, required: true }) durationMinutes: number;
  @Prop({ min: 1, max: 10000, required: true }) capacity: number;
  @Prop({ type: Number, min: 0, max: 120 }) minAge?: number;
  @Prop({ type: Number, min: 0, max: 120 }) maxAge?: number;
  @Prop({ type: Types.ObjectId }) skillLevelId?: Types.ObjectId;
  @Prop({ type: MoneySnapshot, required: true }) price: MoneySnapshot;
  @Prop({
    type: String,
    enum: ["per_session", "package", "per_month"],
    required: true,
  })
  pricingType: "per_session" | "package" | "per_month";
  @Prop({ type: Number, min: 1, max: 1000 }) sessionCount?: number;
  @Prop({ type: [Types.ObjectId], ref: "Club", default: [] })
  venueClubIds: Types.ObjectId[];
  @Prop({ trim: true, maxlength: 2000, default: "" })
  requiredEquipmentText: string;
  @Prop({ type: SchemaTypes.Mixed, default: {} }) cancellationPolicy: Record<
    string,
    unknown
  >;
  @Prop({ type: Types.ObjectId, ref: "Media" }) coverMediaId?: Types.ObjectId;
  @Prop({ type: String, enum: OFFERING_STATUSES, default: "draft" })
  status: OfferingStatus;
  createdAt: Date;
  updatedAt: Date;
}
export type CoachOfferingDocument = HydratedDocument<CoachOffering>;
export const CoachOfferingSchema = SchemaFactory.createForClass(CoachOffering);
CoachOfferingSchema.index({ coachId: 1, status: 1, updatedAt: -1 });
CoachOfferingSchema.index({ status: 1, sportId: 1, type: 1 });

@Schema({ _id: false })
export class CoachAssignment {
  @Prop({ type: Types.ObjectId, ref: Coach.name, required: true })
  coachId: Types.ObjectId;
  @Prop({ type: String, enum: ["primary", "assistant"], default: "primary" })
  role: "primary" | "assistant";
}

@Schema({ _id: false })
export class SessionVenue {
  @Prop({ type: Types.ObjectId, ref: "Club" }) clubId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Court" }) courtId?: Types.ObjectId;
  @Prop({ type: String, trim: true, maxlength: 500 }) address?: string;
  @Prop({ type: String, trim: true, maxlength: 1000 }) onlineUrl?: string;
}

@Schema({ collection: "classes", timestamps: true })
export class TrainingClass {
  @Prop({ type: Types.ObjectId, ref: Coach.name, required: true })
  ownerCoachId: Types.ObjectId;
  @Prop({
    type: [{ question: String, answer: String }],
    default: [],
    _id: false,
  })
  faqs: Array<{ question: string; answer: string }>;
  @Prop({ type: Types.ObjectId, ref: CoachOffering.name })
  offeringId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Club" }) clubId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "Court" }) courtId?: Types.ObjectId;
  @Prop({ required: true, trim: true, maxlength: 140 }) title: string;
  @Prop({ required: true, select: false }) normalizedTitle: string;
  @Prop({ required: true, unique: true }) slug: string;
  @Prop({ trim: true, maxlength: 5000, default: "" }) description: string;
  @Prop({ type: Types.ObjectId, required: true }) sportId: Types.ObjectId;
  @Prop({ type: [CoachAssignment], default: [] })
  coachAssignments: CoachAssignment[];
  @Prop({ type: String, enum: DELIVERY_MODES, required: true })
  deliveryMode: DeliveryMode;
  @Prop({ type: SessionVenue }) venue?: SessionVenue;
  @Prop({ type: Types.ObjectId }) skillLevelId?: Types.ObjectId;
  @Prop({ type: Number, min: 0, max: 120 }) minAge?: number;
  @Prop({ type: Number, min: 0, max: 120 }) maxAge?: number;
  @Prop({ min: 1, max: 10000, required: true }) capacity: number;
  @Prop({ min: 0, default: 0 }) enrollmentCount: number;
  @Prop({ type: Date }) registrationStartAt?: Date;
  @Prop({ type: Date }) registrationEndAt?: Date;
  @Prop({ type: Date, required: true }) courseStartAt: Date;
  @Prop({ type: Date, required: true }) courseEndAt: Date;
  @Prop({ type: Number, min: 1, max: 1000 }) plannedSessionCount?: number;
  @Prop({ type: MoneySnapshot, required: true }) price: MoneySnapshot;
  @Prop({
    type: String,
    enum: ["automatic", "requires_approval"],
    default: "automatic",
  })
  enrollmentMode: "automatic" | "requires_approval";
  @Prop({ type: Types.ObjectId, ref: "Media" }) coverMediaId?: Types.ObjectId;
  @Prop({ type: [Types.ObjectId], ref: "Media", default: [] })
  galleryMediaIds: Types.ObjectId[];
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop({ type: [String], default: [] }) prerequisites: string[];
  @Prop({ type: [Types.ObjectId], default: [] })
  requiredEquipmentIds: Types.ObjectId[];
  @Prop({ type: [Types.ObjectId], default: [] }) amenityIds: Types.ObjectId[];
  @Prop({ type: SchemaTypes.Mixed, default: null })
  cancellationPolicy: Record<string, unknown> | null;
  @Prop({
    type: String,
    enum: ["not_required", "pending", "approved", "rejected"],
    default: "not_required",
  })
  clubApprovalStatus: "not_required" | "pending" | "approved" | "rejected";
  @Prop({ type: String, enum: CLASS_STATUSES, default: "draft" })
  status: TrainingClassStatus;
  createdAt: Date;
  updatedAt: Date;
}
export type TrainingClassDocument = HydratedDocument<TrainingClass>;
export const TrainingClassSchema = SchemaFactory.createForClass(TrainingClass);
TrainingClassSchema.index({ ownerCoachId: 1, status: 1, updatedAt: -1 });
TrainingClassSchema.index({ status: 1, sportId: 1, courseStartAt: 1 });
TrainingClassSchema.index({ "coachAssignments.coachId": 1, status: 1 });
TrainingClassSchema.index({ clubId: 1, clubApprovalStatus: 1, updatedAt: -1 });

@Schema({ collection: "class_sessions", timestamps: true })
export class TrainingSession {
  @Prop({ type: Types.ObjectId, ref: TrainingClass.name })
  classId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: CoachOffering.name })
  offeringId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "ReservableSession" })
  reservableSessionId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: Coach.name, required: true })
  ownerCoachId: Types.ObjectId;
  @Prop({ type: [CoachAssignment], default: [] })
  coachAssignments: CoachAssignment[];
  @Prop({ type: Types.ObjectId, required: true }) sportId: Types.ObjectId;
  @Prop({ required: true, trim: true, maxlength: 140 }) title: string;
  @Prop({ type: Date, required: true }) startAt: Date;
  @Prop({ type: Date, required: true }) endAt: Date;
  @Prop({ required: true, default: "Asia/Tehran" }) timezone: string;
  @Prop({ type: String, enum: DELIVERY_MODES, required: true })
  deliveryMode: DeliveryMode;
  @Prop({ type: SessionVenue }) venue?: SessionVenue;
  @Prop({ min: 1, max: 10000, required: true }) capacity: number;
  @Prop({ min: 0, default: 0 }) bookedCount: number;
  @Prop({ type: String, enum: SESSION_STATUSES, default: "scheduled" })
  status: TrainingSessionStatus;
  @Prop({ type: String, trim: true, maxlength: 1000 })
  cancellationReason?: string;
  @Prop({ type: String, trim: true, maxlength: 3000 }) publicNotes?: string;
  @Prop({ type: String, trim: true, maxlength: 5000 })
  coachPrivateNotes?: string;
  @Prop({ type: Types.ObjectId }) generatedByScheduleRuleId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export type TrainingSessionDocument = HydratedDocument<TrainingSession>;
export const TrainingSessionSchema =
  SchemaFactory.createForClass(TrainingSession);
TrainingSessionSchema.index({ ownerCoachId: 1, startAt: 1 });
TrainingSessionSchema.index({
  "coachAssignments.coachId": 1,
  startAt: 1,
  endAt: 1,
});
TrainingSessionSchema.index(
  { classId: 1, startAt: 1 },
  { unique: true, partialFilterExpression: { classId: { $exists: true } } },
);
TrainingSessionSchema.index({ status: 1, sportId: 1, startAt: 1 });

@Schema({ collection: "schedule_rules", timestamps: true })
export class ScheduleRule {
  @Prop({ type: Types.ObjectId, ref: TrainingClass.name, required: true })
  classId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: Coach.name, required: true })
  coachId: Types.ObjectId;
  @Prop({ required: true, default: "Asia/Tehran" }) timezone: string;
  @Prop({ type: [Number], required: true }) daysOfWeek: number[];
  @Prop({ min: 0, max: 1439, required: true }) startMinute: number;
  @Prop({ min: 15, max: 480, required: true }) durationMinutes: number;
  @Prop({ type: Date, required: true }) startDate: Date;
  @Prop({ type: Date, required: true }) endDate: Date;
  @Prop({ min: 1, max: 52, default: 1 }) repeatEveryWeeks: number;
  @Prop({ type: SessionVenue }) venue?: SessionVenue;
  @Prop({ default: true }) isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type ScheduleRuleDocument = HydratedDocument<ScheduleRule>;
export const ScheduleRuleSchema = SchemaFactory.createForClass(ScheduleRule);
ScheduleRuleSchema.index({ classId: 1, isActive: 1 });

@Schema({ collection: "class_enrollments", timestamps: true })
export class ClassEnrollment {
  @Prop({ type: Types.ObjectId, ref: TrainingClass.name, required: true })
  classId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: Coach.name, required: true })
  coachId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  athleteId: Types.ObjectId;
  @Prop({ type: String, enum: ENROLLMENT_STATUSES, default: "pending" })
  status: EnrollmentStatus;
  @Prop({ type: MoneySnapshot, required: true }) priceSnapshot: MoneySnapshot;
  @Prop({ type: String, enum: PAYMENT_STATUSES, default: "not_required" })
  paymentStatus: PaymentStatus;
  @Prop({ type: Number, min: 0, max: 100, default: null })
  refundPercent: number | null;
  @Prop({ type: Number, min: 0, default: null }) refundAmount: number | null;
  @Prop({ type: Date, default: Date.now }) registeredAt: Date;
  @Prop({ type: Date }) cancelledAt?: Date;
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export type ClassEnrollmentDocument = HydratedDocument<ClassEnrollment>;
export const ClassEnrollmentSchema =
  SchemaFactory.createForClass(ClassEnrollment);
ClassEnrollmentSchema.index({ classId: 1, athleteId: 1 }, { unique: true });
ClassEnrollmentSchema.index({ coachId: 1, status: 1, updatedAt: -1 });

@Schema({ collection: "session_bookings", timestamps: true })
export class SessionBooking {
  @Prop({ type: Types.ObjectId, ref: TrainingSession.name, required: true })
  sessionId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: CoachOffering.name })
  offeringId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: Coach.name, required: true })
  coachId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  athleteId: Types.ObjectId;
  @Prop({ type: String, enum: BOOKING_STATUSES, default: "pending" })
  status: BookingStatus;
  @Prop({ type: MoneySnapshot, required: true }) priceSnapshot: MoneySnapshot;
  @Prop({ type: SchemaTypes.Mixed, default: {} })
  cancellationPolicySnapshot: Record<string, unknown>;
  @Prop({ type: String, enum: PAYMENT_STATUSES, default: "not_required" })
  paymentStatus: PaymentStatus;
  @Prop({ type: Number, min: 0, max: 100, default: null })
  refundPercent: number | null;
  @Prop({ type: Number, min: 0, default: null }) refundAmount: number | null;
  @Prop({ type: Date, default: Date.now }) bookedAt: Date;
  @Prop({ type: Date }) cancelledAt?: Date;
  @Prop({ type: String, trim: true, maxlength: 1000 })
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
export type SessionBookingDocument = HydratedDocument<SessionBooking>;
export const SessionBookingSchema =
  SchemaFactory.createForClass(SessionBooking);
SessionBookingSchema.index({ sessionId: 1, athleteId: 1 }, { unique: true });
SessionBookingSchema.index({ coachId: 1, status: 1, bookedAt: -1 });

@Schema({ collection: "session_attendance", timestamps: true })
export class SessionAttendance {
  @Prop({ type: Types.ObjectId, ref: TrainingSession.name, required: true })
  sessionId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: Coach.name, required: true })
  coachId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  athleteId: Types.ObjectId;
  @Prop({ type: String, enum: ["enrollment", "booking"], required: true })
  sourceType: "enrollment" | "booking";
  @Prop({ type: Types.ObjectId, required: true }) sourceId: Types.ObjectId;
  @Prop({ type: String, enum: ATTENDANCE_STATUSES, required: true })
  status: AttendanceStatus;
  @Prop({ type: Date }) checkedInAt?: Date;
  @Prop({ type: String, trim: true, maxlength: 1000 }) note?: string;
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export type SessionAttendanceDocument = HydratedDocument<SessionAttendance>;
export const SessionAttendanceSchema =
  SchemaFactory.createForClass(SessionAttendance);
SessionAttendanceSchema.index({ sessionId: 1, athleteId: 1 }, { unique: true });
SessionAttendanceSchema.index({ coachId: 1, athleteId: 1, updatedAt: -1 });

@Schema({ collection: "coach_availability_rules", timestamps: true })
export class CoachAvailabilityRule {
  @Prop({ type: Types.ObjectId, ref: Coach.name, required: true })
  coachId: Types.ObjectId;
  @Prop({ min: 0, max: 6, required: true }) dayOfWeek: number;
  @Prop({ min: 0, max: 1439, required: true }) startMinute: number;
  @Prop({ min: 1, max: 1440, required: true }) endMinute: number;
  @Prop({ type: [String], enum: DELIVERY_MODES, required: true })
  deliveryModes: DeliveryMode[];
  @Prop({ type: Types.ObjectId, ref: "Club" }) clubId?: Types.ObjectId;
  @Prop({ type: Date, required: true }) validFrom: Date;
  @Prop({ type: Date }) validUntil?: Date;
  @Prop({ default: true }) isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type CoachAvailabilityRuleDocument =
  HydratedDocument<CoachAvailabilityRule>;
export const CoachAvailabilityRuleSchema = SchemaFactory.createForClass(
  CoachAvailabilityRule,
);
CoachAvailabilityRuleSchema.index({ coachId: 1, dayOfWeek: 1, isActive: 1 });

@Schema({ collection: "coach_availability_exceptions", timestamps: true })
export class CoachAvailabilityException {
  @Prop({ type: Types.ObjectId, ref: Coach.name, required: true })
  coachId: Types.ObjectId;
  @Prop({ type: Date, required: true }) date: Date;
  @Prop({
    type: String,
    enum: ["unavailable", "custom_available"],
    required: true,
  })
  type: "unavailable" | "custom_available";
  @Prop({ type: Number, min: 0, max: 1439 }) startMinute?: number;
  @Prop({ type: Number, min: 1, max: 1440 }) endMinute?: number;
  @Prop({ type: String, trim: true, maxlength: 500 }) reason?: string;
  createdAt: Date;
  updatedAt: Date;
}
export type CoachAvailabilityExceptionDocument =
  HydratedDocument<CoachAvailabilityException>;
export const CoachAvailabilityExceptionSchema = SchemaFactory.createForClass(
  CoachAvailabilityException,
);
CoachAvailabilityExceptionSchema.index({ coachId: 1, date: 1 });
