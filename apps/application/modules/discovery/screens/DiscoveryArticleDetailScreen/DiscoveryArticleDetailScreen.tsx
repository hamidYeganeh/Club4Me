"use client";

import { RelatedArticles } from "../../components/RelatedContent";
import { SaveButton } from "@/components/save-button";
import { SecondaryHeader } from "../../components/SecondaryHeader";
import { DiscoveryQueryPage } from "../../components/DiscoveryQueryPage";
import { DiscoveryEmptyPage } from "../../components/DiscoveryEmptyPage";
import { getQueryFailure } from "@/lib/request-failure";
import { useCatalogArticle } from "@api/discovery";

import { DiscoveryImageHero } from "../../components/DiscoveryImageHero";
import { ArticleDetailSkeleton } from "@/components/loading-skeletons";

export function DiscoveryArticleDetailScreen({
  articleId,
}: {
  articleId: string;
}) {
  const query = useCatalogArticle(articleId);

  if (getQueryFailure(query.error, query.fetchStatus) && !query.data)
    return <DiscoveryQueryPage title="مقاله" query={query} />;
  if (query.isPending) {
    return <ArticleDetailSkeleton />;
  }
  if (!query.data)
    return (
      <DiscoveryEmptyPage
        headerTitle="مقاله"
        title="این مقاله پیدا نشد"
        description="ممکن است مقاله هنوز منتشر نشده باشد."
      />
    );

  const article = query.data;
  return (
    <main className="min-h-dvh bg-background pb-[calc(3rem+env(safe-area-inset-bottom))]">
      <SecondaryHeader
        title="مقاله"
        showFilter={false}
        backHref="/discovery/articles"
        backLabel="بازگشت به مقالات"
        action={<SaveButton entityType="article" entityId={article.id} />}
      />

      <article>
        <div className="mx-4 pt-4">
          <DiscoveryImageHero
            imageUrl={article.coverImageUrl || "/profile/cover.jpg"}
            imageClassName="object-cover object-center"
            title={article.title}
            eyebrow="مجله جیم‌فورمی"
            description={article.excerpt}
          />
        </div>
        <div className="px-5">
          <div className="border-b border-border py-5">
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
      <div className="px-5 py-8">
        <RelatedArticles
          excludeId={article.id}
          params={{ categoryId: article.categoryId }}
        />
      </div>
    </main>
  );
}
