import { partialWithoutDefaults } from "../../common/utils/partial-without-defaults";
import { iranianPhone } from "../../common/utils/phone.util";
import { Types } from "mongoose";
import { z } from "zod";

const objectId = z.string().refine(Types.ObjectId.isValid, "Invalid ObjectId");
const phone = z.string().trim().min(7).max(20);
const optionalText = (max: number) => z.string().trim().max(max).default("");

export class CreateStudentDto {
  static schema = z
    .object({
      firstName: z.string().trim().min(2).max(80),
      lastName: z.string().trim().min(2).max(80),
      phone,
      sport: optionalText(120),
      membershipTitle: optionalText(120),
      membershipEndsAt: z.iso.datetime().nullable().default(null),
      status: z.enum(["active", "inactive"]).default("active"),
      notes: optionalText(500),
    })
    .strict();
  firstName: string;
  lastName: string;
  phone: string;
  sport: string;
  membershipTitle: string;
  membershipEndsAt: string | null;
  status: "active" | "inactive";
  notes: string;
}

export class UpdateStudentDto {
  static schema = partialWithoutDefaults(
    CreateStudentDto.schema.shape,
  ).strict();
  firstName?: string;
  lastName?: string;
  phone?: string;
  sport?: string;
  membershipTitle?: string;
  membershipEndsAt?: string | null;
  status?: "active" | "inactive";
  notes?: string;
}

export class CreateCoachDto {
  static schema = z
    .object({
      firstName: z.string().trim().min(2).max(80),
      lastName: z.string().trim().min(2).max(80),
      phone,
      specialties: z
        .array(z.string().trim().min(2).max(80))
        .max(20)
        .default([]),
      employmentType: optionalText(120),
      status: z.enum(["active", "inactive"]).default("active"),
      notes: optionalText(500),
    })
    .strict();
  firstName: string;
  lastName: string;
  phone: string;
  specialties: string[];
  employmentType: string;
  status: "active" | "inactive";
  notes: string;
}

export class UpdateCoachDto {
  static schema = partialWithoutDefaults(CreateCoachDto.schema.shape).strict();
  firstName?: string;
  lastName?: string;
  phone?: string;
  specialties?: string[];
  employmentType?: string;
  status?: "active" | "inactive";
  notes?: string;
}

export class CreatePaymentDto {
  static schema = z
    .object({
      studentId: objectId,
      type: z.enum(["tuition", "session", "other"]),
      title: z.string().trim().min(2).max(120),
      amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      currency: z.string().trim().min(3).max(8).default("IRR"),
      enrollmentId: objectId.nullable().optional(),
      idempotencyKey: z.string().trim().min(8).max(120),
      paidAt: z.iso.datetime(),
      method: z.enum(["cash", "card", "transfer", "other"]).default("card"),
      notes: optionalText(500),
    })
    .strict();
  studentId: string;
  type: "tuition" | "session" | "other";
  title: string;
  amount: number;
  currency: string;
  enrollmentId?: string | null;
  idempotencyKey?: string;
  paidAt: string;
  method: "cash" | "card" | "transfer" | "other";
  notes: string;
}

export class UpsertAttendanceDto {
  static schema = z
    .object({
      studentId: objectId,
      date: z.iso.datetime(),
      sessionTitle: z.string().trim().min(2).max(120),
      status: z.enum(["present", "absent", "excused"]),
      notes: optionalText(500),
    })
    .strict();
  studentId: string;
  date: string;
  sessionTitle: string;
  status: "present" | "absent" | "excused";
  notes: string;
}

export class CreateBranchDto {
  static schema = z
    .object({
      name: z.string().trim().min(2).max(120),
      address: z.string().trim().min(5).max(300),
      phone: z.string().trim().max(20).default(""),
      timezone: z.string().trim().min(3).max(80).default("Asia/Tehran"),
      status: z.enum(["active", "inactive"]).default("active"),
    })
    .strict();
  name: string;
  address: string;
  phone: string;
  timezone: string;
  status: "active" | "inactive";
}

export class UpdateBranchDto {
  static schema = partialWithoutDefaults(CreateBranchDto.schema.shape).strict();
  name?: string;
  address?: string;
  phone?: string;
  timezone?: string;
  status?: "active" | "inactive";
}

export class ImportOperationsDto {
  static schema = z
    .object({
      kind: z.enum(["students", "payments"]),
      templateVersion: z.literal(1),
      format: z.enum(["csv", "xlsx"]).default("csv"),
      dryRun: z.boolean().default(true),
      rows: z
        .array(z.record(z.string(), z.unknown()))
        .min(1)
        .max(5000)
        .optional(),
      contentBase64: z.string().max(20_000_000).optional(),
    })
    .strict()
    .superRefine((value, context) => {
      if (value.format === "csv" && !value.rows)
        context.addIssue({
          code: "custom",
          path: ["rows"],
          message: "Rows are required",
        });
      if (value.format === "xlsx" && !value.contentBase64)
        context.addIssue({
          code: "custom",
          path: ["contentBase64"],
          message: "Workbook is required",
        });
    });
  kind: "students" | "payments";
  templateVersion: 1;
  format: "csv" | "xlsx";
  dryRun: boolean;
  rows?: Array<Record<string, unknown>>;
  contentBase64?: string;
}

export class QueueOperationsExportDto {
  static schema = z
    .object({
      kind: z.enum([
        "students",
        "coaches",
        "classes",
        "payments",
        "attendance",
      ]),
      format: z.enum(["csv", "xlsx"]),
    })
    .strict();
  kind: "students" | "coaches" | "classes" | "payments" | "attendance";
  format: "csv" | "xlsx";
}

export class ReceptionQueryDto {
  static schema = z.object({ phone: iranianPhone }).strict();
  phone: string;
}

export class AllocateReceiptDto {
  static schema = z
    .object({
      enrollmentId: objectId,
      reason: z.string().trim().min(5).max(500),
    })
    .strict();
  enrollmentId: string;
  reason: string;
}
export class VoidReceiptDto {
  static schema = z
    .object({ reason: z.string().trim().min(5).max(500) })
    .strict();
  reason: string;
}
export class ReconcileClassBillingDto {
  static schema = z
    .object({
      openingPaidAmount: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      waivedAmount: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      expectedRevision: z.number().int().min(0),
      reason: z.string().trim().min(5).max(500),
    })
    .strict();
  openingPaidAmount: number;
  waivedAmount: number;
  expectedRevision: number;
  reason: string;
}

export class RefundManualReceiptDto {
  static schema = z
    .object({
      amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      paidAt: z.iso.datetime(),
      method: z.enum(["cash", "card", "transfer", "other"]),
      reason: z.string().trim().min(5).max(500),
      idempotencyKey: z.string().trim().min(8).max(120),
    })
    .strict();
  amount: number;
  paidAt: string;
  method: "cash" | "card" | "transfer" | "other";
  reason: string;
  idempotencyKey: string;
}
