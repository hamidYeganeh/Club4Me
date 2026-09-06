import { z } from "zod";

const text = z.string().trim().max(500);
const positive = z.number().positive().max(1_000_000);
const count = z.number().int().min(1).max(10_000);
const catalogId = z.string().regex(/^[a-f\d]{24}$/i);

export const ClubProfileSchema = z
  .object({
    spaces: z
      .array(
        z
          .object({
            name: z.string().trim().min(1).max(120),
            floorTypeId: catalogId.optional(),
            roofTypeId: catalogId.optional(),
            lightingTypeId: catalogId.optional(),
            waterTreatmentTypeId: catalogId.optional(),
            floorType: text.optional(),
            roofType: z
              .enum(["open", "covered", "retractable", "partial"])
              .optional(),
            lighting: text.optional(),
            courtCount: count.optional(),
            areaSquareMeters: positive.optional(),
            poolLengthMeters: positive.optional(),
            poolLaneCount: count.optional(),
            poolMinDepthMeters: positive.optional(),
            poolMaxDepthMeters: positive.optional(),
            waterTreatment: text.optional(),
          })
          .strict()
          .refine(
            (s) =>
              s.poolMinDepthMeters == null ||
              s.poolMaxDepthMeters == null ||
              s.poolMinDepthMeters <= s.poolMaxDepthMeters,
            "Maximum depth must be at least minimum depth",
          ),
      )
      .max(30)
      .optional(),
    trainingAreaSquareMeters: positive.optional(),
    ventilationTypeId: catalogId.optional(),
    coolingTypeId: catalogId.optional(),
    parkingTypeId: catalogId.optional(),
    accessibilityTypeId: catalogId.optional(),
    classCapacity: count.optional(),
    ventilation: text.optional(),
    cooling: text.optional(),
    parking: text.optional(),
    wheelchairAccess: z.enum(["yes", "partial", "no", "unknown"]).optional(),
    firstVisit: z
      .object({
        requiredItemIds: z
          .array(catalogId)
          .max(30)
          .refine(
            (items) => new Set(items).size === items.length,
            "Duplicate required item",
          )
          .optional(),
        requiredItems: z
          .array(z.string().trim().min(1).max(120))
          .max(30)
          .optional(),
        arrivalMinutesBefore: z.number().int().min(0).max(180).optional(),
        instructions: z.string().trim().max(2000).optional(),
        visitAvailable: z.boolean().optional(),
        extraFees: text.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const BusyHoursSchema = z
  .array(
    z
      .object({
        dayOfWeek: z.number().int().min(0).max(6),
        hour: z.number().int().min(0).max(23),
        level: z.enum(["quiet", "moderate", "busy"]),
      })
      .strict(),
  )
  .max(168)
  .refine(
    (items) =>
      new Set(items.map((i) => `${i.dayOfWeek}:${i.hour}`)).size ===
      items.length,
    "Duplicate busy hour",
  );

export type ClubProfile = z.infer<typeof ClubProfileSchema>;
export type ClubBusyHour = z.infer<typeof BusyHoursSchema>[number];
