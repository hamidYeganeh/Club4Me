"use client";

import { usePublicCatalogResource } from "@api/discovery";
import { DiscoveryClubsScreen } from "@modules/discovery/screens/DiscoveryClubsScreen";
import { ListPageSkeleton } from "@/components/loading-skeletons";
import { DiscoveryEmptyPage } from "@modules/discovery/components/DiscoveryEmptyPage";

export function DiscoveryDistrictScreen({
  citySlug,
  districtSlug,
}: {
  citySlug: string;
  districtSlug: string;
}) {
  const cities = usePublicCatalogResource("location", "city", {
    search: citySlug,
  });
  const city = cities.data?.items.find((item) => item.slug === citySlug);
  const districts = usePublicCatalogResource(
    "location",
    "district",
    city ? { parentId: city.id, search: districtSlug } : undefined,
    Boolean(city),
  );
  const district = districts.data?.items.find(
    (item) => item.slug === districtSlug,
  );

  if (cities.isPending || (city && districts.isPending)) {
    return <ListPageSkeleton />;
  }
  if (!city || !district) {
    return (
      <DiscoveryEmptyPage
        headerTitle="منطقه"
        title="این منطقه پیدا نشد"
        description="هنوز منطقه‌ای با این مشخصات برای نمایش وجود ندارد."
      />
    );
  }
  return (
    <DiscoveryClubsScreen
      layout="list"
      title={`باشگاه‌های ${district.name}`}
      description={`بهترین باشگاه‌های ${district.name} در ${city.name}`}
      initialFilters={{ cityId: city.id, districtId: district.id }}
    />
  );
}
