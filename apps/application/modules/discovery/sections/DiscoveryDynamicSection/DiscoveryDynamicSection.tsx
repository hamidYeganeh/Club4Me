"use client";

import type {
  DiscoveryArticleItem,
  DiscoveryClubItem,
  DiscoveryCoachItem,
  DiscoverySection,
} from "@api/discovery";
import { ArticleCard } from "@ui/article-card";
import { ClubCard } from "@ui/club-card";
import { CoachCard } from "@ui/coach-card";
import { useLocale } from "next-intl";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { getLocaleDirection } from "@/lib/locale-direction";
import { DiscoverySectionHeader } from "../../components/DiscoverySectionHeader";
import {
  DiscoveryBannersSection,
  parseDiscoveryBannersLayout,
} from "../DiscoveryBannersSection";
import "swiper/css";
import "swiper/css/free-mode";

export function DiscoveryDynamicSection({
  section,
}: {
  section: DiscoverySection;
}) {
  const direction = getLocaleDirection(useLocale());
  if (!section.items.length) return null;

  if (section.type === "banners") {
    const { aspectRatio, slidesPerView } = parseDiscoveryBannersLayout(
      section.layout,
    );
    return (
      <DiscoveryBannersSection
        id={section.id}
        title={section.title}
        subtitle={section.subtitle}
        viewAllLabel={section.viewAllLabel}
        viewAllUrl={section.viewAllUrl}
        items={section.items}
        aspectRatio={aspectRatio}
        slidesPerView={slidesPerView}
      />
    );
  }

  const header = (
    <DiscoverySectionHeader
      title={section.title}
      subtitle={section.subtitle}
      viewAllLabel={section.viewAllLabel}
      viewAllUrl={section.viewAllUrl}
    />
  );

  return (
    <section className="flex flex-col gap-4">
      {header}
      <div dir={direction}>
        <Swiper
          dir={direction}
          modules={[FreeMode]}
          freeMode
          slidesPerView="auto"
          spaceBetween={12}
          className="w-full"
        >
          {section.items.map((item) => (
            <SwiperSlide
              key={item.id}
              className="!w-[78vw] max-w-[300px]"
              dir={direction}
            >
              {section.type === "clubs"
                ? (() => {
                    const club = item as DiscoveryClubItem;
                    return (
                      <ClubCard
                        variant="compact"
                        title={club.name}
                        rating={club.averageRating}
                        reviewsCount={club.reviewsCount}
                        href={`/discovery/clubs/${club.id}`}
                      />
                    );
                  })()
                : section.type === "coaches"
                  ? (() => {
                      const coach = item as DiscoveryCoachItem;
                      return (
                        <CoachCard
                          type="normal"
                          title={coach.displayName}
                          supportingText={coach.shortBio}
                          rating={coach.averageRating}
                          reviewsCount={coach.reviewsCount}
                          href={`/coaches/${coach.slug}`}
                          stats={[
                            {
                              id: "experience",
                              label: `${coach.experienceYears} سال تجربه`,
                            },
                          ]}
                        />
                      );
                    })()
                  : (() => {
                      const article = item as DiscoveryArticleItem;
                      return (
                        <ArticleCard
                          title={article.title}
                          description={article.excerpt}
                          coverImageUrl={article.coverImageUrl}
                          authorName={article.authorName}
                          readTime=""
                          tags={[]}
                          orientation="vertical"
                          href={`/articles/${article.slug}`}
                        />
                      );
                    })()}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
