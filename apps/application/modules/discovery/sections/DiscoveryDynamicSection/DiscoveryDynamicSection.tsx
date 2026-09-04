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
import Link from "next/link";
import { useLocale } from "next-intl";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { getLocaleDirection } from "@/lib/locale-direction";
import { DiscoverySectionHeader } from "../../components/DiscoverySectionHeader";
import "swiper/css";
import "swiper/css/free-mode";

const fallback =
  "https://images.unsplash.com/photo-1534438327276-14e7789c4591?auto=format&fit=crop&w=900&q=80";

export function DiscoveryDynamicSection({
  section,
}: {
  section: DiscoverySection;
}) {
  const direction = getLocaleDirection(useLocale());
  if (!section.items.length) return null;
  const header = (
    <DiscoverySectionHeader
      title={section.title}
      subtitle={section.subtitle}
      viewAllLabel={section.viewAllLabel}
      viewAllUrl={section.viewAllUrl}
    />
  );
  if (section.type === "banners")
    return (
      <section className="flex flex-col gap-3">
        {header}
        <Swiper
          dir={direction}
          slidesPerView={1.08}
          spaceBetween={12}
          className="w-full"
        >
          {section.items.map((item, index) => (
            <SwiperSlide key={`${item.imageUrl}-${index}`}>
              <Link
                href={item.actionUrl || "#"}
                className="relative block aspect-[16/9] overflow-hidden rounded-3xl"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="size-full object-cover"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <span className="absolute inset-x-5 bottom-5 text-white">
                  <strong className="block text-xl">{item.title}</strong>
                  {item.subtitle && (
                    <small className="mt-1 block text-white/80">
                      {item.subtitle}
                    </small>
                  )}
                  {item.actionLabel && (
                    <span className="mt-3 inline-block rounded-full bg-white px-3 py-2 text-xs font-bold text-black">
                      {item.actionLabel}
                    </span>
                  )}
                </span>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
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
                        description={club.shortDescription}
                        imageUrl={fallback}
                        rating={club.averageRating}
                        reviewsCount={club.reviewsCount}
                        price=""
                        actionLabel="مشاهده"
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
                          imageUrl={fallback}
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
                          coverImageUrl={article.coverImageUrl ?? fallback}
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
