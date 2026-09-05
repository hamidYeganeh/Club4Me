"use client";

import { usePublicCatalogResource } from "@api/discovery";
import { DiscoveryClubsScreen } from "@modules/discovery/screens/DiscoveryClubsScreen";
import { ListPageSkeleton } from "@/components/loading-skeletons";

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
      <main className="grid min-h-dvh place-items-center p-6 text-sm text-muted">
        این منطقه پیدا نشد.
      </main>
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
