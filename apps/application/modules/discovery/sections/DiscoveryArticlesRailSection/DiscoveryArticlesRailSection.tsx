"use client";
import { type ComponentProps } from "react";
import { DiscoveryViewport } from "@modules/discovery/components/DiscoveryViewport";

import { ArticleCardSkeleton } from "../../components/skeletons/ArticleCardSkeleton";
import { useLocale, useTranslations } from "next-intl";
import { FreeMode, Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ArticleCard } from "@ui/article-card";

import { getLocaleDirection } from "@/lib/locale-direction";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import { DiscoveryEmptySection } from "@modules/discovery/components/DiscoveryEmptySection";

import { discoveryArticlesRailSectionStyles } from "./DiscoveryArticlesRailSection.styles";
import type { DiscoveryArticlesRailSectionProps } from "./DiscoveryArticlesRailSection.types";

import "swiper/css";
import "swiper/css/free-mode";

function DiscoveryArticlesRailSectionContent({
  id,
  title,
  subtitle,
  icon,
  seeAllHref = "/discovery/articles",
  seeAllLabel,
  items,
  cardVariant = { orientation: "vertical", outlined: false },
  className,
  isLoading = false,
  skeletonCount = 3,
}: DiscoveryArticlesRailSectionProps) {
  const t = useTranslations("discovery.home");
  const direction = getLocaleDirection(useLocale());
  const orientation = cardVariant.orientation ?? "vertical";
  const styles = discoveryArticlesRailSectionStyles({ orientation });
  const titleId = `discovery-articles-rail-${id}`;

  if (!isLoading && items.length === 0) {
    return (
      <DiscoveryEmptySection
        title={title}
        subtitle={subtitle}
        icon={icon}
        viewAllLabel={seeAllLabel ?? t("seeAll")}
        viewAllUrl={seeAllHref}
      />
    );
  }

  return (
    <section className={styles.root({ className })} aria-labelledby={titleId}>
      <DiscoverySectionHeader
        isLoading={isLoading}
        id={titleId}
        title={title}
        subtitle={subtitle}
        icon={icon}
        viewAllLabel={seeAllLabel ?? t("seeAll")}
        viewAllUrl={seeAllHref}
      />

      <Swiper
        dir={direction}
        modules={[FreeMode, Virtual]}
        virtual={!isLoading}
        freeMode
        slidesPerView={1.2}
        spaceBetween={12}
        watchOverflow
        className={styles.swiper()}
      >
        {isLoading
          ? Array.from({ length: skeletonCount }, (_, index) => (
              <SwiperSlide key={index} className={styles.slide()}>
                <ArticleCardSkeleton
                  orientation={orientation}
                  outlined={cardVariant.outlined}
                  className={`${styles.card()} w-full!`}
                />
              </SwiperSlide>
            ))
          : items.map((article, index) => (
              <SwiperSlide
                key={article.id}
                virtualIndex={index}
                className="h-auto!"
              >
                <ArticleCard
                  title={article.title}
                  description={article.excerpt}
                  coverImageUrl={article.coverImageUrl}
                  authorName={article.authorName}
                  readTime=""
                  tags={[]}
                  tagsLabel={t("articleTagsLabel")}
                  orientation={orientation}
                  outlined={cardVariant.outlined}
                  href={`/discovery/articles/${article.slug}`}
                  className={`${styles.card()} w-full!`}
                />
              </SwiperSlide>
            ))}
      </Swiper>
    </section>
  );
}

export function DiscoveryArticlesRailSection(
  props: ComponentProps<typeof DiscoveryArticlesRailSectionContent>,
) {
  return (
    <DiscoveryViewport>
      <DiscoveryArticlesRailSectionContent {...props} />
    </DiscoveryViewport>
  );
}
