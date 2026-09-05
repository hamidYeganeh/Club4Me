"use client";

import Link from "next/link";
import { ScrollShadow, Skeleton, Typography } from "@heroui/react";
import { useCatalogClubTypes } from "@api/discovery";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";

import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import { DiscoveryEmptySection } from "@modules/discovery/components/DiscoveryEmptySection";
import { resolveClubTypeIcon } from "@modules/discovery/discovery-icons";

import { discoveryClubTypesSectionStyles } from "./DiscoveryClubTypesSection.styles";
import type {
  DiscoveryClubTypeItem,
  DiscoveryClubTypesSectionProps,
} from "./DiscoveryClubTypesSection.types";

const ROWS_PER_COLUMN = 3;

function chunkTypes(items: DiscoveryClubTypeItem[], size: number) {
  const columns: DiscoveryClubTypeItem[][] = [];
  for (let index = 0; index < items.length; index += size) {
    columns.push(items.slice(index, index + size));
  }
  return columns;
}

export function DiscoveryClubTypesSection({
  items,
  enabled = true,
  title,
  subtitle,
  seeAllHref = "/discovery/clubs",
  seeAllLabel,
}: DiscoveryClubTypesSectionProps) {
  const t = useTranslations("discovery.clubs");
  const styles = discoveryClubTypesSectionStyles();
  const hasProvidedItems = items !== undefined;
  const catalog = useCatalogClubTypes(enabled && !hasProvidedItems);
  const live: DiscoveryClubTypeItem[] = (catalog.data?.items ?? []).map(
    (type) => ({
      id: type.id,
      name: type.name,
      clubsCount: type.clubsCount,
      icon: resolveClubTypeIcon(type.code, type.icon),
      href: `/discovery/clubs?club_types=${encodeURIComponent(type.slug)}`,
    }),
  );
  const visible = items ?? live;
  const columns = chunkTypes(visible, ROWS_PER_COLUMN);
  const isPending = !hasProvidedItems && catalog.isPending && live.length === 0;

  if (!enabled) {
    return null;
  }

  if (!isPending && visible.length === 0) {
    return (
      <DiscoveryEmptySection
        title={title ?? t("clubTypesTitle")}
        subtitle={subtitle ?? t("clubTypesSubtitle")}
        icon="building-1"
        viewAllLabel={seeAllLabel ?? t("seeAll")}
        viewAllUrl={seeAllHref}
      />
    );
  }

  return (
    <section
      className={styles.root()}
      aria-labelledby="discovery-club-types-title"
    >
      <DiscoverySectionHeader
        id="discovery-club-types-title"
        title={title ?? t("clubTypesTitle")}
        subtitle={subtitle ?? t("clubTypesSubtitle")}
        icon="building-1"
        viewAllLabel={seeAllLabel ?? t("seeAll")}
        viewAllUrl={seeAllHref}
      />

      {isPending ? (
        <ScrollShadow
          hideScrollBar
          orientation="horizontal"
          size={48}
          className={styles.scroller()}
        >
          <div className={styles.track()} aria-hidden>
            {Array.from({ length: 3 }, (_, columnIndex) => (
              <div key={columnIndex} className={styles.column()}>
                {Array.from({ length: ROWS_PER_COLUMN }, (_, rowIndex) => (
                  <div
                    key={`${columnIndex}-${rowIndex}`}
                    className={styles.skeleton()}
                  >
                    <Skeleton className={styles.skeletonIcon()} />
                    <div className={styles.skeletonText()}>
                      <Skeleton className={styles.skeletonTitle()} />
                      <Skeleton className={styles.skeletonCount()} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ScrollShadow>
      ) : null}

      {!isPending && visible.length > 0 ? (
        <ScrollShadow
          hideScrollBar
          orientation="horizontal"
          size={48}
          className={styles.scroller()}
          aria-label={t("clubTypesTitle")}
        >
          <div className={styles.track()}>
            {columns.map((column, columnIndex) => (
              <div
                key={column.map((item) => item.id).join("-") || columnIndex}
                className={styles.column()}
              >
                {column.map((type) => (
                  <Link
                    key={type.id}
                    href={type.href}
                    scroll={false}
                    aria-label={`${type.name}، ${t("clubsCount", {
                      count: type.clubsCount.toLocaleString("fa-IR"),
                    })}`}
                    className={styles.item()}
                  >
                    <span aria-hidden className={styles.iconWrap()}>
                      <Icon name={type.icon} size={40} />
                    </span>
                    <span className={styles.body()}>
                      <Typography
                        type="body-sm"
                        weight="bold"
                        className={styles.name()}
                      >
                        {type.name}
                      </Typography>
                      <Typography
                        type="body-xs"
                        color="muted"
                        className={styles.count()}
                      >
                        {t("clubsCount", {
                          count: type.clubsCount.toLocaleString("fa-IR"),
                        })}
                      </Typography>
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </ScrollShadow>
      ) : null}
    </section>
  );
}
