"use client";

import { useLocale } from "next-intl";
import { useReducedMotion } from "motion/react";
import { A11y, EffectCards, Keyboard, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ClubCard } from "@ui/club-card";
import { getLocaleDirection } from "@/lib/locale-direction";
import { DiscoverySectionHeader } from "../../components/DiscoverySectionHeader";
import { ClubCardSkeleton } from "../../components/skeletons/ClubCardSkeleton";
import { formatClubCityDistrict } from "../../discovery.formatters";
import type { DiscoveryClubsRailClub } from "../DiscoveryClubsRailSection";
import { discoveryClubsCardsSectionStyles } from "./DiscoveryClubsCardsSection.styles";

import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/pagination";
import "swiper/css/a11y";

export function DiscoveryClubsCardsSection({
  id,
  title,
  subtitle,
  viewAllLabel,
  viewAllUrl,
  items,
  isLoading = false,
}: {
  id: string;
  title: string;
  subtitle?: string;
  viewAllLabel?: string;
  viewAllUrl?: string;
  items: DiscoveryClubsRailClub[];
  isLoading?: boolean;
}) {
  const direction = getLocaleDirection(useLocale());
  const reduceMotion = useReducedMotion();
  const styles = discoveryClubsCardsSectionStyles();
  const titleId = `discovery-clubs-cards-${id}`;

  return (
    <section
      className={styles.root()}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : "باشگاه‌ها"}
    >
      {title ? (
        <DiscoverySectionHeader
          id={titleId}
          title={title}
          subtitle={subtitle}
          icon="building-1"
          viewAllLabel={viewAllLabel}
          viewAllUrl={viewAllUrl}
          isLoading={isLoading}
        />
      ) : null}
      <div className={styles.stage()}>
        {isLoading ? (
          <div className={styles.skeleton()} aria-busy="true">
            <ClubCardSkeleton variant="editorial" className={styles.card()} />
          </div>
        ) : (
          <Swiper
            key={`${id}-${direction}-${Boolean(reduceMotion)}`}
            dir={direction}
            modules={[EffectCards, A11y, Keyboard, Pagination]}
            effect="cards"
            cardsEffect={{
              slideShadows: false,
              rotate: !reduceMotion,
              perSlideOffset: 8,
            }}
            speed={reduceMotion ? 0 : 400}
            grabCursor={items.length > 1}
            watchOverflow
            keyboard={{ enabled: true, onlyInViewport: true }}
            pagination={{ clickable: true }}
            a11y={{
              paginationBulletMessage: "نمایش باشگاه {{index}}",
              slideLabelMessage: "{{index}} / {{slidesLength}}",
            }}
            className={styles.swiper()}
          >
            {items.map((club) => (
              <SwiperSlide key={club.id} className={styles.slide()}>
                {({ isActive }) => (
                  <div inert={!isActive} aria-hidden={!isActive}>
                    <ClubCard
                      variant="editorial"
                      title={club.name}
                      location={
                        formatClubCityDistrict(club.city, club.district) ??
                        club.address
                      }
                      imageUrl={club.imageUrl}
                      rating={club.averageRating}
                      reviewsCount={club.reviewsCount}
                      sports={club.sports}
                      href={`/discovery/clubs/${club.slug}`}
                      className={styles.card()}
                    />
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
}
