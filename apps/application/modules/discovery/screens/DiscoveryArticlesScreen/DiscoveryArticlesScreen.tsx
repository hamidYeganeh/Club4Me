"use client";
import { DiscoveryImageHero } from "../../components/DiscoveryImageHero";

import { useDiscoveryList } from "../../hooks/use-discovery-list";
import { DiscoverySearchField } from "../../components/DiscoverySearchField";
import { DiscoveryPagination } from "../../components/DiscoveryPagination";
import { DiscoveryQueryState } from "../../components/DiscoveryQueryState";
import { DiscoveryEmptySection } from "../../components/DiscoveryEmptySection";
import { useCatalogArticles } from "@api/discovery";
import { ArticleCard } from "@ui/article-card";

import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { ArticleListSkeleton } from "@/components/loading-skeletons";

export function DiscoveryArticlesScreen() {
  const { query, setQuery, q, page, setPage } = useDiscoveryList();
  const result = useCatalogArticles({ q, page, limit: 20 });
  const articles = result.data?.items ?? [];

  return (
    <main className="app-page gap-7">
      <SecondaryHeader title="مجله جیم‌فورمی" showFilter={false} />

      <DiscoveryImageHero
        imageUrl="/profile/cover.jpg"
        title="دانش کاربردی برای مسیر ورزشی تو"
        description="از تمرین و تغذیه تا ریکاوری؛ مطالب کوتاه و معتبر برای تصمیم‌های بهتر."
        eyebrow="بهتر تمرین کن، بهتر زندگی کن"
      />

      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder="جست‌وجو در مقاله‌ها"
      />
      {result.isLoading ? <ArticleListSkeleton count={4} /> : null}
      <DiscoveryQueryState query={result} />
      {result.isSuccess && articles.length === 0 ? (
        <DiscoveryEmptySection
          title="مقاله‌ای پیدا نشد"
          subtitle="موضوع دیگری را جست‌وجو کن."
          icon="book-open"
        />
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
      <DiscoveryPagination
        page={page}
        total={result.data?.total ?? 0}
        limit={20}
        onChange={setPage}
        pending={result.isFetching}
      />
    </main>
  );
}

function estimatedReadTime(minutes = 1) {
  return `${minutes.toLocaleString("fa-IR")} دقیقه`;
}
