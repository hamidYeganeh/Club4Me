"use client";
import { useDiscoveryList } from "../../hooks/use-discovery-list";
import { useAccumulatedQuery } from "../../hooks/use-accumulated-query";
import { Button } from "@heroui/react";
import { Virtual } from "swiper/modules";
import { SecondaryHeader } from "../../components/SecondaryHeader";

import { useEffect, useMemo, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { ClubCard } from "@ui/club-card";
import { useCatalogClubs } from "@api/discovery";
import { useTranslations } from "next-intl";

import { NeshanMap, type NeshanMapMarker } from "@/components/maps/neshan-map";
import { RequestFailureState } from "@/components/request-failure-state";
import { MapResultsSkeleton } from "@/components/loading-skeletons";
import { getQueryFailure } from "@/lib/request-failure";
import {
  getActiveCoordinates,
  useActiveLocation,
} from "@modules/locations/active-location";

import { discoveryMapScreenStyles } from "./DiscoveryMapScreen.styles";

const TEHRAN = { latitude: 35.6892, longitude: 51.389 };

export function DiscoveryMapScreen() {
  const t = useTranslations("discovery.map");
  const styles = discoveryMapScreenStyles();
  const { active } = useActiveLocation();
  const coords = getActiveCoordinates(active);
  const { q, page, setPage } = useDiscoveryList();
  const radiusKm = 25;
  const clubsPage = useCatalogClubs({
    q,
    page,
    limit: 20,
    ...(coords
      ? {
          latitude: coords.latitude,
          longitude: coords.longitude,
          radiusKm,
        }
      : {}),
  });
  const clubs = useAccumulatedQuery(
    clubsPage,
    page,
    JSON.stringify([q, radiusKm, coords]),
  );
  const hasMore = page * 20 < (clubs.data?.total ?? 0);
  const loadMore = () => {
    if (hasMore && !clubs.isFetching && !clubs.isError) setPage(page + 1);
  };
  const failure = getQueryFailure(clubs.error, clubs.fetchStatus);
  const mappable = useMemo(
    () =>
      (clubs.data?.items ?? []).filter(
        (club) => club.location?.coordinates.length === 2,
      ),
    [clubs.data?.items],
  );
  const [selectedId, setSelectedId] = useState<string>();
  const carousel = useRef<SwiperType | null>(null);
  useEffect(() => {
    const index = mappable.findIndex((club) => club.id === selectedId);
    if (index >= 0 && carousel.current && !carousel.current.destroyed)
      carousel.current.slideTo(index);
  }, [selectedId, mappable]);
  const selected =
    mappable.find((club) => club.id === selectedId) ?? mappable[0];
  const center = selected
    ? {
        latitude: selected.location!.coordinates[1],
        longitude: selected.location!.coordinates[0],
      }
    : (coords ?? TEHRAN);
  const markers: NeshanMapMarker[] = mappable.map((club) => ({
    id: club.id,
    latitude: club.location!.coordinates[1],
    longitude: club.location!.coordinates[0],
    imageUrl: club.imageUrl,
    label: club.name,
  }));

  return (
    <main className={styles.root()}>
      <SecondaryHeader title={t("title")} showFilter={false} />
      <div className={styles.mapWrap()}>
        <NeshanMap
          center={center}
          markers={markers}
          selectedMarkerId={selected?.id}
          zoom={13}
          className={styles.map()}
          locateClassName={styles.locate()}
          onMarkerSelect={setSelectedId}
        />
        {clubs.isLoading && !failure ? <MapResultsSkeleton /> : null}
        {failure ? (
          <div className={styles.status()}>
            <RequestFailureState
              compact
              error={failure}
              onRetry={() => void clubs.refetch()}
            />
          </div>
        ) : null}
        {!clubs.isLoading && !failure && mappable.length === 0 ? (
          <div className={styles.empty()}>{t("empty")}</div>
        ) : null}
        {selected ? (
          <div className={styles.rail()}>
            <Swiper
              modules={[Virtual]}
              virtual
              onReachEnd={loadMore}
              dir="rtl"
              slidesPerView={1.12}
              spaceBetween={12}
              onSwiper={(swiper) => {
                carousel.current = swiper;
              }}
              onSlideChange={(swiper) =>
                setSelectedId(mappable[swiper.activeIndex]?.id)
              }
            >
              {mappable.map((club, index) => (
                <SwiperSlide key={club.id} virtualIndex={index}>
                  <ClubCard
                    variant="compact"
                    title={club.name}
                    location={club.address}
                    imageUrl={club.imageUrl}
                    rating={club.averageRating}
                    reviewsCount={club.reviewsCount}
                    href={`/discovery/clubs/${club.slug}`}
                    className={styles.card()}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
            {hasMore || clubs.isError ? (
              <Button
                className="mt-2 w-full"
                variant="secondary"
                isPending={clubs.isFetching}
                onPress={() =>
                  clubs.isError ? void clubs.refetch() : loadMore()
                }
              >
                {clubs.isError ? "تلاش دوباره" : "باشگاه‌های بیشتر"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
