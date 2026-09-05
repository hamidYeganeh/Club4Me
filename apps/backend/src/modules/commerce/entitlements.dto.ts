import { z } from "zod";

const objectId = z.string().length(24);
export class CreateBenefitProductDto {
  static schema = z
    .object({
      title: z.string().trim().min(3).max(120),
      description: z.string().trim().max(1000).default(""),
      type: z.enum(["session_pack", "time_membership"]),
      price: z.number().int().positive(),
      sessionCount: z.number().int().min(1).max(1000).nullable().default(null),
      validityDays: z.number().int().min(1).max(730),
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
  title: string;
  description: string;
  type: "session_pack" | "time_membership";
  price: number;
  sessionCount: number | null;
  validityDays: number;
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
