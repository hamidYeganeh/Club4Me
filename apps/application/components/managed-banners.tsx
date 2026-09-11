"use client";

import type { CSSProperties } from "react";
import { useDiscoveryFeed } from "@api/discovery";
import { DiscoveryBannersSection } from "@modules/discovery/sections/DiscoveryBannersSection";
import { parseDiscoveryBannersLayout } from "@modules/discovery/sections/DiscoveryBannersSection/parseDiscoveryBannersLayout";

/** Empty, disabled or unavailable placements do not reserve space in the page. */
export function ManagedBanners({
  placement,
}: {
  placement: "athlete-home" | "coach-home" | "reservations";
}) {
  const feed = useDiscoveryFeed(placement);
  return (
    <>
      {feed.data?.map((section) =>
        section.type === "banners" && section.items.length > 0 ? (
          <div
            key={section.id}
            className="min-w-0 shrink-0 rounded-3xl"
            style={
              {
                backgroundColor: section.appearance.backgroundColor,
                color: section.appearance.textColor || undefined,
                "--foreground": section.appearance.textColor || undefined,
                "--accent": section.appearance.accentColor || undefined,
              } as CSSProperties
            }
          >
            <DiscoveryBannersSection
              id={section.id}
              title={
                section.appearance?.showHeader === false
                  ? undefined
                  : section.title
              }
              subtitle={section.subtitle}
              items={section.items}
              {...parseDiscoveryBannersLayout(section.layout)}
              autoplay={false}
              className="min-w-0 shrink-0 px-4"
            />
          </div>
        ) : null,
      )}
    </>
  );
}
