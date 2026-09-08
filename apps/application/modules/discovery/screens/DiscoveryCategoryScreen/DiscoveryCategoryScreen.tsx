"use client";

import { DiscoveryQueryPage } from "../../components/DiscoveryQueryPage";
import { getQueryFailure } from "@/lib/request-failure";

import { usePublicCatalogResource } from "@api/discovery";
import { DiscoveryBrowseIntro } from "../../components/DiscoveryBrowseIntro";
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
  const item = query.data?.items.find(
    (entry) => entry.slug === id || entry.id === id,
  );

  if (getQueryFailure(query.error, query.fetchStatus) && !query.data)
    return <DiscoveryQueryPage title="کشف" query={query} />;
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
      key={item.id}
      intro={
        <DiscoveryBrowseIntro
          title={item.name}
          description={
            (typeof item.description === "string" && item.description) ||
            "باشگاه‌ها را مقایسه کن و محل تمرینت را انتخاب کن."
          }
          icon={
            type === "sports"
              ? "soccer"
              : type === "regions"
                ? "pin-1"
                : "building-1"
          }
        />
      }
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
