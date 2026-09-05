import { z } from "zod";

export class CreditWalletDto {
  static schema = z
    .object({
      userId: z.string().length(24),
      amount: z.number().int().positive(),
      source: z.enum(["refund", "promotion", "referral", "admin"]),
      idempotencyKey: z.string().min(8).max(120),
      note: z.string().max(300).default(""),
      expiresAt: z.iso.datetime().nullable().default(null),
    })
    .strict();
  userId: string;
  amount: number;
  source: "refund" | "promotion" | "referral" | "admin";
  idempotencyKey: string;
  note: string;
  expiresAt: string | null;
}

export class CreateDiscountDto {
  static schema = z
    .object({
      code: z
        .string()
        .trim()
        .min(3)
        .max(30)
        .regex(/^[A-Za-z0-9_-]+$/),
      title: z.string().trim().min(3).max(120),
      kind: z.enum(["percent", "fixed"]),
      value: z.number().int().positive(),
      maxDiscount: z.number().int().positive().nullable().default(null),
      minOrderAmount: z.number().int().min(0).default(0),
      budget: z.number().int().positive(),
      perUserLimit: z.number().int().min(1).max(100).default(1),
      usageLimit: z.number().int().positive().nullable().default(null),
      clubIds: z.array(z.string().length(24)).default([]),
      scopeType: z
        .enum([
          "global",
          "club",
          "coach",
          "class",
          "sport",
          "product",
          "session_type",
        ])
        .default("global"),
      scopeIds: z.array(z.string().trim().min(1).max(120)).max(500).default([]),
      funding: z
        .array(
          z
            .object({
              source: z.enum(["platform", "provider"]),
              percentage: z.number().int().min(1).max(100),
            })
            .strict(),
        )
        .min(1)
        .max(2)
        .default([{ source: "platform", percentage: 100 }]),
      firstPurchaseOnly: z.boolean().default(false),
      referredOnly: z.boolean().default(false),
      eligibleUserIds: z.array(z.string().length(24)).max(5000).default([]),
      startsAt: z.iso.datetime(),
      endsAt: z.iso.datetime(),
    })
    .strict()
    .superRefine((value, context) => {
      if (value.kind === "percent" && value.value > 100) {
        context.addIssue({
          code: "custom",
          path: ["value"],
          message: "Percent discount cannot exceed 100",
        });
      }
      if (
        value.funding.reduce((sum, item) => sum + item.percentage, 0) !== 100
      ) {
        context.addIssue({
          code: "custom",
          path: ["funding"],
          message: "Funding percentages must add up to 100",
        });
      }
      if (
        new Set(value.funding.map((item) => item.source)).size !==
        value.funding.length
      ) {
        context.addIssue({
          code: "custom",
          path: ["funding"],
          message: "Funding sources must be unique",
        });
      }
      if (value.scopeType !== "global" && value.scopeIds.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["scopeIds"],
          message: "At least one scope id is required",
        });
      }
    });
  code: string;
  title: string;
  kind: "percent" | "fixed";
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number;
  budget: number;
  perUserLimit: number;
  usageLimit: number | null;
  clubIds: string[];
  scopeType:
    | "global"
    | "club"
    | "coach"
    | "class"
    | "sport"
    | "product"
    | "session_type";
  scopeIds: string[];
  funding: Array<{
    source: "platform" | "provider";
    percentage: number;
  }>;
  firstPurchaseOnly: boolean;
  referredOnly: boolean;
  eligibleUserIds: string[];
  startsAt: string;
  endsAt: string;
}

export class QuoteDiscountDto {
  static schema = z
    .object({
      code: z.string().trim().min(3).max(30),
      referenceId: z.string().length(24),
    })
    .strict();
  code: string;
  referenceId: string;
}

export class RedeemReferralDto {
  static schema = z.object({ code: z.string().trim().min(6).max(20) }).strict();
  code: string;
}
