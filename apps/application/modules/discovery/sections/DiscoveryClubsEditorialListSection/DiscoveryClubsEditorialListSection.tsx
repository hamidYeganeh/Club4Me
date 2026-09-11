"use client";

import { Button, Skeleton, Typography } from "@heroui/react";
import { useCatalogClubs } from "@api/discovery";
import { ClubCard } from "@ui/club-card";
import { useTranslations } from "next-intl";

import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import { formatClubCityDistrict } from "@modules/discovery/discovery.formatters";
import type { DiscoveryClubsRailClub } from "@modules/discovery/sections/DiscoveryClubsRailSection/DiscoveryClubsRailSection.types";

import { discoveryClubsEditorialListSectionStyles } from "./DiscoveryClubsEditorialListSection.styles";
import type { DiscoveryClubsEditorialListSectionProps } from "./DiscoveryClubsEditorialListSection.types";

export function DiscoveryClubsEditorialListSection({
  id = "editorial-list",
  title,
  subtitle,
  params,
  enabled = true,
  items,
}: DiscoveryClubsEditorialListSectionProps) {
  const t = useTranslations("discovery.clubs");
  const styles = discoveryClubsEditorialListSectionStyles();
  const hasProvidedItems = Boolean(items);
  const clubs = useCatalogClubs(params, enabled && !hasProvidedItems);
  const visible: DiscoveryClubsRailClub[] = items ?? clubs.data?.items ?? [];
  const titleId = `discovery-clubs-editorial-list-${id}`;
  const isPending = !hasProvidedItems && clubs.isPending;
  const isError = !hasProvidedItems && clubs.isError;
  const resolvedTitle = title ?? t("editorialListTitle");
  const resolvedSubtitle = subtitle ?? t("editorialListSubtitle");

  if (!enabled) {
    return null;
  }

  if (!isPending && !isError && visible.length === 0) {
    return null;
  }

  return (
    <section className={styles.root()} aria-labelledby={titleId}>
      <DiscoverySectionHeader
        id={titleId}
        title={resolvedTitle}
        subtitle={resolvedSubtitle}
        icon="sparkle-1"
      />

      {isPending ? (
        <div
          className={styles.list()}
          aria-busy="true"
          aria-label="در حال بارگذاری باشگاه‌ها"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className={`${styles.skeleton()} overflow-hidden`}>
              <Skeleton className="h-[64%] w-full rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-2/3 rounded-lg" />
                <Skeleton className="h-3.5 w-full rounded-lg" />
                <div className="flex items-center justify-between gap-4 pt-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className={styles.error()}>
          <Typography type="body-sm" className={styles.errorText()}>
            {t("error")}
          </Typography>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => void clubs.refetch()}
          >
            {t("retry")}
          </Button>
        </div>
      ) : null}

      {visible.length > 0 ? (
        <div className={styles.list()} aria-label={resolvedTitle}>
          {visible.map((club) => {
            const location =
              formatClubCityDistrict(club.city, club.district) ?? club.address;
            return (
              <ClubCard
                key={club.id}
                variant="editorial"
                title={club.name}
                location={location}
                imageUrl={club.imageUrl}
                rating={club.averageRating}
                reviewsCount={club.reviewsCount}
                sports={club.sports}
                pricePrefix={club.price != null ? t("priceFrom") : undefined}
                price={
                  club.price != null
                    ? club.price.toLocaleString("fa-IR")
                    : undefined
                }
                priceSuffix={club.price != null ? t("currency") : undefined}
                href={`/discovery/clubs/${club.slug}`}
                className={styles.card()}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
