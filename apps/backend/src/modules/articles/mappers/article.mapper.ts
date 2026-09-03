import { toIso } from "../../../lib/time";
import type { ArticleDocument, ArticleStatus } from "../schemas/article.schema";

export type PublicArticle = {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  categoryId: string;
  categoryName: string;
  excerpt: string;
  bodyHtml: string;
  coverImageUrl?: string;
  status: ArticleStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toPublicArticle(
  article: ArticleDocument,
  categoryName: string,
): PublicArticle {
  return {
    id: String(article._id),
    title: article.title,
    slug: article.slug,
    authorName: article.authorName,
    categoryId: String(article.categoryId),
    categoryName,
    excerpt: article.excerpt ?? "",
    bodyHtml: article.bodyHtml ?? "",
    ...(article.coverImageUrl ? { coverImageUrl: article.coverImageUrl } : {}),
    status: article.status,
    publishedAt: article.publishedAt ? toIso(article.publishedAt) : null,
    createdAt: toIso(article.createdAt),
    updatedAt: toIso(article.updatedAt),
  };
}
