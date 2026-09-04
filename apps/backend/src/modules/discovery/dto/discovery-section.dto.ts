import { z } from "zod";

import {
  DISCOVERY_SELECTION_MODES,
  DISCOVERY_SECTION_TYPES,
  DISCOVERY_SORTS,
} from "../schemas/discovery-section.schema";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid object id");
const filters = z
  .object({
    cityIds: z.array(objectId).max(50).optional(),
    sportIds: z.array(objectId).max(50).optional(),
    clubTypeIds: z.array(objectId).max(50).optional(),
    categoryIds: z.array(objectId).max(50).optional(),
    tags: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
    audience: z
      .array(z.enum(["men", "women", "mixed", "children", "family"]))
      .max(5)
      .optional(),
    serviceModes: z
      .array(z.enum(["online", "in_person", "hybrid"]))
      .max(3)
      .optional(),
  })
  .strict();

const selection = z.object({
  mode: z.enum(DISCOVERY_SELECTION_MODES).default("query"),
  itemIds: z.array(objectId).max(50).default([]),
  limit: z.number().int().min(1).max(50).default(10),
  sort: z.enum(DISCOVERY_SORTS).default("newest"),
  filters: filters.default({}),
});

const banner = z.object({
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().trim().max(300).default(""),
  imageUrl: z.string().trim().url().max(1000),
  actionLabel: z.string().trim().max(120).default(""),
  actionUrl: z.string().trim().max(1000).default(""),
});

const fields = {
  key: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  type: z.enum(DISCOVERY_SECTION_TYPES),
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().trim().max(300).default(""),
  layout: z.string().trim().min(1).max(80).default("carousel"),
  viewAllLabel: z.string().trim().max(120).default(""),
  viewAllUrl: z.string().trim().max(1000).default(""),
  enabled: z.boolean().default(true),
  selection: selection.default({
    mode: "query",
    itemIds: [],
    limit: 10,
    sort: "newest",
    filters: {},
  }),
  banners: z.array(banner).max(20).default([]),
};

export class CreateDiscoverySectionDto {
  static schema = z.object(fields);
  key: string;
  type: (typeof DISCOVERY_SECTION_TYPES)[number];
  title: string;
  subtitle: string;
  layout: string;
  viewAllLabel: string;
  viewAllUrl: string;
  enabled: boolean;
  selection: z.infer<typeof selection>;
  banners: z.infer<typeof banner>[];
}

export class UpdateDiscoverySectionDto {
  static schema = z.object({
    ...Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, value.optional()]),
    ),
  });
  key?: string;
  type?: (typeof DISCOVERY_SECTION_TYPES)[number];
  title?: string;
  subtitle?: string;
  layout?: string;
  viewAllLabel?: string;
  viewAllUrl?: string;
  enabled?: boolean;
  selection?: z.infer<typeof selection>;
  banners?: z.infer<typeof banner>[];
}

export class ReorderDiscoverySectionsDto {
  static schema = z.object({ sectionIds: z.array(objectId).min(1).max(200) });
  sectionIds: string[];
}
