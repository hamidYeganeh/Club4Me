"use client";

import type { DiscoverySportItem } from "@api/discovery";
import { ScrollShadow } from "@heroui/react";
import Link from "next/link";
import { SportCard } from "@ui/sport-card";

import { DiscoveryEmptySection } from "@modules/discovery/components/DiscoveryEmptySection";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import { resolveClubTypeIcon } from "@modules/discovery/discovery-icons";

const SPORT_FALLBACK_IMAGES = [
  "/welcome/introduce/progress-iran-v2.png",
  "/welcome/introduce/score-iran-v2.png",
  "/welcome/introduce/book-iran-v2.png",
  "/welcome/hero-iran-v2.png",
] as const;

export function DiscoverySportsRailSection({
  id,
  title,
  subtitle,
  items,
  seeAllLabel = "مشاهده همه",
  seeAllHref = "/discovery/search",
}: {
  id: string;
  title: string;
  subtitle?: string;
  items: DiscoverySportItem[];
  seeAllLabel?: string;
  seeAllHref?: string;
}) {
  const titleId = `discovery-sports-${id}`;

  if (items.length === 0) {
    return (
      <DiscoveryEmptySection
        title={title}
        subtitle={subtitle}
        icon="soccer"
        viewAllLabel={seeAllLabel}
        viewAllUrl={seeAllHref}
      />
    );
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby={titleId}>
      <DiscoverySectionHeader
        id={titleId}
        title={title}
        subtitle={subtitle}
        icon="soccer"
        viewAllLabel={seeAllLabel}
        viewAllUrl={seeAllHref}
      />
      <ScrollShadow
        hideScrollBar
        orientation="horizontal"
        size={48}
        className="-mx-5 overflow-x-auto px-5"
        aria-label={title}
      >
        <div className="flex w-max snap-x gap-3 pb-1">
          {items.map((sport, index) => (
            <Link
              key={sport.id}
              href={`/discovery/sports/${sport.slug || sport.id}`}
              scroll={false}
              className="w-[12.5rem] shrink-0 snap-start rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-focus"
              aria-label={sport.name}
            >
              <SportCard
                value={sport.name}
                supportingText={
                  sport.categoryName || sport.description || "رشته ورزشی"
                }
                icon={resolveClubTypeIcon(sport.code, sport.icon)}
                backgroundImage={
                  sport.imageUrl ??
                  SPORT_FALLBACK_IMAGES[index % SPORT_FALLBACK_IMAGES.length]
                }
                backgroundImageAlt={sport.name}
                className="w-full"
              />
            </Link>
          ))}
        </div>
      </ScrollShadow>
    </section>
  );
}
