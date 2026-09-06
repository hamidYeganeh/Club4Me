import { Types } from "mongoose";
import { z } from "zod";
import { ClubProfileSchema, BusyHoursSchema } from "./club-profile.dto";

const objectId = z
  .string()
  .trim()
  .refine((value) => Types.ObjectId.isValid(value), "Invalid ObjectId");
const uniqueObjectIds = z
  .array(objectId)
  .max(30)
  .refine((items) => new Set(items).size === items.length, "Duplicate ids");
const titledMedia = z.object({
  mediaId: objectId,
  title: z.string().trim().max(120).optional(),
  altText: z.string().trim().max(180).optional(),
  kind: z.enum(["image", "video"]).default("image"),
  position: z.number().int().min(0).default(0),
  isCover: z.boolean().default(false),
  category: z
    .enum(["training", "equipment", "changing_room", "entrance", "other"])
    .optional(),
  takenOn: z.iso
    .date()
    .refine(
      (value) => value <= new Date().toISOString().slice(0, 10),
      "Photo date cannot be in the future",
    )
    .optional(),
});
const countedResource = z
  .object({
    resourceId: objectId,
    quantity: z.number().int().min(1).max(10_000),
    reservableQuantity: z.number().int().min(0).max(10_000).default(0),
    status: z
      .enum(["available", "maintenance", "unavailable"])
      .default("available"),
    description: z.string().trim().max(2000).optional(),
  })
  .refine((item) => item.reservableQuantity <= item.quantity, {
    message: "Reservable quantity cannot exceed total quantity",
  });
const money = z.object({
  amount: z.number().int().min(0),
  currency: z.string().trim().min(3).max(8).toUpperCase().default("IRR"),
});
const amenity = z
  .object({
    resourceId: objectId,
    quantity: z.number().int().min(0).max(10_000).optional(),
    availability: z
      .enum(["included", "paid", "unavailable"])
      .default("included"),
    price: money.optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .superRefine((item, context) => {
    if (item.availability === "paid" && !item.price) {
      context.addIssue({
        code: "custom",
        path: ["price"],
        message: "Paid amenity requires price",
      });
    }
  });
const socialMedia = z
  .object({
    platform: z.enum([
      "instagram",
      "telegram",
      "whatsapp",
      "youtube",
      "aparat",
      "facebook",
      "linkedin",
      "x",
      "website",
      "email",
    ]),
    link: z.string().trim().max(500),
  })
  .superRefine((item, context) => {
    const valid =
      item.platform === "email"
        ? /^(mailto:)?[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(item.link)
        : z.url().safeParse(item.link).success;
    if (!valid)
      context.addIssue({
        code: "custom",
        path: ["link"],
        message: "Invalid social link",
      });
  });
const cancellationTier = z.object({
  hoursBefore: z.number().int().min(0).max(8760),
  refundPercent: z.number().int().min(0).max(100),
});
const cancellationRule = z
  .object({
    id: objectId.optional(),
    title: z.string().trim().min(2).max(80),
    tiers: z.array(cancellationTier).min(1).max(20),
    version: z.number().int().min(1).default(1),
    priority: z.number().int().default(0),
    sessionTypes: z
      .array(z.enum(["court", "class", "coached_session"]))
      .max(3)
      .default([]),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).default([]),
    courtIds: uniqueObjectIds.default([]),
    reservationCutoffMinutes: z.number().int().min(0).max(525_600).default(0),
    rescheduleCutoffMinutes: z.number().int().min(0).max(525_600).default(0),
    noShowRefundPercent: z.number().int().min(0).max(100).default(0),
    ownerCancellationRefundPercent: z
      .number()
      .int()
      .min(0)
      .max(100)
      .default(100),
    isActive: z.boolean().default(true),
  })
  .superRefine(({ tiers }, context) => {
    const hours = tiers.map((tier) => tier.hoursBefore);
    if (new Set(hours).size !== hours.length) {
      context.addIssue({ code: "custom", message: "Duplicate hour threshold" });
    }
    if (!hours.includes(0)) {
      context.addIssue({
        code: "custom",
        message: "A zero-hour cancellation tier is required",
      });
    }
    const sorted = [...tiers].sort((a, b) => b.hoursBefore - a.hoursBefore);
    for (let index = 1; index < sorted.length; index += 1) {
      if (sorted[index]!.refundPercent > sorted[index - 1]!.refundPercent) {
        context.addIssue({
          code: "custom",
          message: "Refund percent cannot increase closer to the session",
        });
        break;
      }
    }
  });

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const weeklyHours = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  periods: z
    .array(
      z
        .object({ opensAt: time, closesAt: time })
        .refine(
          (period) => period.opensAt < period.closesAt,
          "Closing time must be after opening time",
        ),
    )
    .max(4)
    .default([]),
  isClosed: z.boolean().default(false),
});
const closure = z
  .object({
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    reason: z.string().trim().max(300).default(""),
  })
  .refine(
    (item) => item.startsAt < item.endsAt,
    "Closure end must be after start",
  );

