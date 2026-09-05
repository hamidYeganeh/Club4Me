"use client";

import { Button } from "@heroui/react";
import { useCatalogArticles } from "@api/discovery";
import { ArticleCard } from "@ui/article-card";

import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { ArticleListSkeleton } from "@/components/loading-skeletons";

export function DiscoveryArticlesScreen() {
  const result = useCatalogArticles({ limit: 100 });
  const articles = result.data?.items ?? [];

  return (
    <main className="app-page gap-7">
      <SecondaryHeader title="مجله جیم‌فورمی" showFilter={false} />

      <section className="app-reveal pt-2" aria-labelledby="articles-heading">
        <p className="mb-2 text-xs font-bold tracking-[0.18em] text-accent">
          بهتر تمرین کن، بهتر زندگی کن
        </p>
        <h1
          id="articles-heading"
          className="max-w-sm text-3xl leading-[1.25] font-black tracking-tight"
        >
          دانش کاربردی برای مسیر ورزشی تو
        </h1>
        <p className="mt-3 max-w-md text-sm leading-7 text-muted">
          از تمرین و تغذیه تا ریکاوری؛ مطالب کوتاه و معتبر برای تصمیم‌های بهتر.
        </p>
      </section>

      {result.isPending ? (
        <ArticleListSkeleton count={4} />
      ) : null}
      {result.isError ? (
        <div className="py-12 text-center">
          <p className="text-sm text-danger">دریافت مقاله‌ها ناموفق بود.</p>
          <Button className="mt-4" onPress={() => void result.refetch()}>
            تلاش دوباره
          </Button>
        </div>
      ) : null}
      {!result.isPending && !result.isError && articles.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          هنوز مقاله‌ای منتشر نشده است.
        </p>
      ) : null}

      <section className="grid gap-3" aria-label="همه مقاله‌ها">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            title={article.title}
            description={article.excerpt}
            coverImageUrl={article.coverImageUrl}
            authorName={article.authorName}
            readTime={estimatedReadTime(article.readTimeMinutes)}
            tags={[]}
            orientation="horizontal"
            outlined
            href={`/discovery/articles/${article.slug}`}
            className="max-w-none! transition-transform active:scale-[0.99]"
          />
        ))}
      </section>
    </main>
  );
}

function estimatedReadTime(minutes = 1) {
  return `${minutes.toLocaleString("fa-IR")} دقیقه`;
}
