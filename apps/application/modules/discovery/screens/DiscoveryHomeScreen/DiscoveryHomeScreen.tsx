"use client";

import type { CSSProperties } from "react";
import { useDiscoveryFeed, type DiscoverySection } from "@api/discovery";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { DiscoveryDynamicSection } from "@modules/discovery/sections/DiscoveryDynamicSection";
import { DiscoveryIranMapSection } from "@modules/discovery/sections/DiscoveryIranMapSection";
import { RequestFailureState } from "@/components/request-failure-state";
import { SectionSkeleton } from "@/components/loading-skeletons";
import { getQueryFailure } from "@/lib/request-failure";

export function DiscoveryHomeScreen() {
  const feed = useDiscoveryFeed();
  const failure = getQueryFailure(feed.error, feed.fetchStatus);
  const sections = feed.data ?? [];
  const mapBanner = sections.find((section) => section.type === "banners");
  const contentSections = mapBanner
    ? sections.filter((section) => section.id !== mapBanner.id)
    : sections;

  return (
    <main className="app-page gap-6">
      <SecondaryHeader />
      {feed.isPending && !failure ? (
        <div className="space-y-8">
          <SectionSkeleton cards={3} />
          <SectionSkeleton cards={2} />
        </div>
      ) : null}
      {failure ? (
        <RequestFailureState
          error={failure}
          onRetry={() => void feed.refetch()}
        />
      ) : null}
      {contentSections.slice(0, 3).map(renderFeedSection)}
      <DiscoveryIranMapSection />
      {mapBanner ? renderFeedSection(mapBanner) : null}
      {contentSections.slice(3).map(renderFeedSection)}
    </main>
  );
}

function renderFeedSection(section: DiscoverySection) {
  const style = {
    ...(section.appearance.backgroundColor
      ? { backgroundColor: section.appearance.backgroundColor }
      : {}),
    ...(section.appearance.textColor
      ? {
          color: section.appearance.textColor,
          "--foreground": section.appearance.textColor,
        }
      : {}),
    ...(section.appearance.accentColor
      ? { "--accent": section.appearance.accentColor }
      : {}),
  } as CSSProperties;

  return (
    <div key={section.id} style={style} className="rounded-[1.5rem]">
      <DiscoveryDynamicSection section={section} />
    </div>
  );
}
