"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Card, Typography } from "@heroui/react";
import { getLocaleDirection } from "@/lib/locale-direction";
import { DISCOVERY_CITIES } from "@modules/discovery/discovery.constants";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import type { DiscoveryCity } from "@modules/discovery/discovery.types";

import { discoveryHomeCitiesSectionStyles } from "./DiscoveryHomeCitiesSection.styles";
import type { DiscoveryHomeCitiesSectionProps } from "./DiscoveryHomeCitiesSection.types";

import "swiper/css";
import "swiper/css/free-mode";

function chunkCities(cities: DiscoveryCity[], size: number) {
  const columns: DiscoveryCity[][] = [];
  for (let index = 0; index < cities.length; index += size) {
    columns.push(cities.slice(index, index + size));
  }
  return columns;
}

export function DiscoveryHomeCitiesSection({
  cities = DISCOVERY_CITIES,
}: DiscoveryHomeCitiesSectionProps) {
  const styles = discoveryHomeCitiesSectionStyles();
  const t = useTranslations("discovery.home");
  const direction = getLocaleDirection(useLocale());
  const columns = chunkCities(cities, 2);

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
          spaceBetween={16}
          watchOverflow
          className={styles.swiper()}
        >
          {columns.map((column, columnIndex) => (
            <SwiperSlide
              key={column.map((city) => city.id).join("-") || columnIndex}
              className={styles.slide()}
            >
              <div className={styles.column()}>
                {column.map((city) => (
                  <Card
                    key={city.id}
                    variant="transparent"
                    dir={direction}
                    className={styles.card()}
                  >
                    <Link
                      href={`/discovery/city/${city.id}`}
                      aria-label={city.name}
                      className="absolute inset-0 z-10 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    />
                    <div className={styles.imageWrap()}>
                      <Image
                        src={city.imageUrl}
                        alt={city.name}
                        fill
                        unoptimized
                        sizes="72px"
                        className={styles.image()}
                      />
                    </div>

                    <div className={styles.body()}>
                      <Typography
                        type="body-xs"
                        color="muted"
                        className={styles.label()}
                      >
                        {t("clubsIn")}
                      </Typography>
                      <Typography
                        type="body-sm"
                        weight="bold"
                        className={styles.city()}
                      >
                        {city.name}
                      </Typography>
                      <Typography
                        type="body-xs"
                        color="muted"
                        className={styles.count()}
                      >
                        {t("clubsCount", {
                          count: city.clubsCount.toLocaleString("fa-IR"),
                        })}
                      </Typography>
                    </div>
                  </Card>
                ))}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
