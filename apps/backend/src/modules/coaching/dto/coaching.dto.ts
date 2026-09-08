import { Types } from "mongoose";
import { z } from "zod";

import {
  ATTENDANCE_STATUSES,
  BOOKING_STATUSES,
  CLASS_STATUSES,
  DELIVERY_MODES,
  ENROLLMENT_STATUSES,
  OFFERING_TYPES,
  PAYMENT_STATUSES,
} from "../coaching.constants";

const objectIdSchema = z
  .string()
  .trim()
  .refine((value) => Types.ObjectId.isValid(value), "Invalid ObjectId");
const uniqueIds = (maximum = 100) =>
  z
    .array(objectIdSchema)
    .max(maximum)
    .refine((items) => new Set(items).size === items.length, "Duplicate ids");
const dateSchema = z.coerce.date();
const timezoneSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .refine(isValidTimezone, "Invalid IANA timezone");
const currencySchema = z
  .string()
  .trim()
  .min(3)
  .max(8)
  .toUpperCase()
  .default("IRR");
const moneySchema = z.object({
  amount: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  currency: currencySchema,
});
const geoSchema = z.object({
  countryId: objectIdSchema.optional(),
  provinceId: objectIdSchema.optional(),
  cityId: objectIdSchema.optional(),
  districtId: objectIdSchema.optional(),
  cityRegionIds: uniqueIds(30).default([]),
});
const venueSchema = z
  .object({
    clubId: objectIdSchema.optional(),
    courtId: objectIdSchema.optional(),
    address: z.string().trim().min(3).max(500).optional(),
    onlineUrl: z.url().max(1000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Venue cannot be empty");
const coachAssignmentSchema = z.object({
  coachId: objectIdSchema,
  role: z.enum(["primary", "assistant"]).default("primary"),
});
const customAttributesSchema = z.record(z.string().max(100), z.unknown());
const faqSchema = z.object({
  question: z.string().trim().min(2).max(240),
  answer: z.string().trim().min(2).max(2000),
});

import {
  CoachProfessionalProfileSchema,
  type CoachProfessionalProfile,
} from "./professional-profile";

const CoachProfileInputSchema = z
  .object({
    professionalProfile: CoachProfessionalProfileSchema,
    displayName: z.string().trim().min(2).max(120),
    shortBio: z.string().trim().max(300),
    bio: z.string().trim().max(5000),
    avatarMediaId: objectIdSchema.nullable(),
    coverMediaId: objectIdSchema.nullable(),
    galleryMediaIds: uniqueIds(30),
    specialties: z
      .array(
        z.object({
          title: z.string().trim().min(2).max(120),
          description: z.string().trim().min(2).max(1000),
          icon: z.string().trim().max(60).optional(),
        }),
      )
      .max(20),
    trainingStyles: z
      .array(
        z.object({
          title: z.string().trim().min(2).max(120),
          description: z.string().trim().min(2).max(1000),
          imageMediaId: objectIdSchema.optional(),
        }),
      )
      .max(20),
    experienceSummary: z.string().trim().max(1500),
    experience: z
      .array(
        z.object({
          title: z.string().trim().min(2).max(160),
          organization: z.string().trim().max(160).optional(),
          period: z.string().trim().max(100).optional(),
          description: z.string().trim().max(1000).optional(),
        }),
      )
      .max(30),
    faqs: z.array(faqSchema).max(30),
    experienceYears: z.number().int().min(0).max(80),
    languages: z.array(z.string().trim().min(2).max(60)).max(20),
    serviceModes: z.array(z.enum(DELIVERY_MODES)).max(4),
    minAcceptedAge: z.number().int().min(0).max(120).nullable(),
    maxAcceptedAge: z.number().int().min(0).max(120).nullable(),
    geo: geoSchema.nullable(),
    travelRadiusKm: z.number().int().min(0).max(1000),
    contact: customAttributesSchema,
  })
  .partial()
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  )
  .refine(
    (value) =>
      value.minAcceptedAge == null ||
      value.maxAcceptedAge == null ||
      value.minAcceptedAge <= value.maxAcceptedAge,
    "Minimum age cannot be greater than maximum age",
  );
export type CoachProfileInput = z.infer<typeof CoachProfileInputSchema>;
export class UpdateCoachProfileDto implements CoachProfileInput {
  static schema = CoachProfileInputSchema;
  professionalProfile?: CoachProfessionalProfile;
  displayName?: string;
  shortBio?: string;
  bio?: string;
  avatarMediaId?: string | null;
  coverMediaId?: string | null;
  galleryMediaIds?: string[];
  specialties?: Array<{ title: string; description: string; icon?: string }>;
  trainingStyles?: Array<{
    title: string;
    description: string;
    imageMediaId?: string;
  }>;
  experienceSummary?: string;
  experience?: Array<{
    title: string;
    organization?: string;
    period?: string;
    description?: string;
  }>;
  faqs?: Array<{ question: string; answer: string }>;
  experienceYears?: number;
  languages?: string[];
  serviceModes?: Array<(typeof DELIVERY_MODES)[number]>;
  minAcceptedAge?: number | null;
  maxAcceptedAge?: number | null;
  geo?: z.infer<typeof geoSchema> | null;
  travelRadiusKm?: number;
  contact?: Record<string, unknown>;
}

const CoachSportInputSchema = z.object({
  sportId: objectIdSchema,
  specialtyIds: uniqueIds(30).default([]),
  skillLevelId: objectIdSchema.nullable().optional(),
  experienceYears: z.number().int().min(0).max(80).default(0),
  certificateMediaIds: uniqueIds(30).default([]),
  achievements: z.array(z.string().trim().min(2).max(300)).max(50).default([]),
  customAttributes: customAttributesSchema.default({}),
});
const ReplaceCoachSportsSchema = z
  .object({
    items: z.array(CoachSportInputSchema).max(30),
  })
  .strict()
  .refine(
    ({ items }) =>
      new Set(items.map((item) => item.sportId)).size === items.length,
    "Duplicate sports",
  );
export type CoachSportInput = z.infer<typeof CoachSportInputSchema>;
export class ReplaceCoachSportsDto {
  static schema = ReplaceCoachSportsSchema;
  items: CoachSportInput[];
}

const offeringShape = {
  sportId: objectIdSchema,
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().max(4000),
  type: z.enum(OFFERING_TYPES),
  deliveryModes: z.array(z.enum(DELIVERY_MODES)).min(1).max(4),
  durationMinutes: z.number().int().min(15).max(480),
  capacity: z.number().int().min(1).max(10_000),
  minAge: z.number().int().min(0).max(120).nullable(),
  maxAge: z.number().int().min(0).max(120).nullable(),
  skillLevelId: objectIdSchema.nullable(),
  price: moneySchema,
  pricingType: z.enum(["per_session", "package", "per_month"]),
  sessionCount: z.number().int().min(1).max(1000).nullable(),
  venueClubIds: uniqueIds(30),
  requiredEquipmentText: z.string().trim().max(2000),
  cancellationPolicy: customAttributesSchema,
  coverMediaId: objectIdSchema.nullable(),
};
const OfferingInputSchema = z
  .object({
    ...offeringShape,
    description: offeringShape.description.default(""),
    minAge: offeringShape.minAge.optional(),
    maxAge: offeringShape.maxAge.optional(),
    skillLevelId: offeringShape.skillLevelId.optional(),
    sessionCount: offeringShape.sessionCount.optional(),
    venueClubIds: offeringShape.venueClubIds.default([]),
    requiredEquipmentText: offeringShape.requiredEquipmentText.default(""),
    cancellationPolicy: offeringShape.cancellationPolicy.default({}),
    coverMediaId: offeringShape.coverMediaId.optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.minAge == null ||
      value.maxAge == null ||
      value.minAge <= value.maxAge,
    "Minimum age cannot be greater than maximum age",
  )
  .refine(
    (value) => value.pricingType !== "package" || value.sessionCount != null,
    "Package offerings require a session count",
  );
export type OfferingInput = z.infer<typeof OfferingInputSchema>;
export class CreateOfferingDto implements OfferingInput {
  static schema = OfferingInputSchema;
  sportId: string;
  title: string;
  description: string;
  type: (typeof OFFERING_TYPES)[number];
  deliveryModes: Array<(typeof DELIVERY_MODES)[number]>;
  durationMinutes: number;
  capacity: number;
  minAge?: number | null;
  maxAge?: number | null;
  skillLevelId?: string | null;
  price: { amount: number; currency: string };
  pricingType: "per_session" | "package" | "per_month";
  sessionCount?: number | null;
  venueClubIds: string[];
  requiredEquipmentText: string;
  cancellationPolicy: Record<string, unknown>;
  coverMediaId?: string | null;
}
const UpdateOfferingSchema = z
  .object(offeringShape)
  .partial()
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );
export class UpdateOfferingDto implements Partial<OfferingInput> {
  static schema = UpdateOfferingSchema;
  sportId?: string;
  title?: string;
  description?: string;
  type?: (typeof OFFERING_TYPES)[number];
  deliveryModes?: Array<(typeof DELIVERY_MODES)[number]>;
  durationMinutes?: number;
  capacity?: number;
  minAge?: number | null;
  maxAge?: number | null;
  skillLevelId?: string | null;
  price?: { amount: number; currency: string };
  pricingType?: "per_session" | "package" | "per_month";
  sessionCount?: number | null;
  venueClubIds?: string[];
  requiredEquipmentText?: string;
  cancellationPolicy?: Record<string, unknown>;
  coverMediaId?: string | null;
}
const OfferingStatusSchema = z
  .object({ status: z.enum(["published", "archived"]) })
  .strict();
export class UpdateOfferingStatusDto {
  static schema = OfferingStatusSchema;
  status: "published" | "archived";
}

const classShape = {
  offeringId: objectIdSchema.nullable(),
  clubId: objectIdSchema.nullable(),
  courtId: objectIdSchema.nullable(),
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().max(5000),
  sportId: objectIdSchema,
  coachAssignments: z.array(coachAssignmentSchema).max(20),
  deliveryMode: z.enum(DELIVERY_MODES),
  venue: venueSchema.nullable(),
  skillLevelId: objectIdSchema.nullable(),
  minAge: z.number().int().min(0).max(120).nullable(),
  maxAge: z.number().int().min(0).max(120).nullable(),
  capacity: z.number().int().min(1).max(10_000),
  registrationStartAt: dateSchema.nullable(),
  registrationEndAt: dateSchema.nullable(),
  courseStartAt: dateSchema,
  courseEndAt: dateSchema,
  plannedSessionCount: z.number().int().min(1).max(1000).nullable(),
  price: moneySchema,
  enrollmentMode: z.enum(["automatic", "requires_approval"]),
  coverMediaId: objectIdSchema.nullable(),
  galleryMediaIds: uniqueIds(30),
  tags: z.array(z.string().trim().min(1).max(50)).max(30),
  prerequisites: z.array(z.string().trim().min(2).max(300)).max(50),
  faqs: z.array(faqSchema).max(30),
  requiredEquipmentIds: uniqueIds(100),
  amenityIds: uniqueIds(100),
  cancellationPolicy: customAttributesSchema.nullable(),
};
const ClassInputSchema = z
  .object({
    ...classShape,
    offeringId: classShape.offeringId.optional(),
    clubId: classShape.clubId.optional(),
    courtId: classShape.courtId.optional(),
    description: classShape.description.default(""),
    coachAssignments: classShape.coachAssignments.default([]),
    venue: classShape.venue.optional(),
    skillLevelId: classShape.skillLevelId.optional(),
    minAge: classShape.minAge.optional(),
    maxAge: classShape.maxAge.optional(),
    registrationStartAt: classShape.registrationStartAt.optional(),
    registrationEndAt: classShape.registrationEndAt.optional(),
    plannedSessionCount: classShape.plannedSessionCount.optional(),
    enrollmentMode: classShape.enrollmentMode.default("automatic"),
    coverMediaId: classShape.coverMediaId.optional(),
    galleryMediaIds: classShape.galleryMediaIds.default([]),
    tags: classShape.tags.default([]),
    prerequisites: classShape.prerequisites.default([]),
    faqs: classShape.faqs.default([]),
    requiredEquipmentIds: classShape.requiredEquipmentIds.default([]),
    amenityIds: classShape.amenityIds.default([]),
    cancellationPolicy: classShape.cancellationPolicy.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.courseStartAt >= value.courseEndAt) {
      context.addIssue({
        code: "custom",
        path: ["courseEndAt"],
        message: "Course end must be after start",
      });
    }
    if (
      value.registrationStartAt &&
      value.registrationEndAt &&
      value.registrationStartAt >= value.registrationEndAt
    ) {
      context.addIssue({
        code: "custom",
        path: ["registrationEndAt"],
        message: "Registration end must be after start",
      });
    }
    if (
      value.registrationEndAt &&
      value.registrationEndAt > value.courseEndAt
    ) {
      context.addIssue({
        code: "custom",
        path: ["registrationEndAt"],
        message: "Registration cannot end after the course",
      });
    }
    if (
      value.minAge != null &&
      value.maxAge != null &&
      value.minAge > value.maxAge
    ) {
      context.addIssue({
        code: "custom",
        path: ["maxAge"],
        message: "Maximum age must be at least minimum age",
      });
    }
  });
export type ClassInput = z.infer<typeof ClassInputSchema>;
export class CreateClassDto implements ClassInput {
  static schema = ClassInputSchema;
  offeringId?: string | null;
  clubId?: string | null;
  courtId?: string | null;
  title: string;
  description: string;
  sportId: string;
  coachAssignments: Array<{ coachId: string; role: "primary" | "assistant" }>;
  deliveryMode: (typeof DELIVERY_MODES)[number];
  venue?: z.infer<typeof venueSchema> | null;
  skillLevelId?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
  capacity: number;
  registrationStartAt?: Date | null;
  registrationEndAt?: Date | null;
  courseStartAt: Date;
  courseEndAt: Date;
  plannedSessionCount?: number | null;
  price: { amount: number; currency: string };
  enrollmentMode: "automatic" | "requires_approval";
  coverMediaId?: string | null;
  galleryMediaIds: string[];
  tags: string[];
  prerequisites: string[];
  faqs: Array<{ question: string; answer: string }>;
  requiredEquipmentIds: string[];
  amenityIds: string[];
  cancellationPolicy?: Record<string, unknown> | null;
}
const UpdateClassSchema = z
  .object(classShape)
  .partial()
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );
export class UpdateClassDto implements Partial<ClassInput> {
  static schema = UpdateClassSchema;
  offeringId?: string | null;
  clubId?: string | null;
  courtId?: string | null;
  title?: string;
  description?: string;
  sportId?: string;
  coachAssignments?: Array<{ coachId: string; role: "primary" | "assistant" }>;
  deliveryMode?: (typeof DELIVERY_MODES)[number];
  venue?: z.infer<typeof venueSchema> | null;
  skillLevelId?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
  capacity?: number;
  registrationStartAt?: Date | null;
  registrationEndAt?: Date | null;
  courseStartAt?: Date;
  courseEndAt?: Date;
  plannedSessionCount?: number | null;
  price?: { amount: number; currency: string };
  enrollmentMode?: "automatic" | "requires_approval";
  coverMediaId?: string | null;
  galleryMediaIds?: string[];
  tags?: string[];
  prerequisites?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  requiredEquipmentIds?: string[];
  amenityIds?: string[];
  cancellationPolicy?: Record<string, unknown> | null;
}
const ClassStatusSchema = z.object({ status: z.enum(CLASS_STATUSES) }).strict();
export class UpdateClassStatusDto {
  static schema = ClassStatusSchema;
  status: (typeof CLASS_STATUSES)[number];
}

const ReviewClubClassSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
  })
  .strict();
export class ReviewClubClassDto {
  static schema = ReviewClubClassSchema;
  status: "approved" | "rejected";
}

const ScheduleInputSchema = z
  .object({
    timezone: timezoneSchema.default("Asia/Tehran"),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7),
    startMinute: z.number().int().min(0).max(1439),
    durationMinutes: z.number().int().min(15).max(480),
    startDate: dateSchema,
    endDate: dateSchema,
    repeatEveryWeeks: z.number().int().min(1).max(52).default(1),
    venue: venueSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (value) => new Set(value.daysOfWeek).size === value.daysOfWeek.length,
    "Duplicate week days",
  )
  .refine(
    (value) => value.startDate <= value.endDate,
    "Schedule end must be after start",
  )
  .refine(
    (value) =>
      (value.endDate.getTime() - value.startDate.getTime()) / 86_400_000 <= 730,
    "A schedule cannot span more than two years",
  );
export type ScheduleInput = z.infer<typeof ScheduleInputSchema>;
export class GenerateScheduleDto implements ScheduleInput {
  static schema = ScheduleInputSchema;
  timezone: string;
  daysOfWeek: number[];
  startMinute: number;
  durationMinutes: number;
  startDate: Date;
  endDate: Date;
  repeatEveryWeeks: number;
  venue?: z.infer<typeof venueSchema> | null;
}

