import { Types } from "mongoose";
import { z } from "zod";

const objectId = z
  .string()
  .refine((value) => Types.ObjectId.isValid(value), "Invalid ObjectId");
const policy = z.object({
  id: objectId.optional(),
  title: z.string().trim().min(2).max(80),
  version: z.number().int().min(1).default(1),
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
  reservationCutoffMinutes: z.number().int().min(0).default(0),
  rescheduleCutoffMinutes: z.number().int().min(0).default(0),
  noShowRefundPercent: z.number().int().min(0).max(100).default(0),
  ownerCancellationRefundPercent: z.number().int().min(0).max(100).default(100),
  priority: z.number().int().optional(),
  sessionTypes: z.array(z.string()).optional(),
  daysOfWeek: z.array(z.number()).optional(),
  courtIds: z.array(objectId).optional(),
  isActive: z.boolean().optional(),
});

export class CreateCourtDto {
  static schema = z
    .object({
      name: z.string().trim().min(2).max(120),
      code: z.string().trim().max(40).optional(),
      courtTypeId: objectId.optional(),
      sportIds: z.array(objectId).max(30).default([]),
      description: z.string().trim().max(2000).optional(),
      capacity: z.number().int().min(1).max(1000),
      environment: z.enum(["indoor", "outdoor", "covered"]).default("indoor"),
      surfaceTypeId: objectId.optional(),
      lengthMeters: z.number().positive().optional(),
      widthMeters: z.number().positive().optional(),
      locationLabel: z.string().trim().max(120).optional(),
      floor: z.string().trim().max(40).optional(),
      galleryMediaIds: z.array(objectId).max(30).default([]),
      isReservable: z.boolean().optional(),
      minimumReservationMinutes: z.number().int().min(1).max(1440).default(60),
      maximumReservationMinutes: z
        .number()
        .int()
        .min(1)
        .max(10080)
        .default(480),
      preparationMinutes: z.number().int().min(0).max(1440).default(0),
      cleanupMinutes: z.number().int().min(0).max(1440).default(0),
    })
    .strict()
    .refine(
      (value) =>
        value.minimumReservationMinutes <= value.maximumReservationMinutes,
      {
        path: ["maximumReservationMinutes"],
        message: "Maximum reservation duration must be at least the minimum",
      },
    );
  name: string;
  code?: string;
  courtTypeId?: string;
  sportIds: string[];
  description?: string;
  capacity: number;
  environment: "indoor" | "outdoor" | "covered";
  surfaceTypeId?: string;
  lengthMeters?: number;
  widthMeters?: number;
  locationLabel?: string;
  floor?: string;
  galleryMediaIds: string[];
  isReservable?: boolean;
  minimumReservationMinutes: number;
  maximumReservationMinutes: number;
  preparationMinutes: number;
  cleanupMinutes: number;
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
      currency: z.string().trim().min(3).max(8).toUpperCase().default("IRR"),
      pricingUnit: z
        .enum(["per_participant", "per_session", "per_court"])
        .default("per_participant"),
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
  currency: string;
  pricingUnit: "per_participant" | "per_session" | "per_court";
  options?: Array<{
    type: "equipment" | "amenity";
    resourceId: string;
    title?: string;
    availableQuantity: number;
    maxPerReservation: number;
    unitPrice: number;
  }>;
  cancellationPolicy: {
    id?: string;
    title: string;
    version: number;
    tiers: Array<{ hoursBefore: number; refundPercent: number }>;
    reservationCutoffMinutes: number;
    rescheduleCutoffMinutes: number;
    noShowRefundPercent: number;
    ownerCancellationRefundPercent: number;
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
