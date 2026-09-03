import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import { sanitizeHtml } from "./lib/sanitize-html";
import { slugify } from "./lib/slugify";
import { toPublicArticle, type PublicArticle } from "./mappers/article.mapper";
import {
  Article,
  type ArticleDocument,
  type ArticleStatus,
} from "./schemas/article.schema";

type CreateArticleInput = {
  title: string;
  slug?: string;
  authorName: string;
  categoryId: string;
  excerpt?: string;
  bodyHtml?: string;
  coverImageUrl?: string;
  status?: ArticleStatus;
};

type UpdateArticleInput = {
  title?: string;
  slug?: string;
  authorName?: string;
  categoryId?: string;
  excerpt?: string;
  bodyHtml?: string;
  coverImageUrl?: string;
  status?: ArticleStatus;
};

@Injectable()
export class ArticlesRepository {
  constructor(
    @InjectModel(Article.name)
    private readonly articleModel: Model<ArticleDocument>,
  ) {}

  async listRecent(
    categoryNames: Map<string, string>,
    limit = 100,
  ): Promise<PublicArticle[]> {
    const articles = await this.articleModel
      .find()
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();

    return articles.map((article) =>
      toPublicArticle(
        article,
        categoryNames.get(String(article.categoryId)) ?? "",
      ),
    );
  }

  async findById(
    id: string,
    categoryName: string,
  ): Promise<PublicArticle | null> {
    const article = await this.findDocumentById(id);
    if (!article) {
      return null;
    }

    return toPublicArticle(article, categoryName);
  }

  async create(
    input: CreateArticleInput,
    categoryName: string,
  ): Promise<PublicArticle> {
    const slug = resolveSlug(input.slug, input.title);
    const status = input.status ?? "draft";
    const coverImageUrl = normalizeOptionalUrl(input.coverImageUrl);

    try {
      const created = await this.articleModel.create({
        title: input.title.trim(),
        slug,
        authorName: input.authorName.trim(),
        categoryId: toObjectId(input.categoryId, "CATEGORY_NOT_FOUND"),
        excerpt: input.excerpt?.trim() ?? "",
        bodyHtml: sanitizeHtml(input.bodyHtml ?? ""),
        ...(coverImageUrl ? { coverImageUrl } : {}),
        status,
        publishedAt: status === "published" ? new Date() : null,
      });

      return toPublicArticle(created, categoryName);
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new AppError(
          409,
          "ARTICLE_SLUG_TAKEN",
          "Article slug already exists",
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    input: UpdateArticleInput,
    categoryName: string,
  ): Promise<PublicArticle> {
    const article = await this.findDocumentById(id);
    if (!article) {
      throw new AppError(404, "ARTICLE_NOT_FOUND", "Article not found");
    }

    if (input.title !== undefined) {
      article.title = input.title.trim();
    }

    if (input.slug !== undefined) {
      article.slug = resolveSlug(input.slug, article.title);
    }

    if (input.authorName !== undefined) {
      article.authorName = input.authorName.trim();
    }

    if (input.categoryId !== undefined) {
      article.categoryId = toObjectId(input.categoryId, "CATEGORY_NOT_FOUND");
    }

    if (input.excerpt !== undefined) {
      article.excerpt = input.excerpt.trim();
    }

    if (input.bodyHtml !== undefined) {
      article.bodyHtml = sanitizeHtml(input.bodyHtml);
    }

    if (input.coverImageUrl !== undefined) {
      const coverImageUrl = normalizeOptionalUrl(input.coverImageUrl);
      if (coverImageUrl) {
        article.coverImageUrl = coverImageUrl;
      } else {
        article.coverImageUrl = undefined;
      }
    }

    if (input.status !== undefined) {
      if (input.status === "published" && article.status !== "published") {
        article.publishedAt = new Date();
      }
      if (input.status === "draft") {
        article.publishedAt = null;
      }
      article.status = input.status;
    }

    try {
      await article.save();
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new AppError(
          409,
          "ARTICLE_SLUG_TAKEN",
          "Article slug already exists",
        );
      }
      throw error;
    }

    return toPublicArticle(article, categoryName);
  }

  async delete(id: string): Promise<void> {
    const result = await this.articleModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new AppError(404, "ARTICLE_NOT_FOUND", "Article not found");
    }
  }

  private async findDocumentById(id: string): Promise<ArticleDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.articleModel.findById(id).exec();
  }
}

function resolveSlug(slug: string | undefined, title: string): string {
  const value = (slug?.trim() || slugify(title)).trim();
  if (!value) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid article slug");
  }
  return value;
}

function normalizeOptionalUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function toObjectId(id: string, code: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(404, code, "Resource not found");
  }

  return new Types.ObjectId(id);
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}