const SessionInputSchema = z
  .object({
    offeringId: objectIdSchema.nullable().optional(),
    sportId: objectIdSchema,
    title: z.string().trim().min(2).max(140),
    startAt: dateSchema,
    endAt: dateSchema,
    timezone: timezoneSchema.default("Asia/Tehran"),
    deliveryMode: z.enum(DELIVERY_MODES),
    venue: venueSchema.nullable().optional(),
    capacity: z.number().int().min(1).max(10_000),
    publicNotes: z.string().trim().max(3000).optional(),
    coachPrivateNotes: z.string().trim().max(5000).optional(),
  })
  .strict()
  .refine(
    (value) => value.startAt < value.endAt,
    "Session end must be after start",
  );
export type SessionInput = z.infer<typeof SessionInputSchema>;
export class CreateSessionDto implements SessionInput {
  static schema = SessionInputSchema;
  offeringId?: string | null;
  sportId: string;
  title: string;
  startAt: Date;
  endAt: Date;
  timezone: string;
  deliveryMode: (typeof DELIVERY_MODES)[number];
  venue?: z.infer<typeof venueSchema> | null;
  capacity: number;
  publicNotes?: string;
  coachPrivateNotes?: string;
}
const RescheduleSessionSchema = z
  .object({ startAt: dateSchema, endAt: dateSchema })
  .strict()
  .refine(
    (value) => value.startAt < value.endAt,
    "Session end must be after start",
  );
