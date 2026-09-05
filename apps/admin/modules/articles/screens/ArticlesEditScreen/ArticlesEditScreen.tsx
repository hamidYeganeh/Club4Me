"use client";

import { Button, Spinner, toast } from "@heroui/react";
import {
  useArticle,
  useArticleCategories,
  useDeleteArticle,
  useUpdateArticle,
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

type ArticlesEditScreenProps = {
  articleId: string;
};

export function ArticlesEditScreen({ articleId }: ArticlesEditScreenProps) {
  const t = useTranslations("articlesPage");
  const router = useRouter();
  const article = useArticle(articleId);
  const categories = useArticleCategories();
  const updateArticle = useUpdateArticle();
  const deleteArticle = useDeleteArticle();

  const handleDelete = async () => {
    if (!window.confirm("این مقاله برای همیشه حذف شود؟")) return;
    try {
      await deleteArticle.mutateAsync(articleId);
      toast.success("مقاله حذف شد");
      router.replace("/articles");
    } catch (error) {
      toast.danger("حذف مقاله انجام نشد", {
        description: error instanceof ApiError ? error.message : undefined,
      });
    }
  };

  const handleSubmit = async (values: ArticlesEditorFormValues) => {
    try {
      await updateArticle.mutateAsync({
        id: articleId,
        title: values.title,
        authorName: values.authorName,
        categoryId: values.categoryId,
        slug: values.slug || undefined,
        excerpt: values.excerpt,
        bodyHtml: values.bodyHtml,
        coverImageUrl: values.coverImageUrl,
        status: values.status,
      });
      toast.success(t("saveSuccess"));
    } catch (error) {
      toast.danger(t("saveError"), {
        description:
          error instanceof ApiError ? error.message : undefined,
      });
    }
  };

  if (article.isPending || categories.isPending) {
    return (
      <main className="flex flex-1 items-center justify-center p-4 lg:p-6">
        <Spinner />
      </main>
    );
  }

  if (article.isError || !article.data) {
    return (
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <p className="text-muted">{t("loadError")}</p>
        <ButtonLink href="/articles" variant="ghost" className="mt-4">
          {t("back")}
        </ButtonLink>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <ButtonLink href="/articles" variant="ghost" isIconOnly aria-label={t("back")}>
          <Icon name="arrow-right" size="md" />
        </ButtonLink>
        <h1 className="text-2xl font-semibold">{t("edit")}</h1>
        <Button
          variant="danger-soft"
          className="ms-auto"
          isPending={deleteArticle.isPending}
          onPress={() => void handleDelete()}
        >
          حذف مقاله
        </Button>
      </div>

      <ArticlesEditorForm
        mode="edit"
        defaultValues={{
          title: article.data.title,
          authorName: article.data.authorName,
          categoryId: article.data.categoryId,
          slug: article.data.slug,
          excerpt: article.data.excerpt,
          bodyHtml: article.data.bodyHtml,
          coverImageUrl: article.data.coverImageUrl,
          status: article.data.status,
        }}
        categories={categories.data?.items ?? []}
        categoriesLoading={categories.isPending}
        isSubmitting={updateArticle.isPending}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
