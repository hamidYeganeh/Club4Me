import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { slugify } from "./lib/slugify";
import {
  toPublicArticleCategory,
  type PublicArticleCategory,
} from "./mappers/article-category.mapper";
import {
  ArticleCategory,
  type ArticleCategoryDocument,
} from "./schemas/article-category.schema";

@Injectable()
export class ArticleCategoriesRepository {
  constructor(
    @InjectModel(ArticleCategory.name)
    private readonly categoryModel: Model<ArticleCategoryDocument>,
  ) {}

  async listAll(): Promise<PublicArticleCategory[]> {
    const categories = await this.categoryModel.find().sort({ name: 1 }).exec();

    return categories.map(toPublicArticleCategory);
  }

  async create(input: {
    name: string;
    slug?: string;
  }): Promise<PublicArticleCategory> {
    const slug = input.slug?.trim() || slugify(input.name);

    if (!slug) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid category slug");
    }

    try {
      const created = await this.categoryModel.create({
        name: input.name.trim(),
        slug,
        code: slug.toUpperCase().replace(/-/g, "_"),
        normalizedName: normalizeName(input.name),
      });
      return toPublicArticleCategory(created);
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new AppError(
          409,
          "CATEGORY_SLUG_TAKEN",
          "Category slug already exists",
        );
      }
      throw error;
    }
  }

  async findDocumentById(id: string): Promise<ArticleCategoryDocument | null> {
    if (!isObjectId(id)) {
      return null;
    }

    return this.categoryModel.findById(id).exec();
  }

  async getNameById(id: string): Promise<string | null> {
    const category = await this.findDocumentById(id);
    return category?.name ?? null;
  }

  async getNamesByIds(ids: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(ids.filter(isObjectId))];
    if (unique.length === 0) {
      return new Map();
    }

    const categories = await this.categoryModel
      .find({ _id: { $in: unique } })
      .exec();

    return new Map(
      categories.map((category) => [String(category._id), category.name]),
    );
  }
}

function normalizeName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .toLocaleLowerCase("fa");
}

function isObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}
