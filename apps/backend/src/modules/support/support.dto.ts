import { z } from "zod";
import {
  supportReferenceTypes,
  type SupportReferenceType,
} from "./support-references.service";

export class CreateTicketDto {
  static schema = z
    .object({
      referenceType: z.enum(supportReferenceTypes).optional(),
      referenceId: z
        .string()
        .regex(/^[a-f0-9]{24}$/i)
        .optional(),
      subject: z.string().trim().min(3).max(160),
      category: z.enum(["payment", "reservation", "account", "club", "other"]),
      message: z.string().trim().min(5).max(5000),
      preferredContact: z.enum(["in_app", "phone"]).default("in_app"),
      priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
    })
    .strict()
    .refine(
      (value) => Boolean(value.referenceType) === Boolean(value.referenceId),
      {
        message: "نوع و شناسه سفارش باید با هم ارسال شوند.",
        path: ["referenceId"],
      },
    );
  referenceType?: SupportReferenceType;
  referenceId?: string;
  subject: string;
  category: "payment" | "reservation" | "account" | "club" | "other";
  message: string;
  preferredContact: "in_app" | "phone";
  priority: "low" | "normal" | "high" | "urgent";
}

export class ReplyTicketDto {
  static schema = z
    .object({ message: z.string().trim().min(1).max(5000) })
    .strict();
  message: string;
}

export class UpdateTicketDto {
  static schema = z
    .object({
      status: z.enum([
        "open",
        "in_progress",
        "waiting_for_user",
        "resolved",
        "closed",
      ]),
      assigneeId: z.string().length(24).nullable().optional(),
      reply: z.string().trim().min(1).max(5000).optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
      internalNote: z.string().trim().min(1).max(5000).optional(),
      callOutcome: z
        .enum([
          "contacted",
          "no_answer",
          "callback_requested",
          "resolved_by_call",
        ])
        .nullable()
        .optional(),
    })
    .strict();
  status: "open" | "in_progress" | "waiting_for_user" | "resolved" | "closed";
  assigneeId?: string | null;
  reply?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  internalNote?: string;
  callOutcome?:
    | "contacted"
    | "no_answer"
    | "callback_requested"
    | "resolved_by_call"
    | null;
}
