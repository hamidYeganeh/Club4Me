import { z } from "zod";

import { MAX_INLINE_IMAGE_URL_LENGTH } from "../../media/media.constants";
import { ARTICLE_STATUSES } from "../schemas/article.schema";

const coverImageUrl = z
  .string()
  .trim()
  .max(MAX_INLINE_IMAGE_URL_LENGTH)
  .refine(
    (value) =>
      value === "" ||
      (value.startsWith("data:image/") && value.includes(";base64,")) ||
      z.url().safeParse(value).success,
    "Invalid cover image URL",
  );

const UpdateArticleSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  slug: z.string().trim().min(1).max(200).optional(),
  authorName: z.string().trim().min(1).max(120).optional(),
  categoryId: z.string().trim().min(1).optional(),
  excerpt: z.string().trim().max(500).optional(),
  bodyHtml: z.string().max(200_000).optional(),
  coverImageUrl: coverImageUrl.optional(),
  status: z.enum(ARTICLE_STATUSES).optional(),
});

export class UpdateArticleDto {
  static schema = UpdateArticleSchema;
  title?: string;
  slug?: string;
  authorName?: string;
  categoryId?: string;
  excerpt?: string;
  bodyHtml?: string;
  coverImageUrl?: string;
  status?: (typeof ARTICLE_STATUSES)[number];
}
