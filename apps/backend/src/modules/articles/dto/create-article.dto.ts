import { z } from "zod";

import { ARTICLE_STATUSES } from "../schemas/article.schema";

const CreateArticleSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200).optional(),
  authorName: z.string().trim().min(1).max(120),
  categoryId: z.string().trim().min(1),
  excerpt: z.string().trim().max(500).optional(),
  bodyHtml: z.string().max(200_000).optional(),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
  status: z.enum(ARTICLE_STATUSES).optional(),
});

export class CreateArticleDto {
  static schema = CreateArticleSchema;
  title: string;
  slug?: string;
  authorName: string;
  categoryId: string;
  excerpt?: string;
  bodyHtml?: string;
  coverImageUrl?: string;
  status?: (typeof ARTICLE_STATUSES)[number];
}
