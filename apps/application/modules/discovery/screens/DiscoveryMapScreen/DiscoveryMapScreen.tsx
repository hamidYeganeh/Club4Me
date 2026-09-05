"use client";

import { useMemo, useState } from "react";
import { Icon } from "@theme/icon";
import { ClubCard } from "@ui/club-card";
import { useCatalogClubs } from "@api/discovery";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { ButtonLink } from "@/components/button-link";
import { NeshanMap, type NeshanMapMarker } from "@/components/maps/neshan-map";
import { RequestFailureState } from "@/components/request-failure-state";
import { MapResultsSkeleton } from "@/components/loading-skeletons";
import {
  getActiveCoordinates,
  useActiveLocation,
} from "@modules/locations/active-location";

import { discoveryMapScreenStyles } from "./DiscoveryMapScreen.styles";

const TEHRAN = { latitude: 35.6892, longitude: 51.389 };

export function DiscoveryMapScreen() {
  const t = useTranslations("discovery.map");
  const router = useRouter();
  const styles = discoveryMapScreenStyles();
  const { active } = useActiveLocation();
  const coords = getActiveCoordinates(active);
  const clubs = useCatalogClubs({
    limit: 100,
    ...(coords
      ? {
          latitude: coords.latitude,
          longitude: coords.longitude,
          radiusKm: 25,
        }
      : {}),
  });
  const mappable = useMemo(
    () =>
      (clubs.data?.items ?? []).filter(
        (club) => club.location?.coordinates.length === 2,
      ),
    [clubs.data?.items],
  );
  const [selectedId, setSelectedId] = useState<string>();
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
      <header className={styles.header()}>
        <button
          type="button"
          aria-label="بازگشت"
          className={styles.headerButton()}
          onClick={() => router.back()}
        >
          <Icon name="chevron-right" size={22} />
        </button>
        <h1 className={styles.title()}>{t("title")}</h1>
        <div className={styles.headerAction()}>
          <ButtonLink
            isIconOnly
            variant="secondary"
            aria-label={t("listAria")}
            href="/discovery/clubs"
            className={styles.headerButton()}
          >
            <Icon name="list-two-bullet" size={22} />
          </ButtonLink>
        </div>
      </header>
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
        {clubs.isLoading ? (
          <MapResultsSkeleton />
        ) : null}
        {clubs.isError ? (
          <div className={styles.status()}>
            <RequestFailureState
              compact
              error={clubs.error}
              onRetry={() => void clubs.refetch()}
            />
          </div>
        ) : null}
        {!clubs.isLoading && !clubs.isError && mappable.length === 0 ? (
          <div className={styles.empty()}>{t("empty")}</div>
        ) : null}
        {selected ? (
          <div className={styles.rail()}>
            <ClubCard
              variant="compact"
              title={selected.name}
              location={selected.address || selected.shortDescription}
              imageUrl={selected.imageUrl}
              rating={selected.averageRating}
              reviewsCount={selected.reviewsCount}
              href={`/discovery/clubs/${selected.slug}`}
              className={styles.card()}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
