"use client";

import { useEffect, useState } from "react";
import { Button, Skeleton, Typography } from "@heroui/react";
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
import { DiscoveryEmptySection } from "@modules/discovery/components/DiscoveryEmptySection";
import { DiscoveryClubsCatalogSections } from "@modules/discovery/sections/DiscoveryClubsCatalogSections";
import {
  SortBottomSheet,
  type SortOption,
} from "@/components/sort-bottom-sheet";
import {
  getActiveCoordinates,
  useActiveLocation,
} from "@modules/locations/active-location";

import { discoveryClubsScreenStyles } from "./DiscoveryClubsScreen.styles";
import type {
  DiscoveryClubsBrowse,
  DiscoveryClubsScreenProps,
} from "./DiscoveryClubsScreen.types";

type ClubSort = "suggested" | "rating" | "newest";

const clubSortOptions: ReadonlyArray<SortOption<ClubSort>> = [
  { value: "suggested", label: "پیشنهادی", icon: "arrow-trend-up" },
  { value: "rating", label: "محبوب‌ترین", icon: "medal" },
  { value: "newest", label: "جدیدترین", icon: "sort-descending" },
];

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
  const [sortOpen, setSortOpen] = useState(false);
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
    !browse?.clubTypeId &&
    !browse?.clubTypeSlug;
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
  const clubTypes = useCatalogClubTypes(
    Boolean(browse?.clubTypeId || browse?.clubTypeSlug),
  );
  const selectedClubType = clubTypes.data?.items.find(
    (entry) =>
      entry.id === browse?.clubTypeId || entry.slug === browse?.clubTypeSlug,
  );
  const isResolvingClubType = Boolean(
    browse?.clubTypeSlug && !selectedClubType,
  );
  const effectiveFilters = selectedClubType
    ? { ...filters, clubTypeId: selectedClubType.id }
    : filters;
  const clubs = useCatalogClubs(
    effectiveFilters,
    !showRails && !isResolvingClubType,
  );
  const selectedTypeName = selectedClubType?.name;
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
  const selectedSort: ClubSort = filters.sort ?? "suggested";

  const applySort = (nextSort: ClubSort) => {
    setFilters((current) => {
      if (nextSort === "suggested") {
        const nextFilters = { ...current };
        delete nextFilters.sort;
        return nextFilters;
      }
      return { ...current, sort: nextSort };
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
            {clubs.isPending ? (
              <Skeleton
                className="h-4 w-24 rounded-lg"
                aria-label="در حال بارگذاری تعداد باشگاه‌ها"
              />
            ) : (
              <Typography type="body-sm" weight="bold">
                {t("resultsCount", {
                  count: (clubs.data?.total ?? visible.length).toLocaleString(
                    "fa-IR",
                  ),
                })}
              </Typography>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 min-h-10 gap-2 px-2 font-bold text-muted"
              onPress={() => setSortOpen(true)}
            >
              مرتب‌سازی: {clubSortOptions.find((option) => option.value === selectedSort)?.label}
              <Icon name="sort-descending" size={18} className="text-accent" />
            </Button>
          </div>
          <div className={styles.list()}>
            {clubs.isPending ? <DiscoveryResultCardSkeleton count={4} /> : null}
            {!clubs.isPending && !clubs.isError && visible.length === 0 ? (
              <DiscoveryEmptySection
                title="باشگاهی پیدا نشد"
                subtitle="هنوز باشگاه فعالی برای این شهر یا دسته‌بندی وجود ندارد."
                icon="building-1"
              />
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

      <SortBottomSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        value={selectedSort}
        onApply={applySort}
        title="مرتب‌سازی باشگاه‌ها"
        description="باشگاه‌ها را بر اساس پیشنهاد، محبوبیت یا تازگی مرتب کنید."
        options={clubSortOptions}
      />
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
