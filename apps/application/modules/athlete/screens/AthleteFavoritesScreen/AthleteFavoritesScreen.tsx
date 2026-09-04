"use client";

import { Button, Spinner, Typography } from "@heroui/react";
import { useFavorites, type Favorite } from "@api";
import {
  useCatalogClass,
  useCatalogClub,
  useCatalogCoach,
} from "@api/discovery";

import { DiscoveryPageHeader } from "@modules/discovery/components/DiscoveryPageHeader";
import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";

export function AthleteFavoritesScreen() {
  const favorites = useFavorites();
  const items = favorites.data?.items ?? [];
  return (
    <main className="flex min-h-dvh flex-col gap-6 px-5 pb-[calc(6.25rem+env(safe-area-inset-bottom))]">
      <DiscoveryPageHeader
        title="علاقه‌مندی‌ها"
        description="باشگاه‌ها، مربی‌ها و کلاس‌هایی که ذخیره کرده‌ای."
      />
      {favorites.isLoading ? (
        <Spinner aria-label="در حال دریافت علاقه‌مندی‌ها" />
      ) : null}
      {favorites.isError ? (
        <Button variant="secondary" onPress={() => favorites.refetch()}>
          تلاش دوباره
        </Button>
      ) : null}
      {!favorites.isLoading && !favorites.isError && items.length === 0 ? (
        <Typography type="body-sm" color="muted" className="py-16 text-center">
          هنوز موردی را ذخیره نکرده‌ای.
        </Typography>
      ) : null}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <FavoriteResult key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}

function FavoriteResult({ item }: { item: Favorite }) {
  if (item.entityType === "club") return <FavoriteClub id={item.entityId} />;
  if (item.entityType === "coach") return <FavoriteCoach id={item.entityId} />;
  return <FavoriteClass id={item.entityId} />;
}

function FavoriteClub({ id }: { id: string }) {
  const item = useCatalogClub(id);
  if (!item.data) return null;
  return (
    <DiscoveryResultCard
      title={item.data.name}
      subtitle={item.data.address || item.data.shortDescription}
      imageUrl={item.data.imageUrl}
      href={`/discovery/clubs/${item.data.id}`}
      badge="باشگاه"
    />
  );
}

function FavoriteCoach({ id }: { id: string }) {
  const item = useCatalogCoach(id);
  if (!item.data) return null;
  return (
    <DiscoveryResultCard
      title={item.data.displayName}
      subtitle={item.data.shortBio}
      imageUrl={item.data.imageUrl}
      href={`/discovery/coaches/${item.data.id}`}
      badge="مربی"
    />
  );
}

function FavoriteClass({ id }: { id: string }) {
  const item = useCatalogClass(id);
  if (!item.data) return null;
  return (
    <DiscoveryResultCard
      title={item.data.title}
      subtitle={item.data.description}
      imageUrl={item.data.imageUrl}
      href={`/discovery/classes/${item.data.id}`}
      badge="کلاس"
    />
  );
}
