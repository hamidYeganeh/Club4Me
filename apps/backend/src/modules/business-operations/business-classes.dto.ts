import { Types } from "mongoose";
import { z } from "zod";

const objectId = z.string().refine(Types.ObjectId.isValid, "Invalid ObjectId");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const schedule = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.number().int().min(15).max(480),
});
const businessClassFields = z
  .object({
    title: z.string().trim().min(2).max(140),
    description: z.string().trim().max(3000).default(""),
    faqs: z
      .array(
        z.object({
          question: z.string().trim().min(2).max(240),
          answer: z.string().trim().min(2).max(2000),
        }),
      )
      .max(30)
      .default([]),
    sport: z.string().trim().max(120).default(""),
    level: z.string().trim().max(80).default(""),
    model: z.enum(["group", "private", "course", "single", "open"]),
    pricingModel: z.enum(["monthly", "course", "per_session", "package"]),
    price: z.number().finite().min(0),
    currency: z.string().trim().min(3).max(8).default("IRR"),
    packageSessionCount: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .nullable()
      .default(null),
    capacity: z.number().int().min(1).max(1000),
    coachProfileId: objectId.nullable().default(null),
    branchId: objectId.nullable().default(null),
    startDate: date,
    endDate: date,
    schedule: z.array(schedule).min(1).max(20),
    visibility: z.enum(["public", "private"]).default("public"),
    enrollmentMode: z
      .enum(["automatic", "requires_approval"])
      .default("automatic"),
    status: z
      .enum(["draft", "active", "paused", "completed", "cancelled"])
      .default("active"),
  })
  .strict();

function duplicateSchedule(value: {
  schedule?: Array<{ dayOfWeek: number; startTime: string }>;
}) {
  if (!value.schedule) return false;
  const keys = value.schedule.map(
    (entry) => `${entry.dayOfWeek}-${entry.startTime}`,
  );
  return new Set(keys).size !== keys.length;
}

export class CreateBusinessClassDto {
  static schema = businessClassFields.superRefine((value, context) => {
    if (value.startDate > value.endDate)
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must not be before start date",
      });
    if (value.pricingModel === "package" && !value.packageSessionCount)
      context.addIssue({
        code: "custom",
        path: ["packageSessionCount"],
        message: "Package session count is required",
      });
    if (value.model === "private" && value.capacity > 4)
      context.addIssue({
        code: "custom",
        path: ["capacity"],
        message: "Private classes support up to four students",
      });
    if (
      value.model === "single" &&
      (value.startDate !== value.endDate || value.schedule.length !== 1)
    )
      context.addIssue({
        code: "custom",
        path: ["schedule"],
        message: "Single class requires one schedule on one date",
      });
    if (duplicateSchedule(value))
      context.addIssue({
        code: "custom",
        path: ["schedule"],
        message: "Duplicate schedule times are not allowed",
      });
  });
  title: string;
  description: string;
  faqs?: Array<{ question: string; answer: string }>;
  sport: string;
  level: string;
  model: "group" | "private" | "course" | "single" | "open";
  pricingModel: "monthly" | "course" | "per_session" | "package";
  price: number;
  currency: string;
  packageSessionCount: number | null;
  capacity: number;
  coachProfileId: string | null;
  branchId: string | null;
  startDate: string;
  endDate: string;
  schedule: Array<{
    dayOfWeek: number;
    startTime: string;
    durationMinutes: number;
  }>;
  visibility?: "public" | "private";
  enrollmentMode?: "automatic" | "requires_approval";
  status: "draft" | "active" | "paused" | "completed" | "cancelled";
}

export class UpdateBusinessClassDto {
  static schema = businessClassFields
    .partial()
    .strict()
    .superRefine((value, context) => {
      if (value.startDate && value.endDate && value.startDate > value.endDate)
        context.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "End date must not be before start date",
        });
      if (value.model === "private" && value.capacity && value.capacity > 4)
        context.addIssue({
          code: "custom",
          path: ["capacity"],
          message: "Private classes support up to four students",
        });
      if (duplicateSchedule(value))
        context.addIssue({
          code: "custom",
          path: ["schedule"],
          message: "Duplicate schedule times are not allowed",
        });
    });
  title?: string;
  description?: string;
  faqs?: Array<{ question: string; answer: string }>;
  sport?: string;
  level?: string;
  model?: CreateBusinessClassDto["model"];
  pricingModel?: CreateBusinessClassDto["pricingModel"];
  price?: number;
  currency?: string;
  packageSessionCount?: number | null;
  capacity?: number;
  coachProfileId?: string | null;
  branchId?: string | null;
  startDate?: string;
  endDate?: string;
  schedule?: CreateBusinessClassDto["schedule"];
  visibility?: CreateBusinessClassDto["visibility"];
  enrollmentMode?: CreateBusinessClassDto["enrollmentMode"];
  status?: CreateBusinessClassDto["status"];
}

export class CreateClassEnrollmentDto {
  static schema = z
    .object({
      studentId: objectId,
      status: z.enum(["active", "waitlisted"]).default("active"),
      agreedPrice: z.number().finite().min(0),
      paymentStatus: z
        .enum(["pending", "paid", "partial", "waived", "failed", "refunded"])
        .default("pending"),
      totalSessions: z.number().int().min(1).max(1000).nullable().default(null),
    })
    .strict();
  studentId: string;
  status: "active" | "waitlisted";
  agreedPrice: number;
  paymentStatus: "pending" | "paid" | "partial" | "waived";
  totalSessions: number | null;
}

export class UpdateClassEnrollmentDto {
  static schema = z
    .object({
      status: z
        .enum(["pending", "active", "waitlisted", "cancelled", "completed"])
        .optional(),
      paymentStatus: z
        .enum(["pending", "paid", "partial", "waived"])
        .optional(),
      agreedPrice: z.number().finite().min(0).optional(),
      remainingSessions: z.number().int().min(0).nullable().optional(),
    })
    .strict();
  status?: "pending" | "active" | "waitlisted" | "cancelled" | "completed";
  paymentStatus?:
    "pending" | "paid" | "partial" | "waived" | "failed" | "refunded";
  agreedPrice?: number;
  remainingSessions?: number | null;
}

export class TransferClassEnrollmentDto {
  static schema = z.object({ targetClassId: objectId }).strict();
  targetClassId: string;
}

export class RecordClassAttendanceDto {
  static schema = z
    .object({
      items: z
        .array(
          z.object({
            studentId: objectId,
            status: z.enum(["present", "absent", "excused"]),
            notes: z.string().trim().max(500).default(""),
          }),
        )
        .min(1)
        .max(1000),
    })
    .strict();
  items: Array<{
    studentId: string;
    status: "present" | "absent" | "excused";
    notes: string;
  }>;
}

export class UpdateClassSessionDto {
  static schema = z
    .object({
      startsAt: z.iso.datetime().optional(),
      endsAt: z.iso.datetime().optional(),
      status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
    })
    .strict()
    .refine(
      (value) =>
        !(value.startsAt && value.endsAt) || value.startsAt < value.endsAt,
      { message: "Session end must be after start", path: ["endsAt"] },
    );
  startsAt?: string;
  endsAt?: string;
  status?: "scheduled" | "completed" | "cancelled";
}
