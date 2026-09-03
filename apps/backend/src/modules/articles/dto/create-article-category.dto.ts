import { z } from "zod";

const CreateArticleCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120).optional(),
});

export class CreateArticleCategoryDto {
  static schema = CreateArticleCategorySchema;
  name: string;
  slug?: string;
}
