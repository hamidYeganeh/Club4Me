"use client";

import { useLocale, useTranslations } from "next-intl";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { getLocaleDirection } from "@/lib/locale-direction";
import { Typography } from "@heroui/react";
import { CityCard } from "@ui/city-card";

import { discoveryCitiesProvinceSectionStyles } from "./DiscoveryCitiesProvinceSection.styles";
import type { DiscoveryCitiesProvinceSectionProps } from "./DiscoveryCitiesProvinceSection.types";

import "swiper/css";
import "swiper/css/free-mode";

export function DiscoveryCitiesProvinceSection({
  province,
}: DiscoveryCitiesProvinceSectionProps) {
  const styles = discoveryCitiesProvinceSectionStyles();
  const t = useTranslations("discovery.home");
  const direction = getLocaleDirection(useLocale());
  const titleId = `discovery-province-${province.id}`;

  if (province.cities.length === 0) {
    return null;
  }

  return (
    <section className={styles.root()} aria-labelledby={titleId}>
      <Typography
        id={titleId}
        type="h5"
        weight="bold"
        className={styles.title()}
      >
        {province.name}
      </Typography>

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
          {province.cities.map((city) => (
            <SwiperSlide key={city.id} className={styles.slide()}>
              <div dir={direction}>
                <CityCard
                  label={t("clubsCount", {
                    count: city.clubsCount.toLocaleString("fa-IR"),
                  })}
                  title={city.name}
                  imageUrl={city.imageUrl}
                  imageAlt={city.name}
                  href={`/discovery/city/${city.id}`}
                  className={styles.card()}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
