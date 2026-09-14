"use client";
import { useAccumulatedQuery } from "@modules/discovery/hooks/use-accumulated-query";

import { useDiscoveryList } from "../../hooks/use-discovery-list";
import { DiscoverySearchField } from "../../components/DiscoverySearchField";
import { DiscoveryPagination } from "../../components/DiscoveryPagination";

import { DiscoveryQueryPage } from "../../components/DiscoveryQueryPage";
import { getQueryFailure } from "@/lib/request-failure";

import { usePublicCatalogResource } from "@api/discovery";
import { DiscoveryQueryState } from "../../components/DiscoveryQueryState";
import { DiscoveryImageHero } from "../../components/DiscoveryImageHero";
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
  const { query, setQuery, q, page, setPage } = useDiscoveryList();
  const provinces = usePublicCatalogResource("location", "province", {
    search: provinceId,
  });
  const province = provinces.data?.items.find(
    (item) => item.slug === provinceId || item.id === provinceId,
  );
  const citiesPage = usePublicCatalogResource(
    "location",
    "city",
    province
      ? { parentId: province.id, search: q, page, limit: 50 }
      : undefined,
    Boolean(province),
  );
  const cities = useAccumulatedQuery(
    citiesPage,
    page,
    JSON.stringify([provinceId, q]),
  );

  if (
    getQueryFailure(provinces.error, provinces.fetchStatus) &&
    !provinces.data
  )
    return <DiscoveryQueryPage title="کشف" query={provinces} />;
  if (provinces.isPending) {
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
      <SecondaryHeader title={province.name} showFilter={false} />
      <DiscoveryImageHero
        title={`ورزش در ${province.name}`}
        description="یک شهر انتخاب کن و باشگاه‌های اطرافت را بشناس."
        imageUrl={
          typeof province.imageUrl === "string"
            ? province.imageUrl
            : "/profile/cover.jpg"
        }
        eyebrow="کشف استان"
      />
      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder="جست‌وجو در این منطقه"
      />
      <DiscoveryQueryState query={cities} />
      {cities.isLoading ? <CityCatalogSkeleton /> : null}
      {items.length ? (
        <DiscoveryCitiesProvinceSection
          province={{ id: province.id, name: province.name, cities: items }}
        />
      ) : cities.isSuccess ? (
        <DiscoveryEmptySection
          title={`شهری در ${province.name} پیدا نشد`}
          subtitle="هنوز شهر فعالی برای این استان ثبت نشده است."
          icon="pin-1"
        />
      ) : null}
      <DiscoveryPagination
        page={page}
        total={cities.data?.total ?? 0}
        limit={50}
        onChange={setPage}
        pending={cities.isFetching}
        failed={cities.isError}
        onRetry={() => void cities.refetch()}
      />
    </main>
  );
}
