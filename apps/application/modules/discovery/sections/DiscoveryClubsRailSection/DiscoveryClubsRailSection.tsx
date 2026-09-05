"use client";

import { Button, ScrollShadow, Skeleton, Typography } from "@heroui/react";
import { useCatalogClubs } from "@api/discovery";
import { Icon, type IconName } from "@theme/icon";
import { ClubCard } from "@ui/club-card";
import { useTranslations } from "next-intl";

import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import { formatClubCityDistrict } from "@modules/discovery/discovery.formatters";

import { discoveryClubsRailSectionStyles } from "./DiscoveryClubsRailSection.styles";
import type {
  DiscoveryClubsRailClub,
  DiscoveryClubsRailSectionProps,
} from "./DiscoveryClubsRailSection.types";

const PATTERN_ICONS: IconName[] = [
  "weight",
  "pin-1",
  "soccer",
  "star-full",
  "medal",
  "bicycle",
  "tennis",
  "volleyball",
];

export function DiscoveryClubsRailSection({
  id,
  title,
  subtitle,
  icon,
  seeAllHref,
  params,
  enabled = true,
  items,
  tone = "surface",
  cardVariant = "compact",
}: DiscoveryClubsRailSectionProps) {
  const t = useTranslations("discovery.clubs");
  const styles = discoveryClubsRailSectionStyles({ tone, cardVariant });
  const hasProvidedItems = items !== undefined;
  const clubs = useCatalogClubs(params, enabled && !hasProvidedItems);
  const visible: DiscoveryClubsRailClub[] = items ?? clubs.data?.items ?? [];
  const titleId = `discovery-clubs-rail-${id}`;
  const isPending = !hasProvidedItems && clubs.isPending;
  const isError = !hasProvidedItems && clubs.isError;
  const isAccent = tone === "accent";

  if (!enabled) {
    return null;
  }

  if (!isPending && !isError && visible.length === 0) {
    return null;
  }

  return (
    <section className={styles.root()} aria-labelledby={titleId}>
      {isAccent ? (
        <div aria-hidden className={styles.pattern()}>
          {Array.from({ length: 40 }, (_, index) => (
            <Icon
              key={index}
              name={PATTERN_ICONS[index % PATTERN_ICONS.length]!}
              size={18}
              style={{
                transform: `rotate(${((index % 5) - 2) * 18}deg)`,
              }}
            />
          ))}
        </div>
      ) : null}

      <div className={styles.header()}>
        <DiscoverySectionHeader
          id={titleId}
          title={title}
          subtitle={subtitle}
          icon={icon}
          accent={isAccent}
          viewAllLabel={t("seeAll")}
          viewAllUrl={seeAllHref}
        />
      </div>

      {isPending ? (
        <ScrollShadow
          hideScrollBar
          orientation="horizontal"
          size={24}
          className={styles.scroller()}
        >
          <div
            className={styles.track()}
            aria-busy="true"
            aria-label="در حال بارگذاری باشگاه‌ها"
          >
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className={`${styles.skeleton()} overflow-hidden`}
              >
                <Skeleton
                  className={`${cardVariant === "editorial" ? "h-[65%]" : "h-[58%]"} w-full rounded-none`}
                />
                <div className="space-y-2.5 p-4">
                  <Skeleton className="h-4 w-2/3 rounded-lg" />
                  <Skeleton className="h-3 w-full rounded-lg" />
                  <div className="flex justify-between gap-3 pt-1">
                    <Skeleton className="h-3 w-16 rounded-lg" />
                    <Skeleton className="h-3 w-20 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollShadow>
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
        <ScrollShadow
          hideScrollBar
          orientation="horizontal"
          size={24}
          className={styles.scroller()}
          aria-label={title}
        >
          <div className={styles.track()}>
            {visible.map((club) => {
              const location =
                formatClubCityDistrict(club.city, club.district) ??
                club.address;
              return (
                <ClubCard
                  key={club.id}
                  variant={cardVariant}
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
        </ScrollShadow>
      ) : null}
    </section>
  );
}
