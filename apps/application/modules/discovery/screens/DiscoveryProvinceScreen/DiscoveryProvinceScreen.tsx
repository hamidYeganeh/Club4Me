"use client";

import { usePublicCatalogResource } from "@api/discovery";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { DiscoveryEmptyPage } from "@modules/discovery/components/DiscoveryEmptyPage";
import { DiscoveryEmptySection } from "@modules/discovery/components/DiscoveryEmptySection";
import { DiscoveryCitiesProvinceSection } from "@modules/discovery/sections/DiscoveryCitiesProvinceSection";
import { CityCatalogSkeleton } from "@/components/loading-skeletons";

export function DiscoveryProvinceScreen({
  provinceId,
}: {
  provinceId: string;
}) {
  const provinces = usePublicCatalogResource("location", "province", {
    search: provinceId,
  });
  const province = provinces.data?.items.find(
    (item) => item.slug === provinceId,
  );
  const cities = usePublicCatalogResource(
    "location",
    "city",
    province ? { parentId: province.id } : undefined,
    Boolean(province),
  );

  if (provinces.isPending || (province && cities.isPending)) {
    return <CityCatalogSkeleton />;
  }
  if (!province) {
    return (
      <DiscoveryEmptyPage
        headerTitle="استان"
        title="این استان پیدا نشد"
        description="هنوز استانی با این مشخصات برای نمایش وجود ندارد."
      />
    );
  }

  const items = (cities.data?.items ?? []).map((city) => ({
    id: String(city.slug ?? city.id),
    name: city.name,
    clubsCount: typeof city.clubsCount === "number" ? city.clubsCount : 0,
    imageUrl: typeof city.imageUrl === "string" ? city.imageUrl : "",
  }));

  return (
    <main className="app-page gap-8">
      <SecondaryHeader title={province.name} />
      {items.length ? (
        <DiscoveryCitiesProvinceSection
          province={{ id: province.id, name: province.name, cities: items }}
        />
      ) : (
        <DiscoveryEmptySection
          title={`شهری در ${province.name} پیدا نشد`}
          subtitle="هنوز شهر فعالی برای این استان ثبت نشده است."
          icon="pin-1"
        />
      )}
    </main>
  );
}
