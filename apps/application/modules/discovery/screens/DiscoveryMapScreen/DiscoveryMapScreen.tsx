"use client";

import { useMemo, useState } from "react";
import { Button, Spinner, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { useCatalogClubs } from "@api/discovery";
import { useTranslations } from "next-intl";

import { ButtonLink } from "@/components/button-link";
import { NeshanMap, type NeshanMapMarker } from "@/components/maps/neshan-map";
import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
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
    label: club.name,
  }));

  return (
    <main className={styles.root()}>
      <SecondaryHeader
        title={t("title")}
        showFilter={false}
        action={
          <ButtonLink
            isIconOnly
            variant="ghost"
            aria-label={t("listAria")}
            href="/discovery/clubs"
            className="size-10 min-w-10 text-foreground"
          >
            <Icon name="list-two-bullet" size={22} />
          </ButtonLink>
        }
      />
      <div className={styles.mapWrap()}>
        <NeshanMap
          center={center}
          markers={markers}
          selectedMarkerId={selected?.id}
          zoom={13}
          className={styles.map()}
          locateClassName="bottom-[calc(11.5rem+env(safe-area-inset-bottom))]"
          onMarkerSelect={setSelectedId}
        />
        {clubs.isLoading ? (
          <div className={styles.status()}>
            <Spinner />
          </div>
        ) : null}
        {clubs.isError ? (
          <div className={styles.status()}>
            <div>
              <Typography type="body-sm">{t("error")}</Typography>
              <Button
                variant="secondary"
                className={styles.retry()}
                onPress={() => clubs.refetch()}
              >
                {t("retry")}
              </Button>
            </div>
          </div>
        ) : null}
        {!clubs.isLoading && !clubs.isError && mappable.length === 0 ? (
          <div className={styles.empty()}>{t("empty")}</div>
        ) : null}
        {mappable.length > 0 ? (
          <div className={styles.rail()}>
            <div className={styles.railHeader()}>
              <Typography type="body-sm" weight="bold">
                {t("clubsInArea")}
              </Typography>
              <ButtonLink size="sm" variant="secondary" href="/discovery/clubs">
                {t("viewList")}
              </ButtonLink>
            </div>
            <div className={styles.scroller()}>
              {mappable.map((club) => (
                <div
                  key={club.id}
                  className={`${styles.card()} ${selected?.id === club.id ? styles.cardSelected() : ""}`}
                  onClickCapture={(event) => {
                    if (selected?.id === club.id) {
                      return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    setSelectedId(club.id);
                  }}
                >
                  <DiscoveryResultCard
                    title={club.name}
                    subtitle={club.address || club.shortDescription}
                    meta={`${club.averageRating.toLocaleString("fa-IR")} ★`}
                    imageUrl={club.imageUrl}
                    href={`/discovery/clubs/${club.id}`}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
