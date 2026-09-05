"use client";

import type { PublicResourceItem } from "@api/discovery";
import { ScrollShadow, Typography } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@theme/icon";
import { AmenityCard } from "@ui/amenity-card";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import { resolveClubTypeIcon } from "@modules/discovery/discovery-icons";
import { DiscoveryEmptySection } from "@modules/discovery/components/DiscoveryEmptySection";
import { cn } from "@/lib/cn";

export function DiscoveryResourceBrowseSection({
  title,
  subtitle,
  items,
  hrefFor,
  variant = "tiles",
  seeAllHref,
  seeAllLabel = "مشاهده همه",
}: {
  title: string;
  subtitle: string;
  items: PublicResourceItem[];
  hrefFor: (item: PublicResourceItem) => string;
  variant?: "tiles" | "pills" | "feature";
  seeAllHref?: string;
  seeAllLabel?: string;
}) {
  const router = useRouter();

  if (items.length === 0) {
    return (
      <DiscoveryEmptySection
        title={title}
        subtitle={subtitle}
        viewAllLabel={seeAllHref ? seeAllLabel : undefined}
        viewAllUrl={seeAllHref}
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <DiscoverySectionHeader
        title={title}
        subtitle={subtitle}
        icon="sparkle-1"
        viewAllLabel={seeAllHref ? seeAllLabel : undefined}
        viewAllUrl={seeAllHref}
      />
      <ScrollShadow
        hideScrollBar
        orientation="horizontal"
        size={48}
        className="-mx-5 overflow-x-auto px-5"
      >
        <div
          className={cn(
            "flex w-max snap-x gap-3 pb-1",
            variant === "pills" && "gap-2",
          )}
        >
          {items.map((item) => {
            const icon = resolveClubTypeIcon(
              typeof item.code === "string" ? item.code : undefined,
              typeof item.icon === "string" ? item.icon : undefined,
            );
            if (variant !== "tiles") {
              return (
                <AmenityCard
                  key={item.id}
                  title={item.name}
                  icon={icon}
                  backgroundImage={
                    variant === "feature" && typeof item.imageUrl === "string"
                      ? item.imageUrl
                      : undefined
                  }
                  className={cn(
                    "shrink-0 snap-start",
                    variant === "pills" && "min-w-44",
                    variant === "feature" && "h-24 w-56",
                  )}
                  onPress={() => router.push(hrefFor(item))}
                />
              );
            }
            return (
              <Link
                key={item.id}
                href={hrefFor(item)}
                scroll={false}
                className="flex w-36 snap-start flex-col items-center gap-3 rounded-3xl border border-border bg-surface p-4 text-center no-underline transition-transform active:scale-[0.98]"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent/12 text-accent">
                  <Icon name={icon} size={28} />
                </span>
                <Typography
                  type="body-sm"
                  weight="bold"
                  className="line-clamp-2"
                >
                  {item.name}
                </Typography>
              </Link>
            );
          })}
        </div>
      </ScrollShadow>
    </section>
  );
}
