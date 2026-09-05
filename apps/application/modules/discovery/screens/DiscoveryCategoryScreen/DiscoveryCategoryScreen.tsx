"use client";

import { usePublicCatalogResource } from "@api/discovery";
import { DiscoveryClubsScreen } from "@modules/discovery/screens/DiscoveryClubsScreen";
import { ListPageSkeleton } from "@/components/loading-skeletons";
import { DiscoveryEmptyPage } from "@modules/discovery/components/DiscoveryEmptyPage";

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
      <DiscoveryEmptyPage
        headerTitle={
          type === "regions"
            ? "منطقه شهری"
            : type === "sports"
              ? "رشته ورزشی"
              : "نوع باشگاه"
        }
        title="این دسته‌بندی پیدا نشد"
        description="ممکن است این دسته‌بندی هنوز داده‌ای نداشته باشد یا غیرفعال شده باشد."
      />
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
