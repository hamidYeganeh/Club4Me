"use client";

import { useDiscoveryFeed } from "@api/discovery";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { DiscoveryDynamicSection } from "@modules/discovery/sections/DiscoveryDynamicSection";
import { DiscoveryHomeExploreSection } from "@modules/discovery/sections/DiscoveryHomeExploreSection";
import { RequestFailureState } from "@/components/request-failure-state";
import { SectionSkeleton } from "@/components/loading-skeletons";

export function DiscoveryHomeScreen() {
  const feed = useDiscoveryFeed();

  return (
    <main className="app-page gap-6">
      <SecondaryHeader />
      <DiscoveryHomeExploreSection />
      {feed.isPending ? (
        <div className="space-y-8">
          <SectionSkeleton cards={3} />
          <SectionSkeleton cards={2} />
        </div>
      ) : null}
      {feed.isError ? (
        <RequestFailureState
          error={feed.error}
          onRetry={() => void feed.refetch()}
        />
      ) : null}
      {feed.data?.map((section) => (
        <DiscoveryDynamicSection key={section.id} section={section} />
      ))}
    </main>
  );
}
