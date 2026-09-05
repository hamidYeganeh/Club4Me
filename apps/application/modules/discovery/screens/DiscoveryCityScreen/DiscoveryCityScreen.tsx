"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Skeleton, Typography } from "@heroui/react";
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
  const router = useRouter();
  const styles = discoveryCityScreenStyles();
  const cities = usePublicCatalogResource("location", "city", {
    search: cityId,
  });
  const city = cities.data?.items.find((item) => item.slug === cityId);
  const districts = usePublicCatalogResource(
    "location",
    "district",
    city ? { parentId: city.id } : undefined,
    Boolean(city),
  );
  const clubs = useCatalogClubs(
    city ? { cityId: city.id, limit: 1 } : undefined,
    Boolean(city),
  );

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
      <section className={styles.hero()} aria-labelledby="city-title">
        <FallbackImage
          src={typeof city.imageUrl === "string" ? city.imageUrl : ""}
          alt={`باشگاه‌های ${city.name}`}
          fill
          priority
          unoptimized
          sizes="(max-width: 576px) 100vw, 576px"
          className={styles.heroImage()}
        />
        <div className={styles.heroOverlay()} aria-hidden />
        <div className={styles.topBar()}>
          <Button
            isIconOnly
            variant="secondary"
            size="lg"
            aria-label="بازگشت"
            className={styles.backButton()}
            onPress={() => router.back()}
          >
            <Icon name="chevron-right" size="lg" />
          </Button>
        </div>
        <div className={styles.heroCopy()}>
          {clubs.isPending ? (
            <Skeleton
              className="h-4 w-20 rounded-lg"
              aria-label="در حال بارگذاری تعداد باشگاه‌ها"
            />
          ) : (
            <Typography
              type="body-sm"
              weight="bold"
              className={styles.eyebrow()}
            >
              {(clubs.data?.total ?? 0).toLocaleString("fa-IR")} باشگاه
            </Typography>
          )}
          <Typography
            id="city-title"
            type="h2"
            weight="bold"
            className={styles.heroTitle()}
          >
            باشگاه‌های {city.name}
          </Typography>
          <Typography type="body-sm" className={styles.heroDescription()}>
            بهترین باشگاه‌ها را در منطقه مورد نظرت پیدا و مقایسه کن.
          </Typography>
        </div>
      </section>
      <section className={styles.sheet()} aria-labelledby="districts-title">
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
        {!districts.isPending && (districts.data?.items.length ?? 0) === 0 ? (
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
    </main>
  );
}
