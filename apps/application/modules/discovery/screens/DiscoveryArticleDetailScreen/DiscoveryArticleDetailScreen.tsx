"use client";

import { SaveButton } from "@/components/save-button";
import Link from "next/link";
import { Button } from "@heroui/react";
import { Icon } from "@theme/icon";
import { useCatalogArticle } from "@api/discovery";

import { FallbackImage } from "@/components/FallbackImage";
import { ArticleDetailSkeleton } from "@/components/loading-skeletons";

export function DiscoveryArticleDetailScreen({
  articleId,
}: {
  articleId: string;
}) {
  const query = useCatalogArticle(articleId);

  if (query.isPending) {
    return <ArticleDetailSkeleton />;
  }
  if (query.isError || !query.data) {
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="text-sm text-muted">
            این مقاله پیدا نشد یا منتشر نشده است.
          </p>
          <Button className="mt-4" onPress={() => void query.refetch()}>
            تلاش دوباره
          </Button>
        </div>
      </main>
    );
  }

  const article = query.data;
  return (
    <main className="min-h-dvh bg-background pb-[calc(3rem+env(safe-area-inset-bottom))]">
      <div className="fixed inset-x-0 top-0 z-40 mx-auto flex h-[calc(64px+env(safe-area-inset-top))] max-w-xl items-end justify-between bg-linear-to-b from-background/90 to-transparent px-5 pb-2 pt-[env(safe-area-inset-top)] backdrop-blur-[2px]">
        <Link
          href="/discovery/articles"
          aria-label="بازگشت به مقالات"
          className="app-icon-button"
        >
          <Icon name="chevron-right" size={22} />
        </Link>
        <SaveButton entityType="article" entityId={article.id} />
      </div>

      <article>
        <div className="relative aspect-[4/5] max-h-[34rem] overflow-hidden bg-surface-secondary">
          <FallbackImage
            src={article.coverImageUrl}
            alt={article.title}
            fill
            priority
            unoptimized
            sizes="(max-width: 576px) 100vw, 576px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/15 to-background/10" />
          <header className="absolute inset-x-0 bottom-0 px-5 pb-7">
            <h1 className="max-w-lg text-3xl leading-[1.3] font-black tracking-tight text-white drop-shadow-sm">
              {article.title}
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/78">
              {article.excerpt}
            </p>
          </header>
        </div>
        <div className="px-5">
          <div className="border-b border-white/8 py-5">
            <p className="text-sm font-bold">{article.authorName}</p>
            {article.publishedAt ? (
              <p className="mt-1 text-xs text-muted">
                {new Date(article.publishedAt).toLocaleDateString("fa-IR")}
              </p>
            ) : null}
          </div>
          <div
            className="mx-auto max-w-[42rem] py-7 text-[1.04rem] leading-8 text-foreground/88 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-black [&_p]:my-4"
            dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
          />
        </div>
      </article>
    </main>
  );
}
