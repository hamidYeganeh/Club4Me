"use client";

import { useMemo } from "react";
import { usePublicCatalogResource } from "@api/discovery";
import { SecondaryHeader } from "../../components/SecondaryHeader";
import { DiscoveryCitiesProvinceSection } from "../../sections/DiscoveryCitiesProvinceSection";
import { CityCatalogSkeleton } from "@/components/loading-skeletons";
import { DiscoveryEmptySection } from "../../components/DiscoveryEmptySection";
import { FallbackImage } from "@/components/FallbackImage";
import { Icon } from "@theme/icon";
import styles from "./DiscoveryCitiesScreen.module.css";
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
    <main className={`app-page gap-5 ${styles.page}`}>
      <SecondaryHeader title="شهرها" showFilter={false} />
      <section className={styles.hero} aria-labelledby="cities-intro-title">
        <FallbackImage
          src="/discovery/locations/city-heritage.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 640px) 100vw, 640px"
          className={styles.heroImage}
        />
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>
            <Icon name="pin-1" size={14} />
            کشف شهرها
          </span>
          <h2 id="cities-intro-title" className={styles.heading}>
            نزدیک‌تر به تمرین
          </h2>
          <p className={styles.description}>شهر تو، شروع یک مسیر تازه</p>
          <p className={styles.caption}>
            شهرت را پیدا کن و باشگاه‌های هر منطقه را ببین.
          </p>
        </div>
      </section>
      <div className={styles.search}>
        <DiscoverySearchField
          value={query}
          onChange={setQuery}
          placeholder="جست‌وجوی نام شهر"
        />
      </div>
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
      <div className="flex flex-col gap-6">
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
