"use client";

import { useState } from "react";
import { DiscoveryPagination } from "../../components/DiscoveryPagination";

import { DiscoveryQueryPage } from "../../components/DiscoveryQueryPage";
import { getQueryFailure } from "@/lib/request-failure";

import Link from "@/components/app-link";
import { ButtonLink } from "@/components/button-link";
import { DiscoveryQueryState } from "../../components/DiscoveryQueryState";
import { SecondaryHeader } from "../../components/SecondaryHeader";
import { DiscoveryImageHero } from "../../components/DiscoveryImageHero";
import { Card, Skeleton, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { useCatalogClubs, usePublicCatalogResource } from "@api/discovery";

import { FallbackImage } from "@/components/FallbackImage";
import { discoveryCityScreenStyles } from "./DiscoveryCityScreen.styles";
import type { DiscoveryCityScreenProps } from "./DiscoveryCityScreen.types";
import {
  CityDetailSkeleton,
  DiscoveryResultCardSkeleton,
} from "@/components/loading-skeletons";
import { DiscoveryEmptyPage } from "@modules/discovery/components/DiscoveryEmptyPage";
import { DiscoveryEmptySection } from "@modules/discovery/components/DiscoveryEmptySection";

export function DiscoveryCityScreen({ cityId }: DiscoveryCityScreenProps) {
  const [page, setPage] = useState(1);
  const styles = discoveryCityScreenStyles();
  const cities = usePublicCatalogResource("location", "city", {
    search: cityId,
  });
  const city = cities.data?.items.find(
    (item) => item.slug === cityId || item.id === cityId,
  );
  const districts = usePublicCatalogResource(
    "location",
    "district",
    city ? { parentId: city.id, page, limit: 50 } : undefined,
    Boolean(city),
  );
  const clubs = useCatalogClubs(
    city ? { cityId: city.id, limit: 1 } : undefined,
    Boolean(city),
  );

  if (getQueryFailure(cities.error, cities.fetchStatus) && !cities.data)
    return <DiscoveryQueryPage title="کشف" query={cities} />;
  if (cities.isPending) return <CityDetailSkeleton />;
  if (!city)
    return (
      <DiscoveryEmptyPage
        headerTitle="شهر"
        title="این شهر پیدا نشد"
        description="هنوز شهری با این مشخصات برای نمایش وجود ندارد."
      />
    );

  return (
    <main className={styles.root()}>
      <SecondaryHeader title={city.name} showFilter={false} />
      <div className="mx-4 mt-4">
        <DiscoveryImageHero
          imageUrl={
            typeof city.imageUrl === "string"
              ? city.imageUrl
              : "/profile/cover.jpg"
          }
          title={`باشگاه‌های ${city.name}`}
          titleId="city-title"
          eyebrow="کشف شهر"
          description="باشگاه‌ها را در منطقهٔ مورد نظرت پیدا و مقایسه کن."
        >
          {clubs.data ? (
            <p className="mt-3 text-sm font-bold text-white">
              {clubs.data.total.toLocaleString("fa-IR")} باشگاه
            </p>
          ) : null}
        </DiscoveryImageHero>
      </div>
      <section className={styles.sheet()} aria-labelledby="districts-title">
        <ButtonLink
          href={`/discovery/clubs?cityId=${city.id}`}
          variant="primary"
          className="w-full"
        >
          مشاهده همه باشگاه‌های {city.name}
          <Icon name="arrow-left" size={18} />
        </ButtonLink>
        <DiscoveryQueryState query={clubs} />
        <DiscoveryQueryState query={districts} />
        <div className={styles.sheetHeader()}>
          <Typography id="districts-title" type="h4" weight="bold">
            مناطق {city.name}
          </Typography>
          {districts.isPending ? (
            <Skeleton
              className="h-4 w-16 rounded-lg"
              aria-label="در حال بارگذاری تعداد مناطق"
            />
          ) : (
            <Typography type="body-sm" color="muted">
              {(districts.data?.total ?? 0).toLocaleString("fa-IR")} منطقه
            </Typography>
          )}
        </div>
        {districts.isPending ? <DiscoveryResultCardSkeleton count={4} /> : null}
        {districts.isSuccess && districts.data.items.length === 0 ? (
          <DiscoveryEmptySection
            title={`منطقه‌ای در ${city.name} پیدا نشد`}
            subtitle="با اضافه شدن مناطق جدید، آن‌ها را اینجا خواهی دید."
            icon="pin-1"
          />
        ) : null}
        <div className={styles.list()}>
          {(districts.data?.items ?? []).map((district) => (
            <Card key={district.id} className={styles.card()}>
              <div className={styles.imageWrap()}>
                <FallbackImage
                  src={
                    typeof district.imageUrl === "string"
                      ? district.imageUrl
                      : ""
                  }
                  alt={district.name}
                  fill
                  unoptimized
                  sizes="88px"
                  className={styles.image()}
                />
              </div>
              <div className={styles.cardBody()}>
                <Card.Title className={styles.cardTitle()}>
                  {district.name}
                </Card.Title>
              </div>
              <span className={styles.arrow()} aria-hidden>
                <Icon name="arrow-left" size={20} />
              </span>
              <Link
                href={`/discovery/city/${cityId}/district/${String(district.slug ?? district.id)}`}
                className={styles.cardLink()}
                aria-label={district.name}
              />
            </Card>
          ))}
        </div>
      </section>
      <DiscoveryPagination
        page={page}
        total={districts.data?.total ?? 0}
        limit={50}
        onChange={setPage}
        pending={districts.isFetching}
      />
    </main>
  );
}
