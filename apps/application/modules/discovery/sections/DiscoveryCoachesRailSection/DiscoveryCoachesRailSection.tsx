"use client";

import { CoachCardSkeleton } from "../../components/skeletons/CoachCardSkeleton";
import { useLocale, useTranslations } from "next-intl";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { CoachCard } from "@ui/coach-card";

import { getLocaleDirection } from "@/lib/locale-direction";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import { DiscoveryEmptySection } from "@modules/discovery/components/DiscoveryEmptySection";

import { discoveryCoachesRailSectionStyles } from "./DiscoveryCoachesRailSection.styles";
import type { DiscoveryCoachesRailSectionProps } from "./DiscoveryCoachesRailSection.types";

import "swiper/css";
import "swiper/css/free-mode";

export function DiscoveryCoachesRailSection({
  id,
  title,
  subtitle,
  icon,
  seeAllHref = "/discovery/coaches",
  seeAllLabel,
  items,
  cardType = "normal",
  className,
  isLoading = false,
  skeletonCount = 3,
}: DiscoveryCoachesRailSectionProps) {
  const t = useTranslations("discovery.home");
  const direction = getLocaleDirection(useLocale());
  const styles = discoveryCoachesRailSectionStyles();
  const titleId = `discovery-coaches-rail-${id}`;

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
        modules={[FreeMode]}
        freeMode
        slidesPerView="auto"
        spaceBetween={12}
        watchOverflow
        className={styles.swiper()}
      >
        {isLoading
          ? Array.from({ length: skeletonCount }, (_, index) => (
              <SwiperSlide key={index} className={styles.slide()}>
                <CoachCardSkeleton type={cardType} />
              </SwiperSlide>
            ))
          : items.map((coach) => (
              <SwiperSlide key={coach.id} className={styles.slide()}>
                <CoachCard
                  type={cardType}
                  title={coach.displayName}
                  imageUrl={coach.imageUrl}
                  supportingText={
                    cardType === "normal" ? coach.shortBio : undefined
                  }
                  rating={
                    cardType === "normal" ? coach.averageRating : undefined
                  }
                  reviewsCount={
                    cardType === "normal" ? coach.reviewsCount : undefined
                  }
                  stats={
                    cardType === "normal"
                      ? [
                          {
                            id: "experience",
                            label: `${coach.experienceYears.toLocaleString("fa-IR")} سال تجربه`,
                          },
                        ]
                      : undefined
                  }
                  meta={cardType === "compact" ? coach.serviceModes : undefined}
                  href={`/discovery/coaches/${coach.slug}`}
                />
              </SwiperSlide>
            ))}
      </Swiper>
    </section>
  );
}
