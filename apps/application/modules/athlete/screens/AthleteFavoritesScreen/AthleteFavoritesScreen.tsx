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
import Link from "@/components/app-link";
import { FallbackImage } from "@/components/FallbackImage";
import { Icon } from "@theme/icon";
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
  const failure = favorites.data
    ? null
    : getQueryFailure(favorites.error, favorites.fetchStatus);
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
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-[2rem] bg-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="rounded-xl bg-surface-secondary px-3 py-2 text-xs font-semibold">
                {categories[item.entityType]}
              </span>
              <SaveButton
                entityType={item.entityType}
                entityId={item.entityId}
              />
            </div>
            <FavoriteResult item={item} />
          </article>
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
    <SavedItemCard
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
    <SavedItemCard
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
    <SavedItemCard
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
    <SavedItemCard
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

function SavedItemCard({
  title,
  subtitle,
  imageUrl,
  href,
  badge,
}: {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  href: string;
  badge: string;
}) {
  return (
    <Link
      href={href}
      aria-label={title}
      className="flex items-start gap-4 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-3xl bg-surface-secondary">
        <FallbackImage
          src={imageUrl}
          alt=""
          fill
          unoptimized
          sizes="80px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-base leading-7 font-bold">{title}</h2>
        <p className="mt-1 line-clamp-2 text-xs leading-6 text-muted">
          {subtitle}
        </p>
        <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold">
          مشاهده {badge}
          <Icon name="arrow-left" size={16} />
        </span>
      </div>
    </Link>
  );
}
