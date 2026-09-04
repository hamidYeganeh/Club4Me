"use client";

import { Button, Spinner } from "@heroui/react";
import { useArticles } from "@api/articles";
import { Icon } from "@theme/icon";
import { ArticleCard } from "@ui/article-card";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { ButtonLink } from "@/components/button-link";

export function ArticlesScreen() {
  const t = useTranslations("articlesPage");
  const router = useRouter();
  const articles = useArticles();
  const items = articles.data?.items ?? [];

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <ButtonLink href="/articles/new" variant="primary">
          <Icon name="plus-fat" size="sm" />
          {t("new")}
        </ButtonLink>
      </div>

      {articles.isPending ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : articles.isError ? (
        <p className="px-6 py-12 text-center text-muted">{t("error")}</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-12">
          <p className="text-center text-muted">{t("empty")}</p>
          <Button variant="primary" onPress={() => router.push("/articles/new")}>
            {t("new")}
          </Button>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          {items.map((item) => (
            <ArticleCard
              key={item.id}
              title={item.title}
              description={item.excerpt}
              coverImageUrl={item.coverImageUrl}
              badge={item.categoryName}
              authorName={item.authorName}
              readTime={new Intl.DateTimeFormat("fa-IR", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(item.updatedAt))}
              tags={[
                {
                  id: `${item.id}-category`,
                  label: item.categoryName,
                  kind: "category",
                },
                {
                  id: `${item.id}-status`,
                  label:
                    item.status === "published" ? t("published") : t("draft"),
                  kind: "type",
                },
              ]}
              tagsLabel={t("category")}
              orientation="horizontal"
              outlined
              href={`/articles/${item.id}`}
            />
          ))}
        </div>
      )}
    </main>
  );
}
