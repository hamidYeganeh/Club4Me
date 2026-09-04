"use client";

import { useLocale, useTranslations } from "next-intl";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { getLocaleDirection } from "@/lib/locale-direction";
import { CityCard } from "@ui/city-card";
import { DISCOVERY_CITIES } from "@modules/discovery/discovery.constants";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";

import { discoveryHomeCitiesSectionStyles } from "./DiscoveryHomeCitiesSection.styles";
import type { DiscoveryHomeCitiesSectionProps } from "./DiscoveryHomeCitiesSection.types";

import "swiper/css";
import "swiper/css/free-mode";

export function DiscoveryHomeCitiesSection({
  cities = DISCOVERY_CITIES,
}: DiscoveryHomeCitiesSectionProps) {
  const styles = discoveryHomeCitiesSectionStyles();
  const t = useTranslations("discovery.home");
  const direction = getLocaleDirection(useLocale());

  if (cities.length === 0) {
    return null;
  }

  return (
    <section className={styles.root()} aria-labelledby="discovery-cities-title">
      <DiscoverySectionHeader
        id="discovery-cities-title"
        title={t("popularCities")}
        subtitle={t("popularCitiesSubtitle")}
      />

      <div dir={direction} className={styles.carousel()}>
        <Swiper
          dir={direction}
          modules={[FreeMode]}
          freeMode
          slidesPerView="auto"
          spaceBetween={12}
          watchOverflow
          className={styles.swiper()}
        >
          {cities.map((city) => (
            <SwiperSlide key={city.id} className={styles.slide()}>
              <CityCard
                title={city.name}
                label={t("clubsCount", {
                  count: city.clubsCount.toLocaleString("fa-IR"),
                })}
                imageUrl={city.imageUrl}
                imageAlt={city.name}
                href={`/discovery/city/${city.id}`}
                className={styles.card()}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
