import { Types } from "mongoose";
import { z } from "zod";

const objectId = z
  .string()
  .refine((value) => Types.ObjectId.isValid(value), "Invalid ObjectId");
const policy = z.object({
  title: z.string().trim().min(2).max(80),
  tiers: z
    .array(
      z.object({
        hoursBefore: z.number().int().min(0).max(8760),
        refundPercent: z.number().int().min(0).max(100),
      }),
    )
    .min(1)
    .refine(
      (tiers) => tiers.some((tier) => tier.hoursBefore === 0),
      "Zero-hour fallback required",
    )
    .refine(
      (tiers) =>
        new Set(tiers.map((tier) => tier.hoursBefore)).size === tiers.length,
      "Duplicate cancellation thresholds",
    )
    .refine((tiers) => {
      const ordered = [...tiers].sort((a, b) => a.hoursBefore - b.hoursBefore);
      return ordered.every(
        (tier, index) =>
          index === 0 ||
          tier.refundPercent >= ordered[index - 1]!.refundPercent,
      );
    }, "Refund cannot decrease when cancelling earlier"),
});

export class CreateCourtDto {
  static schema = z
    .object({
      name: z.string().trim().min(2).max(120),
      courtTypeId: objectId.optional(),
      description: z.string().trim().max(2000).optional(),
      capacity: z.number().int().min(1).max(1000),
      isReservable: z.boolean().optional(),
    })
    .strict();
  name: string;
  courtTypeId?: string;
  description?: string;
  capacity: number;
  isReservable?: boolean;
}

export class CreateSessionDto {
  static schema = z
    .object({
      title: z.string().trim().min(2).max(120),
      courtId: objectId.optional(),
      coachId: objectId.optional(),
      classId: objectId.optional(),
      startsAt: z.iso.datetime(),
      endsAt: z.iso.datetime(),
      capacity: z.number().int().min(1).max(1000),
      basePrice: z.number().int().min(0),
      options: z
        .array(
          z.object({
            type: z.enum(["equipment", "amenity"]),
            resourceId: objectId,
            title: z.string().trim().max(120).optional(),
            availableQuantity: z.number().int().min(1).max(10000),
            maxPerReservation: z.number().int().min(1).max(1000),
            unitPrice: z.number().int().min(0),
          }),
        )
        .max(50)
        .optional(),
      cancellationPolicy: policy,
    })
    .strict()
    .superRefine((value, context) => {
      if (new Date(value.startsAt) >= new Date(value.endsAt)) {
        context.addIssue({
          code: "custom",
          path: ["endsAt"],
          message: "Session end must be after start",
        });
      }
      if (new Date(value.startsAt) <= new Date()) {
        context.addIssue({
          code: "custom",
          path: ["startsAt"],
          message: "Session start must be in the future",
        });
      }
      value.options?.forEach((option, index) => {
        if (option.maxPerReservation > option.availableQuantity) {
          context.addIssue({
            code: "custom",
            path: ["options", index, "maxPerReservation"],
            message: "Maximum per reservation cannot exceed inventory",
          });
        }
      });
    });
  title: string;
  courtId?: string;
  coachId?: string;
  classId?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  basePrice: number;
  options?: Array<{
    type: "equipment" | "amenity";
    resourceId: string;
    title?: string;
    availableQuantity: number;
    maxPerReservation: number;
    unitPrice: number;
  }>;
  cancellationPolicy: {
    title: string;
    tiers: Array<{ hoursBefore: number; refundPercent: number }>;
  };
}

export class CreateReservationDto {
  static schema = z
    .object({
      sessionId: objectId,
      participantCount: z.number().int().min(1).max(100),
      options: z
        .array(
          z.object({
            optionId: objectId,
            quantity: z.number().int().min(1).max(1000),
          }),
        )
        .max(50)
        .optional(),
    })
    .strict();
  sessionId: string;
  participantCount: number;
  options?: Array<{ optionId: string; quantity: number }>;
}
