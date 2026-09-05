"use client";

import { useLocale, useTranslations } from "next-intl";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { CoachCard } from "@ui/coach-card";

import { getLocaleDirection } from "@/lib/locale-direction";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";

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
}: DiscoveryCoachesRailSectionProps) {
  const t = useTranslations("discovery.home");
  const direction = getLocaleDirection(useLocale());
  const styles = discoveryCoachesRailSectionStyles();
  const titleId = `discovery-coaches-rail-${id}`;

  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.root({ className })} aria-labelledby={titleId}>
      <DiscoverySectionHeader
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
        {items.map((coach) => (
          <SwiperSlide key={coach.id} className={styles.slide()}>
            <CoachCard
              type={cardType}
              title={coach.displayName}
              imageUrl={coach.imageUrl}
              supportingText={
                cardType === "normal" ? coach.shortBio : undefined
              }
              rating={cardType === "normal" ? coach.averageRating : undefined}
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
