import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import {
  Connection,
  Model,
  Schema,
  type SchemaDefinition,
  type SchemaDefinitionProperty,
  Types,
} from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { slugify } from "../articles/lib/slugify";
import type { CreateResourceDto, UpdateResourceDto } from "./dto/resource.dto";
import {
  getServerResource,
  serverResourceDefinitions,
  type ServerResourceDefinition,
  type ServerResourceField,
} from "./resources.registry";
import {
  resourceSeedData,
  type ResourceSeedRecord,
} from "./resources.seed-data";

type ResourceDocument = Record<string, unknown> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
type ResourceInput = CreateResourceDto | UpdateResourceDto;
type ListQuery = Record<string, string | undefined>;
type SeedResult = {
  created: number;
  existing: number;
  dependenciesCreated: number;
  articlesCreated: number;
};

const BASE_FIELDS = [
  "code",
  "slug",
  "name",
  "description",
  "icon",
  "imageUrl",
  "isActive",
  "sortOrder",
  "aliases",
] as const;
const SORT_FIELDS = new Set([
  "name",
  "code",
  "slug",
  "sortOrder",
  "createdAt",
  "updatedAt",
]);

@Injectable()
export class ResourcesService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async list(category: string, segment: string, query: ListQuery) {
    const definition = this.requireDefinition(category, segment);
    const model = this.getModel(definition);
    const page = parseInteger(query.page, 1, 1, 100_000);
    const limit = parseInteger(query.limit, 20, 1, 100);
    const filter: Record<string, unknown> = {};

    if (query.isActive !== undefined)
      filter.isActive = parseBoolean(query.isActive);
    if (query.parentId !== undefined) {
      const parentField = definition.fields.find(
        (field) => field.kind === "relation",
      );
      if (!parentField || !Types.ObjectId.isValid(query.parentId)) {
        throw new AppError(400, "INVALID_PARENT", "Invalid parent filter");
      }
      filter[parentField.name] = new Types.ObjectId(query.parentId);
    }
    if (query.search?.trim()) {
      const pattern = new RegExp(escapeRegex(normalizeText(query.search)), "i");
      filter.$or = [
        "name",
        definition.primaryField,
        "code",
        "slug",
        "normalizedName",
      ].map((field) => ({ [field]: pattern }));
    }

