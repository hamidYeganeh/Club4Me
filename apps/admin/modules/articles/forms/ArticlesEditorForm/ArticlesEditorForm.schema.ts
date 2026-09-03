import { z } from "zod";

type Messages = {
  titleRequired: string;
  authorRequired: string;
  categoryRequired: string;
};

export function createArticlesEditorFormSchema(messages: Messages) {
  return z.object({
    title: z.string().trim().min(1, messages.titleRequired),
    authorName: z.string().trim().min(1, messages.authorRequired),
    categoryId: z.string().trim().min(1, messages.categoryRequired),
    slug: z.string().trim(),
    excerpt: z.string().trim().max(500),
    bodyHtml: z.string(),
    status: z.enum(["draft", "published"]),
  });
}

export type ArticlesEditorFormSchema = ReturnType<
  typeof createArticlesEditorFormSchema
>;
