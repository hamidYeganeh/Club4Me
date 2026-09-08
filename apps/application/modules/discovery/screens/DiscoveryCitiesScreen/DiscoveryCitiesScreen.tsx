"use client";

import { useMemo } from "react";
import { usePublicCatalogResource } from "@api/discovery";
import { SecondaryHeader } from "../../components/SecondaryHeader";
import { DiscoveryCitiesProvinceSection } from "../../sections/DiscoveryCitiesProvinceSection";
import { CityCatalogSkeleton } from "@/components/loading-skeletons";
import { DiscoveryEmptySection } from "../../components/DiscoveryEmptySection";
import { DiscoveryBrowseIntro } from "../../components/DiscoveryBrowseIntro";
import { DiscoverySearchField } from "../../components/DiscoverySearchField";
import { DiscoveryPagination } from "../../components/DiscoveryPagination";
import { DiscoveryQueryState } from "../../components/DiscoveryQueryState";
import { useDiscoveryList } from "../../hooks/use-discovery-list";

export function DiscoveryCitiesScreen() {
  const { query, setQuery, q, page, setPage } = useDiscoveryList();
  const provinces = usePublicCatalogResource("location", "province", {
    limit: 100,
  });
  const cities = usePublicCatalogResource("location", "city", {
    search: q,
    page,
    limit: 50,
  });
  const groups = useMemo(() => {
    const names = new Map(
      (provinces.data?.items ?? []).map((province) => [
        province.id,
        province.name,
      ]),
    );
    const grouped = new Map<
      string,
      {
        id: string;
        name: string;
        cities: {
          id: string;
          name: string;
          clubsCount: number;
          imageUrl: string;
        }[];
      }
    >();
    for (const city of cities.data?.items ?? []) {
      const id = String(city.provinceId ?? "other");
      const group = grouped.get(id) ?? {
        id,
        name: names.get(id) ?? "شهرها",
        cities: [],
      };
      group.cities.push({
        id: String(city.slug || city.id),
        name: city.name,
        clubsCount: typeof city.clubsCount === "number" ? city.clubsCount : 0,
        imageUrl: typeof city.imageUrl === "string" ? city.imageUrl : "",
      });
      grouped.set(id, group);
    }
    return [...grouped.values()];
  }, [provinces.data, cities.data]);

  return (
    <main className="app-page gap-6">
      <SecondaryHeader title="شهرها" showFilter={false} />
      <DiscoveryBrowseIntro
        title="نزدیک‌تر به تمرین"
        description="شهرت را پیدا کن و باشگاه‌های هر منطقه را ببین."
        icon="pin-1"
      />
      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder="جست‌وجوی نام شهر"
      />
      <DiscoveryQueryState query={provinces} />
      <DiscoveryQueryState query={cities} />
      {cities.isLoading ? <CityCatalogSkeleton /> : null}
      {cities.isSuccess && groups.length === 0 ? (
        <DiscoveryEmptySection
          title="شهری پیدا نشد"
          subtitle="نام شهر دیگری را جست‌وجو کن."
          icon="pin-1"
        />
      ) : null}
      <div className="flex flex-col gap-8">
        {groups.map((province) => (
          <DiscoveryCitiesProvinceSection
            key={province.id}
            province={province}
          />
        ))}
      </div>
      <DiscoveryPagination
        page={page}
        total={cities.data?.total ?? 0}
        limit={50}
        onChange={setPage}
        pending={cities.isFetching}
      />
    </main>
  );
}
