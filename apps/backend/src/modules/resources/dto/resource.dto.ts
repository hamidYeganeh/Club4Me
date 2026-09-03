import { z } from "zod";

const value = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);
const ResourceBodySchema = z
  .record(z.string(), value)
  .superRefine((body, context) => {
    if (Object.keys(body).some((key) => !RESOURCE_BODY_FIELDS.has(key))) {
      context.addIssue({ code: "custom", message: "Unknown resource field" });
    }
  });

const RESOURCE_BODY_FIELDS = new Set([
  "code",
  "slug",
  "name",
  "description",
  "icon",
  "imageUrl",
  "isActive",
  "sortOrder",
  "aliases",
  "categoryId",
  "supportedSportIds",
  "sportIds",
  "countryId",
  "provinceId",
  "cityId",
  "districtId",
  "minAge",
  "maxAge",
  "color",
  "title",
  "typeId",
  "entityType",
  "itemIds",
  "startsAt",
  "endsAt",
  "canonicalTerm",
  "synonyms",
  "phrase",
  "weight",
  "collectionId",
  "placement",
  "displayLimit",
  "durationValue",
  "durationUnit",
  "billingUnit",
]);

export class CreateResourceDto {
  static schema = ResourceBodySchema;
  [key: string]: string | number | boolean | string[] | null | undefined;
}

export class UpdateResourceDto extends CreateResourceDto {
  static schema = ResourceBodySchema;
}
