"use client";

import { useMemo, useState } from "react";
import { Button, Spinner, Typography } from "@heroui/react";
import { useCatalogClubs } from "@api/discovery";

import { ButtonLink } from "@/components/button-link";
import { NeshanMap } from "@/components/maps/neshan-map";
import { DiscoveryPageHeader } from "@modules/discovery/components/DiscoveryPageHeader";
import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";

export function DiscoveryMapScreen() {
  const clubs = useCatalogClubs({ limit: 100 });
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
  const point = selected
    ? {
        latitude: selected.location!.coordinates[1],
        longitude: selected.location!.coordinates[0],
        address: selected.address,
      }
    : null;

  return (
    <main className="flex min-h-dvh flex-col gap-5 px-5 pb-[calc(6.25rem+env(safe-area-inset-bottom))]">
      <DiscoveryPageHeader
        title="نقشه باشگاه‌ها"
        description="باشگاه‌های دارای موقعیت ثبت‌شده را روی نقشه پیدا کن."
      />
      {clubs.isLoading ? (
        <div className="flex min-h-80 items-center justify-center">
          <Spinner />
        </div>
      ) : null}
      {clubs.isError ? (
        <Button variant="secondary" onPress={() => clubs.refetch()}>
          تلاش دوباره
        </Button>
      ) : null}
      {point ? (
        <NeshanMap
          center={point}
          marker={point}
          markerLabel={selected?.name}
          zoom={12}
          className="h-[48dvh] min-h-80"
        />
      ) : !clubs.isLoading && !clubs.isError ? (
        <div className="flex min-h-80 items-center justify-center rounded-3xl bg-surface-secondary px-8 text-center text-sm text-muted">
          هنوز برای هیچ باشگاه تأییدشده‌ای مختصات نقشه ثبت نشده است.
        </div>
      ) : null}
      <div className="flex items-center justify-between">
        <Typography type="body-sm" weight="bold">
          باشگاه‌های این محدوده
        </Typography>
        <ButtonLink size="sm" variant="secondary" href="/discovery/clubs">
          نمایش لیست
        </ButtonLink>
      </div>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
        {mappable.map((club) => (
          <div
            key={club.id}
            className={`w-[82vw] max-w-sm shrink-0 rounded-[1.6rem] ${selected?.id === club.id ? "ring-2 ring-accent" : ""}`}
            onPointerEnter={() => setSelectedId(club.id)}
          >
            <DiscoveryResultCard
              title={club.name}
              subtitle={club.address || club.shortDescription}
              meta={`${club.averageRating.toLocaleString("fa-IR")} ★`}
              imageUrl={club.imageUrl ?? "/mock/clubs/01.jpg"}
              href={`/discovery/clubs/${club.id}`}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
