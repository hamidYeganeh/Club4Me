"use client";

import { Spinner, toast } from "@heroui/react";
import {
  useArticleCategories,
  useCreateArticle,
} from "@api/articles";
import { ApiError } from "@api";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { ButtonLink } from "@/components/button-link";
import {
  ArticlesEditorForm,
  type ArticlesEditorFormValues,
} from "@modules/articles/forms/ArticlesEditorForm";

export function ArticlesCreateScreen() {
  const t = useTranslations("articlesPage");
  const router = useRouter();
  const categories = useArticleCategories();
  const createArticle = useCreateArticle();

  const handleSubmit = async (values: ArticlesEditorFormValues) => {
    try {
      const article = await createArticle.mutateAsync({
        title: values.title,
        authorName: values.authorName,
        categoryId: values.categoryId,
        slug: values.slug || undefined,
        excerpt: values.excerpt,
        bodyHtml: values.bodyHtml,
        status: values.status,
      });
      toast.success(t("saveSuccess"));
      router.replace(`/articles/${article.id}`);
    } catch (error) {
      toast.danger(t("saveError"), {
        description:
          error instanceof ApiError ? error.message : undefined,
      });
    }
  };

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <ButtonLink href="/articles" variant="ghost" isIconOnly aria-label={t("back")}>
          <Icon name="arrow-right" size="md" />
        </ButtonLink>
        <h1 className="text-2xl font-semibold">{t("new")}</h1>
      </div>

      {categories.isPending ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <ArticlesEditorForm
          mode="create"
          categories={categories.data?.items ?? []}
          categoriesLoading={categories.isPending}
          isSubmitting={createArticle.isPending}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}