export class RescheduleSessionDto {
  static schema = RescheduleSessionSchema;
  startAt: Date;
  endAt: Date;
}
const CancelSessionSchema = z
  .object({ reason: z.string().trim().min(2).max(1000) })
  .strict();
export class CancelSessionDto {
  static schema = CancelSessionSchema;
  reason: string;
}

const RescheduleCoachBookingSchema = z
  .object({
    sessionId: objectIdSchema,
    idempotencyKey: z.string().trim().min(8).max(120),
  })
  .strict();
export class RescheduleCoachBookingDto {
  static schema = RescheduleCoachBookingSchema;
  sessionId: string;
  idempotencyKey: string;
}

const CreateEnrollmentSchema = z.object({ athleteId: objectIdSchema }).strict();
export class CreateEnrollmentDto {
  static schema = CreateEnrollmentSchema;
  athleteId: string;
}
const EnrollmentStatusSchema = z
  .object({
    status: z.enum(ENROLLMENT_STATUSES),
  })
  .strict();
export class UpdateEnrollmentStatusDto {
  static schema = EnrollmentStatusSchema;
  status: (typeof ENROLLMENT_STATUSES)[number];
}

const BookingStatusSchema = z
  .object({
    status: z.enum(BOOKING_STATUSES),
    reason: z.string().trim().max(1000).optional(),
  })
  .strict();
