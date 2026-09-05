"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { PublicCatalogSearchKind } from "@api/discovery";
import { DiscoverySearchScreen } from "@modules/discovery/screens/DiscoverySearchScreen";
import { ListPageSkeleton } from "@/components/loading-skeletons";

export default function SearchPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const kind = useSearchParams().get("kind") ?? undefined;
  return (
    <DiscoverySearchScreen
      initialKind={isSearchKind(kind) ? kind : undefined}
    />
  );
}

function isSearchKind(value?: string): value is PublicCatalogSearchKind {
  return value === "club" || value === "coach" || value === "class";
}
