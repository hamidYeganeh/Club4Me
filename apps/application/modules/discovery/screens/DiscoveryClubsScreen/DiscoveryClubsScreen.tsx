"use client";

import { useEffect, useState } from "react";
import { Button, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import {
  useCatalogClubs,
  useCatalogClubTypes,
  usePublicCatalogResource,
  type PublicCatalogParams,
} from "@api/discovery";
import { useTranslations } from "next-intl";

import { ButtonLink } from "@/components/button-link";
import { DiscoveryResultCardSkeleton } from "@/components/loading-skeletons";
import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";
import { DiscoverySearchField } from "@modules/discovery/components/DiscoverySearchField";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { DiscoveryClubsCatalogSections } from "@modules/discovery/sections/DiscoveryClubsCatalogSections";
import {
  getActiveCoordinates,
  useActiveLocation,
} from "@modules/locations/active-location";

import { discoveryClubsScreenStyles } from "./DiscoveryClubsScreen.styles";
import type {
  DiscoveryClubsBrowse,
  DiscoveryClubsScreenProps,
} from "./DiscoveryClubsScreen.types";

export function DiscoveryClubsScreen({
  title,
  description,
  layout = "rails",
  browse,
  initialFilters,
}: DiscoveryClubsScreenProps) {
  const t = useTranslations("discovery.clubs");
  const styles = discoveryClubsScreenStyles();
  const [query, setQuery] = useState("");
  const { active } = useActiveLocation();
  const coords = getActiveCoordinates(active);
  const [filters, setFilters] = useState<PublicCatalogParams>(
    () => initialFilters ?? browseToFilters(browse, coords),
  );
  const showRails =
    layout === "rails" &&
    !browse?.sort &&
    !browse?.sportId &&
    !browse?.nearby &&
    !browse?.clubTypeId;
  const regions = usePublicCatalogResource(
    "location",
    "city-region",
    undefined,
    !showRails,
  );
  const sports = usePublicCatalogResource(
    "sports",
    "sport",
    undefined,
    !showRails,
  );
  const clubs = useCatalogClubs(filters, !showRails);
  const clubTypes = useCatalogClubTypes(Boolean(browse?.clubTypeId));
  const selectedTypeName = clubTypes.data?.items.find(
    (entry) => entry.id === browse?.clubTypeId,
  )?.name;
  const visible = clubs.data?.items ?? [];
  const sportFilters = sports.data?.items ?? [];

  useEffect(() => {
    if (!browse?.nearby) return;
    if (coords) {
      const frame = requestAnimationFrame(() => {
        setFilters({
          latitude: coords.latitude,
          longitude: coords.longitude,
          radiusKm: 25,
        });
      });
      return () => cancelAnimationFrame(frame);
    }
    navigator.geolocation?.getCurrentPosition((position) => {
      setFilters({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        radiusKm: 25,
      });
    });
  }, [browse?.nearby, coords]);

  const clearFilters = () =>
    setFilters(initialFilters ?? browseToFilters(browse, coords));
  const nearby = () => {
    if (coords) {
      setFilters({
        latitude: coords.latitude,
        longitude: coords.longitude,
        radiusKm: 25,
      });
      return;
    }
    navigator.geolocation?.getCurrentPosition((position) => {
      setFilters({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        radiusKm: 25,
      });
    });
  };

  return (
    <main className={styles.root()}>
      <SecondaryHeader
        title={title ?? selectedTypeName ?? t("title")}
        action={
          <ButtonLink
            isIconOnly
            variant="ghost"
            aria-label={t("mapAria")}
            href="/discovery/map"
            className="size-10 min-w-10 text-foreground"
          >
            <Icon name="map-trifold" size={22} />
          </ButtonLink>
        }
      />
      {description ? (
        <p className="app-reveal px-5 text-sm text-muted">{description}</p>
      ) : null}
      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder={t("searchPlaceholder")}
        href="/discovery/search?kind=club"
      />
      {showRails ? (
        <DiscoveryClubsCatalogSections showHero />
      ) : (
        <>
          <div className="app-chip-row app-reveal">
            <Button
              size="sm"
              variant={
                Object.keys(filters).length === 0 ? "primary" : "secondary"
              }
              className="shrink-0"
              onPress={clearFilters}
            >
              {t("allFilter")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0"
              onPress={nearby}
            >
              {t("nearbyFilter")}
            </Button>
            {(regions.data?.items ?? []).slice(0, 4).map((filter) => (
              <Button
                key={filter.id}
                size="sm"
                variant={
                  filters.cityRegionId === filter.id ? "primary" : "secondary"
                }
                className="shrink-0"
                onPress={() => setFilters({ cityRegionId: filter.id })}
              >
                {filter.name}
              </Button>
            ))}
            {sportFilters.slice(0, 6).map((filter) => (
              <Button
                key={filter.id}
                size="sm"
                variant={
                  filters.sportId === filter.id ? "primary" : "secondary"
                }
                className="shrink-0"
                onPress={() => setFilters({ sportId: filter.id })}
              >
                {filter.name}
              </Button>
            ))}
          </div>
          <div className={styles.resultsBar()}>
            <Typography type="body-sm" weight="bold">
              {t("resultsCount", {
                count: (clubs.data?.total ?? visible.length).toLocaleString(
                  "fa-IR",
                ),
              })}
            </Typography>
            <Typography type="body-xs" color="muted">
              {t("sortSuggested")}
            </Typography>
          </div>
          <div className={styles.list()}>
            {clubs.isPending ? (
              <DiscoveryResultCardSkeleton count={4} />
            ) : null}
            {visible.map((club) => (
              <DiscoveryResultCard
                key={club.id}
                title={club.name}
                subtitle={club.address || club.shortDescription}
                meta={`${club.averageRating.toLocaleString("fa-IR")} ★`}
                imageUrl={club.imageUrl}
                href={`/discovery/clubs/${club.slug}`}
                badge={t("title")}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function browseToFilters(
  browse: DiscoveryClubsBrowse | undefined,
  coords?: { latitude: number; longitude: number },
): PublicCatalogParams {
  if (browse?.nearby && coords) {
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      radiusKm: 25,
    };
  }
  if (browse?.sportId) {
    return { sportId: browse.sportId };
  }
  if (browse?.clubTypeId) {
    return { clubTypeId: browse.clubTypeId };
  }
  if (browse?.sort) {
    return { sort: browse.sort };
  }
  return {};
}
