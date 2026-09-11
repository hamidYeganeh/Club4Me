import { z } from "zod";

const objectId = z.string().length(24);
export class CreateBenefitProductDto {
  static schema = z
    .object({
      accessClubIds: z
        .array(z.string().regex(/^[a-f\d]{24}$/i))
        .max(20)
        .default([]),
      title: z.string().trim().min(3).max(120),
      description: z.string().trim().max(1000).default(""),
      type: z.enum(["session_pack", "time_membership"]),
      price: z.number().int().positive(),
      sessionCount: z.number().int().min(1).max(1000).nullable().default(null),
      validityDays: z.number().int().min(1).max(730),
      maxPauseDays: z.number().int().min(0).max(90).default(0),
      weeklyLimit: z.number().int().min(1).max(50).nullable().default(null),
      sessionTypes: z
        .array(z.enum(["court", "class", "coached_session"]))
        .min(1),
    })
    .strict()
    .superRefine((value, context) => {
      if (value.type === "session_pack" && !value.sessionCount)
        context.addIssue({
          code: "custom",
          path: ["sessionCount"],
          message: "Session count is required",
        });
      if (value.type === "time_membership" && !value.weeklyLimit)
        context.addIssue({
          code: "custom",
          path: ["weeklyLimit"],
          message: "Weekly limit is required",
        });
    });
  accessClubIds?: string[];
  title: string;
  description: string;
  type: "session_pack" | "time_membership";
  price: number;
  sessionCount: number | null;
  validityDays: number;
  maxPauseDays?: number;
  weeklyLimit: number | null;
  sessionTypes: Array<"court" | "class" | "coached_session">;
}
export class UpdateBenefitProductDto {
  static schema = z.object({ status: z.enum(["active", "inactive"]) }).strict();
  status: "active" | "inactive";
}
export class CreateBenefitPurchaseDto {
  static schema = z.object({ productId: objectId }).strict();
  productId: string;
}

export class BenefitPurchaseOptionsDto {
  static schema = z
    .object({
      renewedFromId: z
        .string()
        .regex(/^[a-fA-F0-9]{24}$/)
        .optional(),
      startMode: z.enum(["immediate", "after_expiry"]).default("immediate"),
    })
    .strict()
    .refine(
      (v) => v.startMode !== "after_expiry" || Boolean(v.renewedFromId),
      "عضویت قبلی لازم است.",
    );
  renewedFromId?: string;
  startMode: "immediate" | "after_expiry";
}

export class PauseEntitlementDto {
  static schema = z.object({ days: z.number().int().min(1).max(90) }).strict();
  days: number;
}
