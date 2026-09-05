"use client";

import { usePublicCatalogResource } from "@api/discovery";

import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { DiscoveryCitiesProvinceSection } from "@modules/discovery/sections/DiscoveryCitiesProvinceSection";
import { CityCatalogSkeleton } from "@/components/loading-skeletons";
import { DiscoveryEmptySection } from "@modules/discovery/components/DiscoveryEmptySection";

export function DiscoveryCitiesScreen() {
  const provinces = usePublicCatalogResource("location", "province");
  const cities = usePublicCatalogResource("location", "city");
  const groups = (provinces.data?.items ?? []).map((province) => ({
    id: province.id,
    name: province.name,
    cities: (cities.data?.items ?? [])
      .filter((city) => city.provinceId === province.id)
      .map((city) => ({
        id: String(city.slug ?? city.id),
        name: city.name,
        clubsCount: typeof city.clubsCount === "number" ? city.clubsCount : 0,
        imageUrl: typeof city.imageUrl === "string" ? city.imageUrl : "",
      })),
  }));
  const pending = provinces.isPending || cities.isPending;
  const hasCities = groups.some((province) => province.cities.length > 0);

  return (
    <main className="app-page gap-8">
      <SecondaryHeader title="شهرها" />
      {pending ? <CityCatalogSkeleton /> : null}
      {!pending && !hasCities ? (
        <DiscoveryEmptySection
          title="شهری پیدا نشد"
          subtitle="هنوز شهر فعالی برای نمایش در فهرست وجود ندارد."
          icon="pin-1"
        />
      ) : null}
      <div className="app-reveal flex flex-col gap-8">
        {groups.map((province) => (
          <DiscoveryCitiesProvinceSection
            key={province.id}
            province={province}
          />
        ))}
      </div>
    </main>
  );
}
