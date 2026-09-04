"use client";

import { Typography } from "@heroui/react";
import { ArticleCard, type ArticleCardTag } from "@ui/article-card";

const SAMPLE_TAGS: ArticleCardTag[] = [
  { id: "category-training", label: "Text", kind: "category" },
  { id: "type-guide", label: "Text", kind: "type" },
  { id: "type-beginner", label: "Text", kind: "type" },
];

const SAMPLE = {
  title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  description:
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat...",
  authorName: "Author Name",
  authorAvatarUrl: "https://img.heroui.chat/image/avatar?w=200&h=200&u=3",
  readTime: "3m read",
  badge: "Text",
  tags: SAMPLE_TAGS,
};

export function ArticlesPreviewScreen() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(6.25rem+env(safe-area-inset-bottom))]">
      <Typography type="h2">Article Card</Typography>

      <section className="flex flex-col gap-4">
        <Typography type="h5">Vertical</Typography>
        <div className="grid gap-4 sm:grid-cols-2">
          <ArticleCard
            {...SAMPLE}
            orientation="vertical"
            onMenuPress={() => undefined}
          />
          <ArticleCard
            {...SAMPLE}
            orientation="vertical"
            outlined
            onMenuPress={() => undefined}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <Typography type="h5">Horizontal</Typography>
        <div className="flex flex-col gap-4">
          <ArticleCard
            {...SAMPLE}
            orientation="horizontal"
            onMenuPress={() => undefined}
          />
          <ArticleCard
            {...SAMPLE}
            orientation="horizontal"
            outlined
            onMenuPress={() => undefined}
          />
        </div>
      </section>
    </main>
  );
}
