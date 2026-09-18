import { z } from "zod";

import { ARTICLE_STATUSES } from "../schemas/article.schema";

const coverImageUrl = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) =>
      value === "" ||
      (/^https?:\/\//i.test(value) && z.url().safeParse(value).success),
    "Invalid cover image URL",
  );

const CreateArticleSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200).optional(),
  authorId: z.string().regex(/^[a-f\d]{24}$/i),
  authorName: z.string().trim().min(1).max(120),
  categoryId: z.string().trim().min(1),
  excerpt: z.string().trim().max(500).optional(),
  bodyHtml: z.string().max(200_000).optional(),
  coverImageUrl: coverImageUrl.optional(),
  status: z.enum(ARTICLE_STATUSES).optional(),
});

export class CreateArticleDto {
  static schema = CreateArticleSchema;
  title: string;
  slug?: string;
  authorId: string;
  authorName: string;
  categoryId: string;
  excerpt?: string;
  bodyHtml?: string;
  coverImageUrl?: string;
  status?: (typeof ARTICLE_STATUSES)[number];
}
