"use client";

import { useTranslations } from "next-intl";
import { ScrollShadow } from "@heroui/react";
import { LocationCard } from "@ui/location-card";
import { discoveryCitiesProvinceSectionStyles } from "./DiscoveryCitiesProvinceSection.styles";
import type { DiscoveryCitiesProvinceSectionProps } from "./DiscoveryCitiesProvinceSection.types";

export function DiscoveryCitiesProvinceSection({
  province,
}: DiscoveryCitiesProvinceSectionProps) {
  const styles = discoveryCitiesProvinceSectionStyles();
  const t = useTranslations("discovery.home");
  const titleId = `discovery-province-${province.id}`;

  if (province.cities.length === 0) return null;

  return (
    <section className={styles.root()} aria-labelledby={titleId}>
      <div className={styles.header()}>
        <h2 id={titleId} className={styles.title()}>
          {province.name}
        </h2>
        <span className={styles.count()}>
          {province.cities.length.toLocaleString("fa-IR")} شهر
        </span>
      </div>
      <ScrollShadow
        hideScrollBar
        orientation="horizontal"
        size={40}
        className={styles.rail()}
        aria-labelledby={titleId}
      >
        <div className={styles.list()}>
          {province.cities.map((city) => (
            <LocationCard
              key={city.id}
              href={`/discovery/city/${city.id}`}
              title={city.name}
              imageUrl={
                city.imageUrl || "/discovery/locations/city-heritage.jpg"
              }
              imageAlt={city.name}
              label={t("clubsCount", {
                count: city.clubsCount.toLocaleString("fa-IR"),
              })}
              className={styles.card()}
            />
          ))}
        </div>
      </ScrollShadow>
    </section>
  );
}
