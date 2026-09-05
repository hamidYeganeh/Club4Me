"use client";

import type {
  DiscoveryArticleItem,
  DiscoveryClubItem,
  DiscoveryCoachItem,
  PublicCatalogClass,
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
import { DiscoveryResultCard } from "../../components/DiscoveryResultCard";
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
  if (!section.items.length) {
    return (
      <section className="flex flex-col gap-4">
        <DiscoverySectionHeader
          title={section.title}
          subtitle={section.subtitle}
          viewAllLabel={section.viewAllLabel}
          viewAllUrl={section.viewAllUrl}
        />
        <p className="rounded-2xl bg-surface p-5 text-center text-sm text-muted">
          هنوز محتوایی برای این بخش ثبت نشده است.
        </p>
      </section>
    );
  }

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
                        href={`/discovery/clubs/${club.slug}`}
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
                          imageUrl={coach.imageUrl}
                          supportingText={coach.shortBio}
                          rating={coach.averageRating}
                          reviewsCount={coach.reviewsCount}
                          href={`/discovery/coaches/${coach.slug}`}
                          stats={[
                            {
                              id: "experience",
                              label: `${coach.experienceYears} سال تجربه`,
                            },
                          ]}
                        />
                      );
                    })()
                  : section.type === "classes"
                    ? (() => {
                        const trainingClass = item as PublicCatalogClass;
                        return (
                          <DiscoveryResultCard
                            title={trainingClass.title}
                            subtitle={trainingClass.description}
                            imageUrl={trainingClass.imageUrl}
                            badge="کلاس"
                            href={`/discovery/classes/${trainingClass.slug}`}
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
                            href={`/discovery/articles/${article.slug}`}
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
