"use client";

import { useState } from "react";
import { SaveButton } from "@/components/save-button";
import { Button, Typography } from "@heroui/react";
import { useSavedItems, type Favorite, type FavoriteEntityType } from "@api";
import {
  useCatalogArticle,
  useCatalogClass,
  useCatalogClub,
  useCatalogCoach,
} from "@api/discovery";

import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { ButtonLink } from "@/components/button-link";
import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";
import { RequestFailureState } from "@/components/request-failure-state";
import { DiscoveryResultCardSkeleton } from "@/components/loading-skeletons";
import { getQueryFailure } from "@/lib/request-failure";

const categories = {
  all: "همه",
  article: "مقالات",
  club: "باشگاه‌ها",
  coach: "مربی‌ها",
  class: "کلاس‌ها",
} as const;

export function AthleteFavoritesScreen({
  role = "athlete",
}: {
  role?: "athlete" | "coach";
}) {
  const [category, setCategory] = useState<"all" | FavoriteEntityType>("all");
  const favorites = useSavedItems();
  const allItems = favorites.data?.items ?? [];
  const items = allItems.filter(
    (item) => category === "all" || item.entityType === category,
  );
  const failure = getQueryFailure(favorites.error, favorites.fetchStatus);
  return (
    <main className="app-page gap-6">
      <SecondaryHeader
        title="ذخیره‌شده‌ها"
        showFilter={false}
        backHref={`/${role}/profile`}
      />
      <div className="flex flex-wrap gap-2" aria-label="نوع ذخیره‌شده‌ها">
        {(Object.keys(categories) as (keyof typeof categories)[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={category === key ? "primary" : "secondary"}
            aria-pressed={category === key}
            onPress={() => setCategory(key)}
          >
            {categories[key]}
            {favorites.data
              ? ` (${allItems.filter((item) => key === "all" || item.entityType === key).length.toLocaleString("fa-IR")})`
              : ""}
          </Button>
        ))}
      </div>
      {favorites.isLoading && !failure ? (
        <DiscoveryResultCardSkeleton count={4} />
      ) : null}
      {failure ? (
        <RequestFailureState
          error={failure}
          onRetry={() => void favorites.refetch()}
        />
      ) : null}
      {!favorites.isLoading && !failure && items.length === 0 ? (
        <div className="rounded-3xl bg-surface-secondary px-5 py-10 text-center">
          <Typography type="h5" weight="bold">
            {category === "all"
              ? "هنوز موردی را ذخیره نکرده‌ای"
              : `هنوز موردی در ${categories[category]} ذخیره نکرده‌ای`}
          </Typography>
          <p className="mt-2 text-sm leading-7 text-muted">
            مقالات، باشگاه‌ها، مربی‌ها و کلاس‌های موردعلاقه‌ات را در دیسکاوری
            پیدا کن.
          </p>
          <ButtonLink href="/discovery" variant="primary" className="mt-5">
            کشف باشگاه‌ها و کلاس‌ها
          </ButtonLink>
        </div>
      ) : null}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <FavoriteResult item={item} />
            </div>
            <SaveButton
              entityType={item.entityType}
              entityId={item.entityId}
            />
          </div>
        ))}
      </div>
    </main>
  );
}

function FavoriteResult({ item }: { item: Favorite }) {
  if (item.entityType === "article")
    return <FavoriteArticle id={item.entityId} />;
  if (item.entityType === "club") return <FavoriteClub id={item.entityId} />;
  if (item.entityType === "coach") return <FavoriteCoach id={item.entityId} />;
  return <FavoriteClass id={item.entityId} />;
}

function FavoriteClub({ id }: { id: string }) {
  const item = useCatalogClub(id);
  if (getQueryFailure(item.error, item.fetchStatus) && !item.data)
    return <UnavailableFavorite retry={() => void item.refetch()} />;
  if (item.isPending) return <DiscoveryResultCardSkeleton count={1} />;
  if (!item.data)
    return <UnavailableFavorite retry={() => void item.refetch()} />;
  return (
    <DiscoveryResultCard
      title={item.data.name}
      subtitle={item.data.address || item.data.shortDescription}
      imageUrl={item.data.imageUrl}
      href={`/discovery/clubs/${item.data.slug}`}
      badge="باشگاه"
    />
  );
}

function FavoriteCoach({ id }: { id: string }) {
  const item = useCatalogCoach(id);
  if (getQueryFailure(item.error, item.fetchStatus) && !item.data)
    return <UnavailableFavorite retry={() => void item.refetch()} />;
  if (item.isPending) return <DiscoveryResultCardSkeleton count={1} />;
  if (!item.data)
    return <UnavailableFavorite retry={() => void item.refetch()} />;
  return (
    <DiscoveryResultCard
      title={item.data.displayName}
      subtitle={item.data.shortBio}
      imageUrl={item.data.imageUrl}
      href={`/discovery/coaches/${item.data.slug}`}
      badge="مربی"
    />
  );
}

function FavoriteClass({ id }: { id: string }) {
  const item = useCatalogClass(id);
  if (getQueryFailure(item.error, item.fetchStatus) && !item.data)
    return <UnavailableFavorite retry={() => void item.refetch()} />;
  if (item.isPending) return <DiscoveryResultCardSkeleton count={1} />;
  if (!item.data)
    return <UnavailableFavorite retry={() => void item.refetch()} />;
  return (
    <DiscoveryResultCard
      title={item.data.title}
      subtitle={item.data.description}
      imageUrl={item.data.imageUrl}
      href={`/discovery/classes/${item.data.slug}`}
      badge="کلاس"
    />
  );
}

function FavoriteArticle({ id }: { id: string }) {
  const item = useCatalogArticle(id);
  if (getQueryFailure(item.error, item.fetchStatus) && !item.data)
    return <UnavailableFavorite retry={() => void item.refetch()} />;
  if (item.isPending) return <DiscoveryResultCardSkeleton count={1} />;
  if (!item.data)
    return <UnavailableFavorite retry={() => void item.refetch()} />;
  return (
    <DiscoveryResultCard
      title={item.data.title}
      subtitle={item.data.excerpt}
      imageUrl={item.data.coverImageUrl}
      href={`/discovery/articles/${item.data.slug}`}
      badge="مقاله"
    />
  );
}

function UnavailableFavorite({ retry }: { retry: () => void }) {
  return (
    <div className="app-card p-4">
      <p className="text-sm text-muted">
        این مورد در دسترس نیست یا دریافت آن انجام نشد.
      </p>
      <Button size="sm" variant="secondary" className="mt-3" onPress={retry}>
        تلاش دوباره
      </Button>
    </div>
  );
}
