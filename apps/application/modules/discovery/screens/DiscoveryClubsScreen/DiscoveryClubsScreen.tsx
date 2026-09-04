"use client";

import { useDeferredValue, useState } from "react";
import { Button, Spinner, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import {
  useCatalogClubs,
  usePublicCatalogResource,
  type PublicCatalogParams,
} from "@api/discovery";
import { ButtonLink } from "@/components/button-link";

import { DiscoveryPageHeader } from "@modules/discovery/components/DiscoveryPageHeader";
import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";
import { DiscoverySearchField } from "@modules/discovery/components/DiscoverySearchField";

export function DiscoveryClubsScreen({
  title = "باشگاه‌ها",
  description = "باشگاه مناسب را پیدا و با گزینه‌های دیگر مقایسه کن.",
}: {
  title?: string;
  description?: string;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [filters, setFilters] = useState<PublicCatalogParams>({});
  const regions = usePublicCatalogResource("location", "city-region");
  const sports = usePublicCatalogResource("sports", "sport");
  const clubs = useCatalogClubs({ ...filters, q: deferredQuery || undefined });
  const visible = clubs.data?.items ?? [];

  const clearFilters = () => setFilters({});
  const nearby = () => {
    navigator.geolocation?.getCurrentPosition((position) => {
      setFilters({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        radiusKm: 25,
      });
    });
  };

  return (
    <main className="app-page gap-6">
      <DiscoveryPageHeader
        title={title}
        description={description}
        action={
          <ButtonLink
            isIconOnly
            variant="secondary"
            aria-label="نمایش روی نقشه"
            href="/discovery/map"
          >
            <Icon name="map-trifold" size={20} />
          </ButtonLink>
        }
      />
      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder="نام باشگاه، رشته یا منطقه"
      />
      <div className="app-chip-row app-reveal">
        <Button
          size="sm"
          variant={Object.keys(filters).length === 0 ? "primary" : "secondary"}
          className="shrink-0"
          onPress={clearFilters}
        >
          همه
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0"
          onPress={nearby}
        >
          نزدیک من
        </Button>
        {(regions.data?.items ?? []).slice(0, 4).map((filter) => (
          <Button
            key={filter.id}
            size="sm"
            variant={
              filters.cityRegionId === filter.id ? "primary" : "secondary"
            }
            className="shrink-0"
            onPress={() => setFilters({ cityRegionId: filter.id })}
          >
            {filter.name}
          </Button>
        ))}
        {(sports.data?.items ?? []).slice(0, 6).map((filter) => (
          <Button
            key={filter.id}
            size="sm"
            variant={filters.sportId === filter.id ? "primary" : "secondary"}
            className="shrink-0"
            onPress={() => setFilters({ sportId: filter.id })}
          >
            {filter.name}
          </Button>
        ))}
      </div>
      <div className="app-reveal flex items-center justify-between">
        <Typography type="body-sm" weight="bold">
          {(clubs.data?.total ?? 0).toLocaleString("fa-IR")} نتیجه
        </Typography>
        <Typography type="body-xs" color="muted">
          مرتب‌سازی: پیشنهادی
        </Typography>
      </div>
      <div className="flex flex-col gap-3">
        {visible.map((club) => (
          <DiscoveryResultCard
            key={club.id}
            title={club.name}
            subtitle={club.address || club.shortDescription}
            meta={`${club.averageRating.toLocaleString("fa-IR")} ★`}
            imageUrl={club.imageUrl ?? "/mock/clubs/01.jpg"}
            href={`/discovery/clubs/${club.id}`}
            badge="باشگاه"
          />
        ))}
      </div>
      {clubs.isLoading ? (
        <Spinner aria-label="در حال دریافت باشگاه‌ها" />
      ) : null}
      {clubs.isError ? (
        <div className="py-12 text-center text-sm text-danger">
          دریافت باشگاه‌ها ناموفق بود.
          <Button
            className="mt-4"
            size="sm"
            variant="secondary"
            onPress={() => clubs.refetch()}
          >
            تلاش دوباره
          </Button>
        </div>
      ) : null}
      {!clubs.isLoading && !clubs.isError && visible.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted">
          <p>نتیجه‌ای پیدا نشد.</p>
          <Button
            className="mt-4"
            size="sm"
            variant="secondary"
            onPress={() => {
              setQuery("");
              clearFilters();
            }}
          >
            حذف فیلترها
          </Button>
        </div>
      ) : null}
    </main>
  );
}