const uniqueCountedResources = z
  .array(countedResource)
  .max(100)
  .refine(
    (items) =>
      new Set(items.map((item) => item.resourceId)).size === items.length,
    "Duplicate resources",
  );

type ClubFieldsRefinementValue = {
  minAge?: number | null;
  maxAge?: number | null;
  gallery?: Array<{ isCover?: boolean }>;
};

export function refineClubFields(
  value: ClubFieldsRefinementValue,
  context: z.RefinementCtx,
) {
  if (
    value.minAge != null &&
    value.maxAge != null &&
    value.minAge > value.maxAge
  ) {
    context.addIssue({
      code: "custom",
      path: ["maxAge"],
      message: "Maximum age must be at least minimum age",
    });
  }
  if ((value.gallery?.filter((item) => item.isCover).length ?? 0) > 1) {
    context.addIssue({
      code: "custom",
      path: ["gallery"],
      message: "Only one gallery item can be cover",
    });
  }
}

export const ClubFieldsObjectSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    profile: ClubProfileSchema.optional(),
    trialBookingEnabled: z.boolean().optional(),
    busyHours: BusyHoursSchema.optional(),
    shortDescription: z.string().trim().max(300).optional(),
    description: z.string().trim().max(5000).optional(),
    logoMediaId: objectId.nullish(),
    coverMediaId: objectId.nullish(),
    gallery: z.array(titledMedia).max(30).optional(),
    equipment: uniqueCountedResources.optional(),
    amenities: z
      .array(amenity)
      .max(100)
      .refine(
        (items) =>
          new Set(items.map((item) => item.resourceId)).size === items.length,
        "Duplicate resources",
      )
      .optional(),
    rules: z.array(z.string().trim().min(2).max(300)).max(50).optional(),
    faqs: z
      .array(
        z.object({
          question: z.string().trim().min(2).max(240),
          answer: z.string().trim().min(2).max(2000),
        }),
      )
      .max(30)
      .optional(),
    location: z
      .object({
        countryId: objectId,
        provinceId: objectId,
        cityId: objectId,
        districtId: objectId.nullish(),
        cityRegionIds: uniqueObjectIds.optional(),
        address: z.string().trim().min(3).max(500),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        postalCode: z.string().trim().max(20).optional(),
        timezone: z
          .string()
          .trim()
          .min(3)
          .max(80)
          .refine((value) => {
            try {
              new Intl.DateTimeFormat("en", { timeZone: value });
              return true;
            } catch {
              return false;
            }
          }, "Invalid time zone")
          .default("Asia/Tehran"),
        locationNotes: z.string().trim().max(500).optional(),
      })
      .optional(),
    socialMedia: z
      .array(socialMedia)
      .max(20)
      .refine(
        (items) =>
          new Set(items.map((item) => item.platform)).size === items.length,
        "Duplicate social platform",
      )
      .optional(),
    clubTypeIds: uniqueObjectIds.optional(),
    sportIds: uniqueObjectIds.optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
    weeklyHours: z
      .array(weeklyHours)
      .max(7)
      .refine(
        (items) =>
          new Set(items.map((item) => item.dayOfWeek)).size === items.length,
        "Duplicate week day",
      )
      .optional(),
    closures: z.array(closure).max(100).optional(),
    audience: z
      .array(z.enum(["men", "women", "mixed", "children", "family"]))
      .max(5)
      .refine(
        (items) => new Set(items).size === items.length,
        "Duplicate audience",
      )
      .optional(),
    minAge: z.number().int().min(0).max(120).nullish(),
    maxAge: z.number().int().min(0).max(120).nullish(),
    currency: z.string().trim().min(3).max(8).toUpperCase().optional(),
    taxPercent: z.number().min(0).max(100).optional(),
    operationalStatus: z
      .enum([
        "active",
        "temporarily_closed",
        "permanently_closed",
        "under_maintenance",
      ])
      .optional(),
    cancellationRules: z
      .array(cancellationRule)
      .max(20)
      .refine(
        (items) =>
          new Set(
            items.map((item) => item.title.trim().toLocaleLowerCase("fa")),
          ).size === items.length,
        "Duplicate cancellation rule title",
      )
      .optional(),
  })
  .strict();

export const ClubFieldsSchema =
  ClubFieldsObjectSchema.superRefine(refineClubFields);

export type ClubFields = z.input<typeof ClubFieldsSchema>;
