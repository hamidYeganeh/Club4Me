import { z } from "zod";

export class CreateTicketDto {
  static schema = z
    .object({
      subject: z.string().trim().min(3).max(160),
      category: z.enum(["payment", "reservation", "account", "club", "other"]),
      message: z.string().trim().min(5).max(5000),
      preferredContact: z.enum(["in_app", "phone"]).default("in_app"),
    })
    .strict();
  subject: string;
  category: "payment" | "reservation" | "account" | "club" | "other";
  message: string;
  preferredContact: "in_app" | "phone";
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
    })
    .strict();
  status: "open" | "in_progress" | "waiting_for_user" | "resolved" | "closed";
  assigneeId?: string | null;
  reply?: string;
}
