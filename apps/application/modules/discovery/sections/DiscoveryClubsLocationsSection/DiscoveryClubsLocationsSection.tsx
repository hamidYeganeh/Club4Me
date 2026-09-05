"use client";

import { ScrollShadow } from "@heroui/react";
import { CityCard } from "@ui/city-card";
import { useTranslations } from "next-intl";
import { usePublicCatalogResource } from "@api/discovery";

import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";

import { discoveryClubsLocationsSectionStyles } from "./DiscoveryClubsLocationsSection.styles";
import type { DiscoveryClubsLocationsSectionProps } from "./DiscoveryClubsLocationsSection.types";

export function DiscoveryClubsLocationsSection({
  items,
  seeAllHref = "/discovery/cities",
}: DiscoveryClubsLocationsSectionProps) {
  const t = useTranslations("discovery.clubs");
  const styles = discoveryClubsLocationsSectionStyles();
  const query = usePublicCatalogResource("location", "city");
  const locations =
    items ??
    (query.data?.items ?? []).map((city) => ({
      id: city.id,
      name: city.name,
      clubsCount: typeof city.clubsCount === "number" ? city.clubsCount : 0,
      imageUrl: typeof city.imageUrl === "string" ? city.imageUrl : "",
      href: `/discovery/city/${String(city.slug ?? city.id)}`,
      kind: "city" as const,
    }));

  if (locations.length === 0) {
    return null;
  }

  return (
    <section
      className={styles.root()}
      aria-labelledby="discovery-clubs-locations-title"
    >
      <DiscoverySectionHeader
        id="discovery-clubs-locations-title"
        title={t("locationsTitle")}
        subtitle={t("locationsSubtitle")}
        icon="pin-1"
        viewAllLabel={t("seeAll")}
        viewAllUrl={seeAllHref}
      />

      <ScrollShadow
        hideScrollBar
        orientation="horizontal"
        size={48}
        className={styles.scroller()}
        aria-label={t("locationsTitle")}
      >
        <div className={styles.track()}>
          {locations.map((location) => (
            <CityCard
              key={location.id}
              title={location.name}
              label={t("clubsCount", {
                count: location.clubsCount.toLocaleString("fa-IR"),
              })}
              imageUrl={location.imageUrl}
              imageAlt={location.name}
              href={location.href}
              className={styles.card()}
            />
          ))}
        </div>
      </ScrollShadow>
    </section>
  );
}
