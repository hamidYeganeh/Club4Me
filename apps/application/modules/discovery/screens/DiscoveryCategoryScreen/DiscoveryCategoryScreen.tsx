"use client";

import { usePublicCatalogResource } from "@api/discovery";
import { DiscoveryClubsScreen } from "@modules/discovery/screens/DiscoveryClubsScreen";
import { ListPageSkeleton } from "@/components/loading-skeletons";

const resources = {
  "club-types": ["sports", "club-type"],
  sports: ["sports", "sport"],
  regions: ["location", "city-region"],
} as const;

export function DiscoveryCategoryScreen({
  type,
  id,
}: {
  type: keyof typeof resources;
  id: string;
}) {
  const [category, resource] = resources[type];
  const query = usePublicCatalogResource(category, resource, { search: id });
  const item = query.data?.items.find((entry) => entry.slug === id);

  if (query.isPending) {
    return <ListPageSkeleton />;
  }
  if (!item) {
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-sm text-muted">
        این دسته‌بندی پیدا نشد.
      </main>
    );
  }

  return (
    <DiscoveryClubsScreen
      layout="list"
      title={item.name}
      description={
        typeof item.description === "string" ? item.description : undefined
      }
      browse={
        type === "club-types"
          ? { clubTypeId: item.id }
          : type === "sports"
            ? { sportId: item.id }
            : undefined
      }
      initialFilters={
        type === "regions" ? { cityRegionId: item.id } : undefined
      }
    />
  );
}
