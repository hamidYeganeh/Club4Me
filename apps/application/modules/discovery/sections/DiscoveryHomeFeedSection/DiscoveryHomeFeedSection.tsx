"use client";

import Image from "next/image";
import Link from "next/link";
import { DISCOVERY_CLUBS } from "@modules/discovery/discovery.constants";
import { useClubs } from "@api/discovery";
import {
  getActiveCoordinates,
  useActiveLocation,
} from "@modules/locations/active-location";

import { Typography } from "@heroui/react";
import { discoveryHomeFeedSectionStyles } from "./DiscoveryHomeFeedSection.styles";
import type { DiscoveryHomeFeedSectionProps } from "./DiscoveryHomeFeedSection.types";

export function DiscoveryHomeFeedSection({
  clubs = DISCOVERY_CLUBS,
}: DiscoveryHomeFeedSectionProps) {
  const styles = discoveryHomeFeedSectionStyles();
  const { active } = useActiveLocation();
  // Coordinates are part of the query key and request, so changing the active
  // location always refreshes proximity results without changing the default.
  const nearby = useClubs(getActiveCoordinates(active));
  const visibleClubs = nearby.data
    ? nearby.data.items.map((club, index) => {
        const template = clubs[index % clubs.length] ?? DISCOVERY_CLUBS[0]!;
        return {
          ...template,
          id: club.id,
          name: club.name,
          location: club.city ?? template.location,
        };
      })
    : clubs;

  if (nearby.isLoading && active) {
    return (
      <Typography type="body" color="muted" align="center" className="py-16">
        در حال یافتن نزدیک‌ترین‌ها...
      </Typography>
    );
  }

  if (nearby.isError && active) {
    return (
      <div className="py-16 text-center">
        <Typography type="body-sm" className="mb-3 text-danger">
          دریافت نتایج نزدیک ناموفق بود.
        </Typography>
        <button
          type="button"
          onClick={() => void nearby.refetch()}
          className="rounded-xl bg-foreground px-4 py-2 text-background"
        >
          تلاش دوباره
        </button>
      </div>
    );
  }

  if (nearby.data && visibleClubs.length === 0) {
    return (
      <Typography type="body" color="muted" align="center" className="py-16">
        نتیجه‌ای نزدیک این لوکیشن پیدا نشد.
      </Typography>
    );
  }

  return (
    <div className={styles.root()}>
      {visibleClubs.map((club, index) => (
        <Link
          key={club.id}
          href={`/discovery/clubs/${club.id}`}
          scroll={false}
          aria-label={club.name}
          className={styles.item()}
        >
          <div className={styles.imageWrap()} data-zoom-exit-key={club.id}>
            <Image
              src={club.images[0]!}
              alt={club.name}
              fill
              unoptimized
              priority={index < 4}
              sizes="50vw"
              className={styles.image()}
            />
          </div>
          <Typography type="body-sm" weight="semibold" truncate className={styles.name()}>{club.name}</Typography>
          <Typography type="body-xs" color="muted" className={styles.meta()}>
            {club.location}{" "}
            <span className={styles.rating()}>★ {club.rating}</span>
          </Typography>
        </Link>
      ))}
    </div>
  );
}
