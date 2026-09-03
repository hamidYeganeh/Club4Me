import { toIso } from "../../../lib/time";
import type { ArticleCategoryDocument } from "../schemas/article-category.schema";

export type PublicArticleCategory = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export function toPublicArticleCategory(
  category: ArticleCategoryDocument,
): PublicArticleCategory {
  return {
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    createdAt: toIso(category.createdAt),
    updatedAt: toIso(category.updatedAt),
  };
}