    const sortBy =
      query.sortBy && SORT_FIELDS.has(query.sortBy)
        ? query.sortBy
        : "sortOrder";
    const sortDirection = query.sortDirection === "desc" ? -1 : 1;
    const [documents, total] = await Promise.all([
      model
        .find(filter)
        .sort({ [sortBy]: sortDirection, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      model.countDocuments(filter).exec(),
    ]);

    return {
      items: documents.map(toPublicResource),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async get(category: string, segment: string, id: string) {
    const definition = this.requireDefinition(category, segment);
    const document = await this.findById(this.getModel(definition), id);
    if (!document)
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Resource not found");
    return toPublicResource(document);
  }

  async requireActive(
    category: string,
    segment: string,
    id: string,
  ): Promise<Record<string, unknown>> {
    const resource = await this.get(category, segment, id);
    if (resource.isActive !== true) {
      throw new AppError(
        400,
        "RESOURCE_RELATION_INACTIVE",
        "Referenced resource is inactive",
      );
    }
    return resource;
  }

  async create(category: string, segment: string, body: ResourceInput) {
    const definition = this.requireDefinition(category, segment);
    const payload = await this.preparePayload(definition, body, true);
    try {
      return toPublicResource(await this.getModel(definition).create(payload));
    } catch (error) {
      this.throwDuplicate(error);
      throw error;
    }
  }

  async update(
    category: string,
    segment: string,
    id: string,
    body: ResourceInput,
  ) {
    const definition = this.requireDefinition(category, segment);
    const model = this.getModel(definition);
    const existing = await this.findById(model, id);
    if (!existing)
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Resource not found");
    if (body.code !== undefined && body.code !== existing.code) {
      throw new AppError(
        400,
        "RESOURCE_CODE_IMMUTABLE",
        "Resource code cannot be changed",
      );
    }
    const payload = await this.preparePayload(definition, body, false);
    try {
      const updated = await model
        .findByIdAndUpdate(
          id,
          { $set: payload },
          { new: true, runValidators: true },
        )
        .lean()
        .exec();
      if (!updated)
        throw new AppError(404, "RESOURCE_NOT_FOUND", "Resource not found");
      return toPublicResource(updated);
    } catch (error) {
      this.throwDuplicate(error);
      throw error;
    }
  }

  async delete(category: string, segment: string, id: string) {
    const definition = this.requireDefinition(category, segment);
    const model = this.getModel(definition);
    const existing = await this.findById(model, id);
    if (!existing)
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Resource not found");
    await this.assertNotReferenced(definition, existing._id);
    await model.deleteOne({ _id: existing._id }).exec();
    return { success: true as const };
  }

  async seed(category: string, segment: string): Promise<SeedResult> {
    const definition = this.requireDefinition(category, segment);
    const result = await this.seedDefinition(definition, new Set());
    const articlesCreated =
      definition.key === "article_categories"
        ? await this.seedSampleArticles()
        : 0;
    return { ...result, articlesCreated };
  }

  private async seedDefinition(
    definition: ServerResourceDefinition,
    visited: Set<string>,
  ): Promise<Omit<SeedResult, "articlesCreated">> {
    if (visited.has(definition.key)) {
      return { created: 0, existing: 0, dependenciesCreated: 0 };
    }
    visited.add(definition.key);

    let dependenciesCreated = 0;
    for (const field of definition.fields) {
      if (!field.target) continue;
      const dependency = this.requireDefinition(
        field.target.category,
        field.target.resource,
      );
      const seeded = await this.seedDefinition(dependency, visited);
      dependenciesCreated += seeded.created + seeded.dependenciesCreated;
    }

    let created = 0;
    let existing = 0;
    const model = this.getModel(definition);
    for (const seed of resourceSeedData[definition.key] ?? []) {
      const resolved = await this.resolveSeedRelations(definition, seed);
      const primary = String(resolved[definition.primaryField] ?? "");
      const normalizedName = normalizeText(primary);
      const generatedSlug = slugify(primary);
      const candidates: Record<string, unknown>[] = [
        { normalizedName },
        { [definition.primaryField]: primary },
      ];
      if (generatedSlug) candidates.push({ slug: generatedSlug });
      if (typeof resolved.code === "string") {
        candidates.push({ code: normalizeCode(resolved.code) });
      }
      const found = await model
        .findOne({ $or: candidates })
        .select("+normalizedName")
        .lean()
        .exec();
      if (found) {
        const backfill = buildSeedBackfill(
          found,
          resolved,
          definition,
          normalizedName,
        );
        const seedSlug =
          typeof resolved.slug === "string" ? resolved.slug : generatedSlug;
        if (!found.slug && seedSlug) backfill.slug = seedSlug;
        if (!found.code && typeof resolved.code === "string") {
          backfill.code = normalizeCode(resolved.code);
        }
        if (found.isActive === undefined) backfill.isActive = true;
        if (found.sortOrder === undefined) {
          backfill.sortOrder = resolved.sortOrder ?? 0;
        }
        if (Object.keys(backfill).length) {
          await model.updateOne({ _id: found._id }, { $set: backfill }).exec();
        }
        existing += 1;
        continue;
      }
      try {
        const payload = await this.preparePayload(
          definition,
          resolved as ResourceInput,
          true,
        );
        await model.create(payload);
        created += 1;
      } catch (error) {
        if (!isDuplicateKey(error)) throw error;
        existing += 1;
      }
    }
    return { created, existing, dependenciesCreated };
  }

  private async resolveSeedRelations(
    definition: ServerResourceDefinition,
    seed: ResourceSeedRecord,
  ): Promise<Record<string, string | number | boolean | string[]>> {
    const resolved: Record<string, string | number | boolean | string[]> = {};
    for (const [key, value] of Object.entries(seed)) {
      resolved[key] =
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
          ? value
          : [...value];
    }
    for (const field of definition.fields) {
      if (!field.target || resolved[field.name] === undefined) continue;
      const target = this.requireDefinition(
        field.target.category,
        field.target.resource,
      );
      const references = Array.isArray(resolved[field.name])
        ? (resolved[field.name] as string[])
        : [String(resolved[field.name])];
      const ids: string[] = [];
      for (const reference of references) {
        const value = reference.startsWith("@")
          ? reference.slice(1)
          : reference;
        const targetDocument = await this.getModel(target)
          .findOne({
            $or: [
              { code: normalizeCode(value) },
              { normalizedName: normalizeText(value) },
            ],
            isActive: true,
          })
          .lean()
          .exec();
        if (!targetDocument) {
          throw new AppError(
            500,
            "RESOURCE_SEED_DEPENDENCY_MISSING",
            `Seed dependency ${value} is missing`,
          );
        }
        ids.push(String(targetDocument._id));
      }
      resolved[field.name] =
        field.kind === "relation-list" ? ids : (ids[0] ?? "");
    }
    return resolved;
  }

  private async seedSampleArticles(): Promise<number> {
    const categoryDefinition = this.requireDefinition(
      "content",
      "article-category",
    );
    const categoryModel = this.getModel(categoryDefinition);
    const samples = [
      {
        title: "راهنمای شروع بدنسازی برای مبتدی‌ها",
        slug: "bodybuilding-guide-for-beginners",
        categoryCode: "TRAINING",
        excerpt: "چطور تمرین بدنسازی را ایمن و اصولی شروع کنیم.",
        bodyHtml:
          "<p>برای شروع، سه جلسه تمرین سبک در هفته کافی است. فرم صحیح حرکات را در اولویت قرار دهید و به بدن فرصت بازیابی بدهید.</p>",
      },
      {
        title: "تغذیه مناسب قبل و بعد از تمرین",
        slug: "nutrition-before-and-after-workout",
        categoryCode: "NUTRITION",
        excerpt: "چند انتخاب ساده برای انرژی بهتر و ریکاوری سریع‌تر.",
        bodyHtml:
          "<p>پیش از تمرین یک وعده سبک حاوی کربوهیدرات و پس از تمرین ترکیبی از پروتئین، آب و کربوهیدرات مصرف کنید.</p>",
      },
      {
        title: "چرا گرم‌کردن قبل از ورزش مهم است؟",
        slug: "why-warm-up-matters",
        categoryCode: "HEALTH",
        excerpt:
          "گرم‌کردن مناسب کیفیت تمرین را بالا می‌برد و ریسک آسیب را کاهش می‌دهد.",
        bodyHtml:
          "<p>پنج تا ده دقیقه فعالیت هوازی سبک و حرکات پویا، بدن را برای بخش اصلی تمرین آماده می‌کند.</p>",
      },
    ] as const;
    let created = 0;
    for (const sample of samples) {
      const category = await categoryModel
        .findOne({ code: sample.categoryCode, isActive: true })
        .lean()
        .exec();
      if (!category) continue;
      const result = await this.connection.collection("articles").updateOne(
        { slug: sample.slug },
        {
          $setOnInsert: {
            title: sample.title,
            slug: sample.slug,
            authorName: "تیم محتوای Gym4Me",
            categoryId: category._id,
            excerpt: sample.excerpt,
            bodyHtml: sample.bodyHtml,
            status: "published",
            publishedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
      if (result.upsertedCount) created += 1;
    }
    return created;
  }

  private requireDefinition(
    category: string,
    segment: string,
  ): ServerResourceDefinition {
    const definition = getServerResource(category, segment);
    if (!definition)
      throw new AppError(
        404,
        "RESOURCE_TYPE_NOT_FOUND",
        "Resource type not found",
      );
    return definition;
  }

  private getModel(
    definition: ServerResourceDefinition,
  ): Model<ResourceDocument> {
    const modelName = `Resource_${definition.key}`;
    const existing = this.connection.models[modelName] as
      Model<ResourceDocument> | undefined;
    if (existing) return existing;

    const shape: SchemaDefinition = {
      code: { type: String, trim: true },
      slug: { type: String, trim: true },
      name: { type: String, trim: true },
      normalizedName: { type: String, select: false },
      description: { type: String, trim: true },
      icon: { type: String, trim: true },
      imageUrl: { type: String, trim: true },
      isActive: { type: Boolean, default: true, index: true },
      sortOrder: { type: Number, min: 0, default: 0, index: true },
      aliases: [{ type: String, trim: true }],
    };
    for (const field of definition.fields)
      shape[field.name] = schemaForField(field);
    const schema = new Schema(shape, {
      collection: definition.collection,
      timestamps: true,
      strict: "throw",
    });
    schema.index({ code: 1 }, { unique: true, sparse: true });
    schema.index({ slug: 1 }, { unique: true, sparse: true });
    schema.index({ normalizedName: 1 }, { unique: true, sparse: true });
    return this.connection.model<ResourceDocument>(
      modelName,
      schema,
      definition.collection,
    );
  }

  private async preparePayload(
    definition: ServerResourceDefinition,
    body: ResourceInput,
    creating: boolean,
  ): Promise<Record<string, unknown>> {
    const allowed = new Set<string>(BASE_FIELDS);
    definition.fields.forEach((field) => allowed.add(field.name));
    const payload: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(body)) {
      if (!allowed.has(key) || raw === undefined)
        throw new AppError(
          400,
          "RESOURCE_FIELD_NOT_ALLOWED",
          `Field ${key} is not allowed`,
        );
      payload[key] = normalizeValue(
        key,
        raw,
        definition.fields.find((field) => field.name === key),
      );
    }

    const primaryValue = payload[definition.primaryField];
    if (creating && (typeof primaryValue !== "string" || !primaryValue)) {
      throw new AppError(
        400,
        "RESOURCE_NAME_REQUIRED",
        `${definition.primaryField} is required`,
      );
    }
    if (
      creating &&
      requiresCode(definition) &&
      (typeof payload.code !== "string" || !payload.code)
    ) {
      throw new AppError(400, "RESOURCE_CODE_REQUIRED", "code is required");
    }
    for (const field of definition.fields) {
      if (creating && field.required && payload[field.name] === undefined) {
        throw new AppError(
          400,
          "RESOURCE_FIELD_REQUIRED",
          `${field.name} is required`,
        );
      }
      if (
        payload[field.name] !== undefined &&
        (field.kind === "relation" || field.kind === "relation-list")
      ) {
        await this.assertActiveRelation(field, payload[field.name]);
      }
    }

    if (typeof primaryValue === "string") {
      payload.normalizedName = normalizeText(primaryValue);
      if (definition.primaryField !== "name" && payload.name === undefined)
        payload.name = primaryValue;
    }
    if (typeof payload.code === "string")
      payload.code = normalizeCode(payload.code);
    if (creating && !payload.slug && typeof primaryValue === "string")
      payload.slug = slugify(primaryValue);
    if (creating) {
      if (payload.isActive === undefined) payload.isActive = true;
      if (payload.sortOrder === undefined) payload.sortOrder = 0;
    }
    validateRanges(definition, payload);
    return payload;
  }

  private async assertActiveRelation(
    field: ServerResourceField,
    value: unknown,
  ) {
    if (!field.target) return;
    const target = this.requireDefinition(
      field.target.category,
      field.target.resource,
    );
    const ids = Array.isArray(value) ? value : [value];
    if (!ids.length && field.required)
      throw new AppError(
        400,
        "RESOURCE_RELATION_REQUIRED",
        `${field.name} is required`,
      );
    const objectIds = ids.map((id) =>
      toObjectId(id, "RESOURCE_RELATION_INVALID"),
    );
    const count = await this.getModel(target)
      .countDocuments({ _id: { $in: objectIds }, isActive: true })
      .exec();
    if (count !== objectIds.length)
      throw new AppError(
        400,
        "RESOURCE_RELATION_INACTIVE",
        `Invalid or inactive ${field.name}`,
      );
  }

  private async assertNotReferenced(
    definition: ServerResourceDefinition,
    id: Types.ObjectId,
  ) {
    for (const candidate of serverResourceDefinitions) {
      for (const field of candidate.fields) {
        if (
          field.target?.category === definition.category &&
          field.target.resource === definition.segment
        ) {
          if (await this.getModel(candidate).exists({ [field.name]: id })) {
            throw new AppError(
              409,
              "RESOURCE_IN_USE",
              "Resource is referenced and cannot be deleted",
            );
          }
        }
      }
    }
    if (definition.key === "article_categories") {
      const used = await this.connection
        .collection("articles")
        .findOne({ categoryId: id }, { projection: { _id: 1 } });
      if (used)
        throw new AppError(
          409,
          "RESOURCE_IN_USE",
          "Article category is in use",
        );
    }
  }

  private async findById(
    model: Model<ResourceDocument>,
    id: string,
  ): Promise<ResourceDocument | null> {
    if (!Types.ObjectId.isValid(id))
      throw new AppError(400, "INVALID_OBJECT_ID", "Invalid resource id");
    return model.findById(id).lean().exec() as Promise<ResourceDocument | null>;
  }

  private throwDuplicate(error: unknown): void {
    if (!isDuplicateKey(error)) return;
    const key = Object.keys(error.keyPattern ?? {})[0] ?? "value";
    const code =
      key === "code"
        ? "RESOURCE_CODE_TAKEN"
        : key === "slug"
          ? "RESOURCE_SLUG_TAKEN"
          : "RESOURCE_NAME_TAKEN";
    throw new AppError(409, code, `Resource ${key} already exists`);
  }
}

function schemaForField(field: ServerResourceField): SchemaDefinitionProperty {
  if (field.kind === "number")
    return { type: Number, min: 0, required: field.required };
  if (field.kind === "date") return { type: Date, required: field.required };
  if (field.kind === "relation")
    return {
      type: Schema.Types.ObjectId,
      required: field.required,
      index: true,
    };
  if (field.kind === "relation-list") return [{ type: Schema.Types.ObjectId }];
  if (field.kind === "string-list") return [{ type: String, trim: true }];
  if (field.kind === "enum")
    return { type: String, enum: field.options, required: field.required };
  return { type: String, trim: true, required: field.required };
}

function normalizeValue(
  key: string,
  value: unknown,
  field?: ServerResourceField,
): unknown {
  if (typeof value === "string") {
    const result = value.trim();
    if (/<\/?[a-z][\s\S]*>/i.test(result))
      throw new AppError(
        400,
        "HTML_NOT_ALLOWED",
        `HTML is not allowed in ${key}`,
      );
    if (field?.kind === "url" || key === "imageUrl") {
      if (!isValidResourceUrl(result)) {
        throw new AppError(400, "INVALID_URL", `${key} must be a valid URL`);
      }
    }
    if (field?.kind === "relation")
      return toObjectId(result, "RESOURCE_RELATION_INVALID");
    if (field?.kind === "date") {
      const date = new Date(result);
      if (Number.isNaN(date.getTime()))
        throw new AppError(400, "INVALID_DATE", `${key} must be a valid date`);
      return date;
    }
    return result;
  }
  if (Array.isArray(value)) {
    const strings = [
      ...new Set(value.map((item) => item.trim()).filter(Boolean)),
    ];
    return field?.kind === "relation-list"
      ? strings.map((item) => toObjectId(item, "RESOURCE_RELATION_INVALID"))
      : strings;
  }
  if (
    key === "sortOrder" &&
    (typeof value !== "number" || !Number.isInteger(value) || value < 0)
  )
    throw new AppError(
      400,
      "INVALID_SORT_ORDER",
      "sortOrder must be a non-negative integer",
    );
  if (
    field?.kind === "number" &&
    (typeof value !== "number" || !Number.isFinite(value) || value < 0)
  )
    throw new AppError(
      400,
      "INVALID_NUMBER",
      `${key} must be a non-negative number`,
    );
  return value;
}

function validateRanges(
  definition: ServerResourceDefinition,
  payload: Record<string, unknown>,
): void {
  if (
    definition.key === "age_group_presets" &&
    typeof payload.minAge === "number" &&
    typeof payload.maxAge === "number" &&
    payload.minAge > payload.maxAge
  ) {
    throw new AppError(400, "INVALID_AGE_RANGE", "minAge cannot exceed maxAge");
  }
  if (
    payload.startsAt instanceof Date &&
    payload.endsAt instanceof Date &&
    payload.startsAt > payload.endsAt
  ) {
    throw new AppError(
      400,
      "INVALID_DATE_RANGE",
      "startsAt cannot exceed endsAt",
    );
  }
}

function normalizeText(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .toLocaleLowerCase("fa");
}
function buildSeedBackfill(
  found: Record<string, unknown>,
  resolved: Record<string, string | number | boolean | string[]>,
  definition: ServerResourceDefinition,
  normalizedName: string,
): Record<string, unknown> {
  const backfill: Record<string, unknown> = {};
  if (!found.normalizedName) {
    const existingPrimary = found[definition.primaryField];
    backfill.normalizedName =
      typeof existingPrimary === "string"
        ? normalizeText(existingPrimary)
        : normalizedName;
  }
  for (const [key, value] of Object.entries(resolved)) {
    if (
      key === definition.primaryField ||
      key === "name" ||
      key === "code" ||
      key === "slug" ||
      key === "sortOrder" ||
      key === "isActive"
    ) {
      continue;
    }
    if (isMissingSeedValue(found[key])) backfill[key] = value;
  }
  return backfill;
}
function isMissingSeedValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}
function isValidResourceUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
function normalizeCode(value: string): string {
  return value.trim().replace(/\s+/g, "_").toUpperCase();
}
function requiresCode(definition: ServerResourceDefinition): boolean {
  return (
    !definition.specialized ||
    definition.key === "badge_types" ||
    definition.key === "pricing_models"
  );
}
function toObjectId(value: unknown, code: string): Types.ObjectId {
  if (value instanceof Types.ObjectId) return value;
  if (typeof value !== "string" || !Types.ObjectId.isValid(value))
    throw new AppError(400, code, "Invalid resource relation");
  return new Types.ObjectId(value);
}
function parseBoolean(value: string): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new AppError(400, "INVALID_FILTER", "isActive must be true or false");
}
function parseInteger(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max)
    throw new AppError(400, "INVALID_PAGINATION", "Invalid pagination value");
  return parsed;
}
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function toPublicResource(value: unknown): Record<string, unknown> {
  const source =
    typeof value === "object" && value !== null && "toObject" in value
      ? (value as { toObject(): Record<string, unknown> }).toObject()
      : (value as Record<string, unknown>);
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(source)) {
    if (key === "_id") result.id = String(item);
    else if (key !== "__v" && key !== "normalizedName")
      result[key] = serialize(item);
  }
  return result;
}
function serialize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Types.ObjectId) return String(value);
  if (Array.isArray(value)) return value.map(serialize);
  return value;
}
function isDuplicateKey(
  error: unknown,
): error is { code: number; keyPattern?: Record<string, unknown> } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}
