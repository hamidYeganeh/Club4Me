"use client";

import { mockDiscoveryBanners } from "@modules/discovery/discovery-banners.mock";
import { DiscoveryBannersSection } from "@modules/discovery/sections/DiscoveryBannersSection";

/** @deprecated Prefer `DiscoveryBannersSection` directly. */
export function DiscoveryHomeBannerSection() {
  return (
    <DiscoveryBannersSection
      id="home-legacy"
      items={mockDiscoveryBanners(0, 4)}
      aspectRatio="16/9"
      slidesPerView={1}
    />
  );
}
