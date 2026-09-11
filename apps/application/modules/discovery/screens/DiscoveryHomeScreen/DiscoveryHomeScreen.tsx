"use client";

import Link from "@/components/app-link";
import { type CSSProperties, useEffect } from "react";
import { useDiscoveryFeed, type DiscoverySection } from "@api/discovery";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { DiscoveryDynamicSection } from "@modules/discovery/sections/DiscoveryDynamicSection";
import { DiscoveryIranMapSection } from "@modules/discovery/sections/DiscoveryIranMapSection";
import { DiscoveryNearbySection } from "../../sections/DiscoveryNearbySection";
import { RequestFailureState } from "@/components/request-failure-state";
import { getQueryFailure } from "@/lib/request-failure";

export function DiscoveryHomeScreen() {
  const feed = useDiscoveryFeed();
  const failure = getQueryFailure(feed.error, feed.fetchStatus);
  useEffect(() => {
    if (!feed.data?.length) return;
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
  const sections = feed.data ?? [];
  const mapBanner = sections.find((section) => section.type === "banners");
  const contentSections = mapBanner
    ? sections.filter((section) => section.id !== mapBanner.id)
    : sections;

  return (
    <main className="app-page gap-6 pb-[calc(11rem+env(safe-area-inset-bottom))]">
      <SecondaryHeader />
      <Link
        href="/athlete/recommendations"
        className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-accent/20 bg-surface p-4 text-sm"
      >
        <span>
          <strong className="block">کلاس مناسب برنامه من</strong>
          <span className="mt-1 block text-xs text-muted">
            زمان، بودجه و فاصله را انتخاب کن؛ گزینه‌ها را مقایسه کن.
          </span>
        </span>
        <span aria-hidden="true">←</span>
      </Link>
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
      {contentSections.slice(0, 3).map((section) => renderFeedSection(section))}
      {!loading ? <DiscoveryIranMapSection /> : null}
      <DiscoveryNearbySection />
      {mapBanner ? renderFeedSection(mapBanner) : null}
      {contentSections.slice(3).map((section) => renderFeedSection(section))}
    </main>
  );
}

function renderFeedSection(
  section: DiscoverySection & { skeletonCount?: number },
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
      className="rounded-[1.5rem]"
    >
      <DiscoveryDynamicSection
        section={section}
        isLoading={false}
        skeletonCount={section.skeletonCount}
      />
    </div>
  );
}