export class UpdateBookingStatusDto {
  static schema = BookingStatusSchema;
  status: (typeof BOOKING_STATUSES)[number];
  reason?: string;
}

const AttendanceItemSchema = z.object({
  athleteId: objectIdSchema,
  status: z.enum(ATTENDANCE_STATUSES),
  note: z.string().trim().max(1000).optional(),
});
const BulkAttendanceSchema = z
  .object({ items: z.array(AttendanceItemSchema).max(10_000) })
  .strict()
  .refine(
    ({ items }) =>
      new Set(items.map((item) => item.athleteId)).size === items.length,
    "Duplicate athletes",
  );
export class BulkAttendanceDto {
  static schema = BulkAttendanceSchema;
  items: Array<z.infer<typeof AttendanceItemSchema>>;
}

const AvailabilityRuleSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
    deliveryModes: z.array(z.enum(DELIVERY_MODES)).min(1).max(4),
    clubId: objectIdSchema.nullable().optional(),
    validFrom: dateSchema,
    validUntil: dateSchema.nullable().optional(),
  })
  .refine(
    (value) => value.startMinute < value.endMinute,
    "Availability end must be after start",
  )
  .refine(
    (value) => value.validUntil == null || value.validFrom <= value.validUntil,
    "Availability validity end must be after start",
  );
const ReplaceAvailabilitySchema = z
  .object({ rules: z.array(AvailabilityRuleSchema).max(100) })
  .strict();
export class ReplaceAvailabilityDto {
  static schema = ReplaceAvailabilitySchema;
  rules: Array<z.infer<typeof AvailabilityRuleSchema>>;
}
const AvailabilityExceptionSchema = z
  .object({
    date: dateSchema,
    type: z.enum(["unavailable", "custom_available"]),
    startMinute: z.number().int().min(0).max(1439).optional(),
    endMinute: z.number().int().min(1).max(1440).optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.type === "custom_available" &&
      (value.startMinute == null || value.endMinute == null)
    ) {
      context.addIssue({
        code: "custom",
        message: "Custom availability requires start and end minutes",
      });
    }
    if (
      value.startMinute != null &&
      value.endMinute != null &&
      value.startMinute >= value.endMinute
    ) {
      context.addIssue({
        code: "custom",
        message: "Exception end must be after start",
      });
    }
  });
export class CreateAvailabilityExceptionDto {
  static schema = AvailabilityExceptionSchema;
  date: Date;
  type: "unavailable" | "custom_available";
  startMinute?: number;
  endMinute?: number;
  reason?: string;
}

const ReviewCoachSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    reason: z.string().trim().min(2).max(1000).optional(),
  })
  .strict()
  .refine(
    (value) => value.status !== "rejected" || Boolean(value.reason),
    "A rejection reason is required",
  );
export class ReviewCoachDto {
  static schema = ReviewCoachSchema;
  status: "approved" | "rejected";
  reason?: string;
}

function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
