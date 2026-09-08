import { z } from "zod";

export class CreatePaymentIntentDto {
  static schema = z
    .object({
      referenceType: z.enum([
        "reservation",
        "benefit_purchase",
        "business_class_enrollment",
        "coach_booking",
        "coach_class_enrollment",
        "coach_package_purchase",
      ]),
      referenceId: z.string().length(24),
      idempotencyKey: z.string().trim().min(8).max(120),
      returnUrl: z.string().url().max(500),
      couponCode: z.string().trim().min(3).max(30).optional(),
      walletAmount: z.number().int().min(0).default(0),
      expectedAmount: z.number().int().positive().optional(),
    })
    .strict();

  referenceType:
    | "reservation"
    | "benefit_purchase"
    | "business_class_enrollment"
    | "coach_booking"
    | "coach_class_enrollment"
    | "coach_package_purchase";
  referenceId: string;
  idempotencyKey: string;
  returnUrl: string;
  couponCode?: string;
  walletAmount: number;
  expectedAmount?: number;
}

export class QuotePaymentDto {
  static schema = CreatePaymentIntentDto.schema.omit({
    idempotencyKey: true,
    returnUrl: true,
    expectedAmount: true,
  });
  referenceType: CreatePaymentIntentDto["referenceType"];
  referenceId: string;
  couponCode?: string;
  walletAmount: number;
}

export class MockPaymentDecisionDto {
  static schema = z.object({ status: z.enum(["paid", "failed"]) }).strict();
  status: "paid" | "failed";
}

export class MockPaymentCallbackDto {
  static schema = z
    .object({
      eventId: z.string().uuid(),
      intentId: z.string().length(24),
      authority: z.string().min(12).max(120),
      status: z.enum(["paid", "failed"]),
      amount: z.number().int().positive(),
      timestamp: z.number().int().positive(),
      nonce: z.string().min(16).max(120),
    })
    .strict();

  eventId: string;
  intentId: string;
  authority: string;
  status: "paid" | "failed";
  amount: number;
  timestamp: number;
  nonce: string;
}

export class RefundPaymentDto {
  static schema = z
    .object({
      amount: z.number().int().positive().optional(),
      reason: z.string().trim().min(3).max(300),
      idempotencyKey: z.string().trim().min(8).max(120),
    })
    .strict();

  amount?: number;
  reason: string;
  idempotencyKey: string;
}

export class CreatePayoutDto {
  static schema = z
    .object({
      providerType: z.enum(["club", "coach"]),
      providerId: z.string().length(24).optional(),
      amount: z.number().int().positive(),
      iban: z.string().regex(/^IR\d{24}$/),
    })
    .strict();

  providerType: "club" | "coach";
  providerId?: string;
  amount: number;
  iban: string;
}

export class PayoutBalanceDto {
  static schema = z
    .object({
      providerType: z.enum(["club", "coach"]),
      providerId: z.string().length(24).optional(),
    })
    .strict();

  providerType: "club" | "coach";
  providerId?: string;
}

export class ReviewPayoutDto {
  static schema = z
    .object({
      status: z.enum(["under_review", "paid", "rejected"]),
      note: z.string().trim().max(500).default(""),
      bankReference: z.string().trim().min(3).max(120).optional(),
    })
    .strict()
    .superRefine((value, context) => {
      if (value.status === "paid" && !value.bankReference) {
        context.addIssue({
          code: "custom",
          path: ["bankReference"],
          message: "Bank reference is required for paid payouts",
        });
      }
    });

  status: "under_review" | "paid" | "rejected";
  note: string;
  bankReference?: string;
}
