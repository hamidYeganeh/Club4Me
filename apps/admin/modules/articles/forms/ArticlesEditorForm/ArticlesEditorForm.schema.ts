import { z } from "zod";

type Messages = {
  titleRequired: string;
  authorRequired: string;
  categoryRequired: string;
};

export function createArticlesEditorFormSchema(messages: Messages) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, messages.titleRequired)
      .max(200, "عنوان باید حداکثر ۲۰۰ نویسه باشد."),
    authorId: z.string().trim().min(1, messages.authorRequired),
    authorName: z
      .string()
      .trim()
      .min(1, messages.authorRequired)
      .max(120, "نام نویسنده باید حداکثر ۱۲۰ نویسه باشد."),
    categoryId: z.string().trim().min(1, messages.categoryRequired),
    slug: z.string().trim().max(200, "اسلاگ باید حداکثر ۲۰۰ نویسه باشد."),
    excerpt: z.string().trim().max(500),
    bodyHtml: z.string().max(200_000, "متن مقاله بیش از حد طولانی است."),
    coverImageUrl: z.string(),
    status: z.enum(["draft", "published"]),
  });
}

export type ArticlesEditorFormSchema = ReturnType<
  typeof createArticlesEditorFormSchema
>;
