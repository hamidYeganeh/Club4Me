"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { useDiscoveryFeed, type DiscoverySection } from "@api/discovery";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { DiscoveryDynamicSection } from "@modules/discovery/sections/DiscoveryDynamicSection";
import { DiscoveryIranMapSection } from "@modules/discovery/sections/DiscoveryIranMapSection";
import { DiscoveryIranMapSkeleton } from "../../components/skeletons/DiscoveryIranMapSkeleton";
import { RequestFailureState } from "@/components/request-failure-state";
import { defaultDiscoveryLayouts } from "../../components/discovery-default-layouts";
import {
  loadingSection,
  type DiscoverySectionLayout,
} from "../../components/discovery-placeholder-sections";
import { getQueryFailure } from "@/lib/request-failure";

export function DiscoveryHomeScreen() {
  const feed = useDiscoveryFeed();
  const failure = getQueryFailure(feed.error, feed.fetchStatus);
  const [layouts, setLayouts] = useState(defaultDiscoveryLayouts);
  useEffect(() => {
    try {
      const cached = JSON.parse(
        localStorage.getItem("discovery-section-layouts-v1") ?? "null",
      ) as DiscoverySectionLayout[] | null;
      if (
        Array.isArray(cached) &&
        cached.every(
          (item) =>
            item &&
            typeof item.id === "string" &&
            typeof item.layout === "string" &&
            typeof item.key === "string" &&
            item.appearance &&
            [
              "clubs",
              "coaches",
              "articles",
              "sports",
              "banners",
              "classes",
            ].includes(item.type),
        )
      ) {
        // Restore the public layout snapshot after hydration, before the network feed arrives.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLayouts(cached);
      }
    } catch {
      /* Storage may be unavailable. The default layout is still usable. */
    }
  }, []);
  useEffect(() => {
    if (!feed.data) return;
    try {
      localStorage.setItem(
        "discovery-section-layouts-v1",
        JSON.stringify(
          feed.data.map(({ items, ...layout }) => {
            return {
              ...layout,
              skeletonCount: Math.max(1, Math.min(items.length, 12)),
            };
          }),
        ),
      );
    } catch {
      /* A layout cache is optional. */
    }
  }, [feed.data]);
  const loading = feed.isPending && !failure;
  const sections = feed.data ?? (loading ? layouts.map(loadingSection) : []);
  const mapBanner = sections.find((section) => section.type === "banners");
  const contentSections = mapBanner
    ? sections.filter((section) => section.id !== mapBanner.id)
    : sections;

  return (
    <main className="app-page gap-6 pb-[calc(130px+env(safe-area-inset-bottom))]">
      <SecondaryHeader />
      {failure ? (
        <RequestFailureState
          error={failure}
          onRetry={() => void feed.refetch()}
        />
      ) : null}
      {loading ? (
        <span role="status" className="sr-only">
          در حال بارگذاری بخش‌های کشف
        </span>
      ) : null}
      {contentSections
        .slice(0, 3)
        .map((section) => renderFeedSection(section, loading))}
      {loading ? <DiscoveryIranMapSkeleton /> : <DiscoveryIranMapSection />}
      {mapBanner ? renderFeedSection(mapBanner, loading) : null}
      {contentSections
        .slice(3)
        .map((section) => renderFeedSection(section, loading))}
    </main>
  );
}

function renderFeedSection(
  section: DiscoverySection & { skeletonCount?: number },
  loading = false,
) {
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
    <div
      key={section.id}
      data-discovery-section={section.id}
      style={style}
      inert={loading}
      aria-hidden={loading || undefined}
      className={`rounded-[1.5rem] ${loading ? "discovery-section-skeleton" : ""}`}
    >
      <DiscoveryDynamicSection
        section={section}
        isLoading={loading}
        skeletonCount={section.skeletonCount}
      />
    </div>
  );
}

export function DiscoveryHomeSkeleton() {
  const sections = defaultDiscoveryLayouts.map(loadingSection);
  const mapBanner = sections.find((section) => section.type === "banners");
  const content = sections.filter((section) => section.id !== mapBanner?.id);
  return (
    <main
      className="app-page gap-6 pb-[calc(130px+env(safe-area-inset-bottom))]"
      aria-busy="true"
    >
      <SecondaryHeader />
      <span role="status" className="sr-only">
        در حال بارگذاری بخش‌های کشف
      </span>
      {content.slice(0, 3).map((section) => renderFeedSection(section, true))}
      <DiscoveryIranMapSkeleton />
      {mapBanner ? renderFeedSection(mapBanner, true) : null}
      {content.slice(3).map((section) => renderFeedSection(section, true))}
    </main>
  );
}
