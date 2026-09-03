import { Types } from "mongoose";
import { z } from "zod";

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
});
const countedResource = z.object({
  resourceId: objectId,
  quantity: z.number().int().min(1).max(10_000),
});
const socialMedia = z.object({
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
  ]),
  link: z.url().max(500),
});
const cancellationTier = z.object({
  hoursBefore: z.number().int().min(0).max(8760),
  refundPercent: z.number().int().min(0).max(100),
});
const cancellationRule = z
  .object({
    title: z.string().trim().min(2).max(80),
    tiers: z.array(cancellationTier).min(1).max(20),
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

const uniqueCountedResources = z
  .array(countedResource)
  .max(100)
  .refine(
    (items) =>
      new Set(items.map((item) => item.resourceId)).size === items.length,
    "Duplicate resources",
  );

export const ClubFieldsSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(5000).optional(),
    gallery: z.array(titledMedia).max(30).optional(),
    equipment: uniqueCountedResources.optional(),
    amenities: uniqueCountedResources.optional(),
    rules: z.array(z.string().trim().min(2).max(300)).max(50).optional(),
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
    tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
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

export type ClubFields = z.infer<typeof ClubFieldsSchema>;
