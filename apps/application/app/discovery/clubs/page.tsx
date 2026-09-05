"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DiscoveryClubsScreen } from "@modules/discovery/screens/DiscoveryClubsScreen";
import type { DiscoveryClubsBrowse } from "@modules/discovery/screens/DiscoveryClubsScreen";
import { ListPageSkeleton } from "@/components/loading-skeletons";

export default function ClubsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <ClubsPageContent />
    </Suspense>
  );
}

function ClubsPageContent() {
  const searchParams = useSearchParams();
  return <DiscoveryClubsScreen browse={toBrowse(searchParams)} />;
}

function toBrowse(params: Pick<URLSearchParams, "get">): DiscoveryClubsBrowse {
  const sort = params.get("sort");
  return {
    sort: sort === "rating" || sort === "newest" ? sort : undefined,
    sportId: params.get("sportId") ?? undefined,
    clubTypeId: params.get("clubTypeId") ?? undefined,
    clubTypeSlug: params.get("club_types") ?? undefined,
    nearby: params.get("nearby") === "1",
  };
}
