"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, SearchField, Skeleton, Typography } from "@heroui/react";
import {
  useCatalogSearch,
  usePublicCatalogResource,
  type PublicCatalogSearchKind,
} from "@api/discovery";
import { Icon } from "@theme/icon";

import { ActiveLocationSelector } from "@modules/locations/components/ActiveLocationSelector";
import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";
import { RequestFailureState } from "@/components/request-failure-state";
import { DiscoveryResultCardSkeleton } from "@/components/loading-skeletons";
import { getQueryFailure } from "@/lib/request-failure";

const RECENT_SEARCHES_KEY = "gym4me.discovery.recent-searches";
const kinds = [
  { label: "همه", value: undefined },
  { label: "باشگاه‌ها", value: "club" },
  { label: "مربی‌ها", value: "coach" },
  { label: "کلاس‌ها", value: "class" },
] as const;

type RecentSearch = { query: string; kind?: PublicCatalogSearchKind };

export function DiscoverySearchScreen({
  initialKind,
}: {
  initialKind?: PublicCatalogSearchKind;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<PublicCatalogSearchKind | undefined>(
    initialKind,
  );
  const [showFilters, setShowFilters] = useState(false);
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [deferredQuery, setDeferredQuery] = useState("");
  const keywords = usePublicCatalogResource(
    "discovery",
    "search-keyword",
    { limit: 8 },
  );
  const canSearch = deferredQuery.length >= 2;
  const result = useCatalogSearch(
    { q: deferredQuery, kind, limit: 20 },
    canSearch,
  );
  const failure = getQueryFailure(result.error, result.fetchStatus);

  useEffect(() => {
    const normalizedQuery = query.trim();
    const timer = window.setTimeout(
      () => {
        setDeferredQuery(normalizedQuery);
      },
      normalizedQuery.length < 2 ? 0 : 250,
    );
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
    try {
      const saved: unknown = JSON.parse(
        window.localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]",
      );
      if (Array.isArray(saved)) {
        const frame = window.requestAnimationFrame(() => {
          setRecent(saved.slice(0, 6) as RecentSearch[]);
        });
        return () => window.cancelAnimationFrame(frame);
      }
    } catch {
      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  }, []);

  function remember(value = query.trim(), nextKind = kind) {
    if (value.length < 2) return;
    const next = [
      { query: value, kind: nextKind },
      ...recent.filter(
        (item) => item.query !== value || item.kind !== nextKind,
      ),
    ].slice(0, 6);
    setRecent(next);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  }

  const results = [
    ...(result.data?.clubs ?? []).map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: item.address || item.shortDescription,
      imageUrl: item.imageUrl,
      badge: "باشگاه",
      href: `/discovery/clubs/${item.slug}`,
    })),
    ...(result.data?.coaches ?? []).map((item) => ({
      id: item.id,
      title: item.displayName,
      subtitle: item.shortBio,
      imageUrl: item.imageUrl,
      badge: "مربی",
      href: `/discovery/coaches/${item.slug}`,
    })),
    ...(result.data?.classes ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.description,
      imageUrl: item.imageUrl,
      badge: "کلاس",
      href: `/discovery/classes/${item.slug}`,
    })),
  ];
  const topics = keywords.data?.items ?? [];

  return (
    <main className="app-page gap-6 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <header
        className="grid min-h-12 grid-cols-[2.75rem_1fr_2.75rem] items-center"
        dir="rtl"
      >
        <Button
          isIconOnly
          variant="ghost"
          aria-label="بازگشت"
          onPress={() => router.back()}
          className="size-11 min-w-11 rounded-xl text-foreground"
        >
          <Icon name="chevron-right" size={24} />
        </Button>
        <Typography
          type="h4"
          weight="bold"
          className="text-center tracking-tight text-foreground"
        >
          جست‌وجو
        </Typography>
        <span aria-hidden className="size-11" />
      </header>

      <div className="flex flex-col gap-3" dir="rtl">
        <SearchField
          fullWidth
          value={query}
          onChange={setQuery}
          onSubmit={() => remember()}
          aria-label="جست‌وجو در دیسکاوری"
          className="w-full"
        >
          <SearchField.Group className="flex h-16 w-full items-center gap-3 rounded-[1.35rem] border border-white/10 bg-surface/85 px-4 backdrop-blur-xl transition-[border-color,box-shadow] focus-within:border-focus focus-within:ring-3 focus-within:ring-focus/15">
            <SearchField.SearchIcon className="size-6 shrink-0 text-muted" />
            <SearchField.Input
              ref={inputRef}
              aria-label="جست‌وجو در دیسکاوری"
              placeholder={placeholderFor(kind)}
              className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted"
            />
            {query ? (
              <SearchField.ClearButton aria-label="پاک کردن جست‌وجو" />
            ) : null}
            <span className="h-7 w-px bg-separator" aria-hidden />
            <Button
              isIconOnly
              variant={showFilters || kind ? "primary" : "ghost"}
              aria-label="فیلتر نوع نتیجه"
              aria-expanded={showFilters}
              onPress={() => setShowFilters((value) => !value)}
              className="size-10 min-w-10 rounded-xl"
            >
              <Icon name="funnel-1" size={21} />
            </Button>
          </SearchField.Group>
        </SearchField>

        {showFilters ? (
          <div className="app-chip-row app-reveal">
            {kinds.map((item) => (
              <Button
                key={item.label}
                size="sm"
                variant="ghost"
                className={`h-10 shrink-0 rounded-full border px-4 font-bold ${
                  kind === item.value
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-surface-secondary/70 text-foreground"
                }`}
                onPress={() => setKind(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {!canSearch ? (
        <section className="flex flex-col gap-4" aria-labelledby="topics-title">
          <Typography id="topics-title" type="h5" weight="bold">
            موضوعات
          </Typography>
          {keywords.isLoading ? (
            <div
              className="flex flex-wrap gap-2.5"
              aria-label="در حال دریافت موضوعات"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-32 rounded-full" />
              ))}
            </div>
          ) : topics.length ? (
            <div className="flex flex-wrap gap-2.5">
              {topics.map((topic) => (
                <Button
                  key={topic.id}
                  variant="ghost"
                  className="h-12 rounded-full border border-white/10 bg-surface/80 px-4 font-bold text-foreground backdrop-blur-md hover:border-accent/35 hover:bg-accent/8"
                  onPress={() => {
                    setQuery(topic.name);
                    remember(topic.name);
                  }}
                >
                  <span aria-hidden className="text-xl font-medium text-accent">
                    #
                  </span>
                  {topic.name}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">موضوعی برای نمایش وجود ندارد.</p>
          )}
        </section>
      ) : null}

      {showFilters ? <ActiveLocationSelector variant="search" /> : null}

      {!canSearch ? (
        <section className="pt-2">
          <div className="mb-3 flex items-center justify-between">
            <Typography type="h5" weight="bold">
              جست‌وجوهای اخیر
            </Typography>
            {recent.length ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-3 font-semibold text-accent"
                onPress={() => {
                  setRecent([]);
                  window.localStorage.removeItem(RECENT_SEARCHES_KEY);
                }}
              >
                پاک کردن
              </Button>
            ) : null}
          </div>
          {recent.length ? (
            <div>
              {recent.map((item) => (
                <button
                  type="button"
                  key={`${item.kind ?? "all"}-${item.query}`}
                  onClick={() => {
                    setKind(item.kind);
                    setQuery(item.query);
                  }}
                  className="flex min-h-16 w-full items-center gap-4 border-b border-separator text-start last:border-b-0"
                >
                  <Icon
                    name="clock"
                    size={24}
                    className="shrink-0 text-muted"
                  />
                  <span className="min-w-0 flex-1 truncate text-base text-foreground">
                    {item.query}
                  </span>
                  <Icon
                    name="arrow-up-left-circle"
                    size={24}
                    className="shrink-0 text-muted"
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted">
              هنوز جست‌وجویی انجام نداده‌اید.
            </p>
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-3 pt-1">
          {result.isLoading && !failure ? (
            <Skeleton
              className="h-4 w-24 rounded-lg"
              aria-label="در حال جست‌وجو"
            />
          ) : (
            <p className="text-sm text-muted">
              {failure
                ? "جست‌وجو انجام نشد"
                : `${(result.data?.total ?? 0).toLocaleString("fa-IR")} نتیجه`}
            </p>
          )}
          {!failure
            ? results.map((item) => (
                <div
                  key={`${item.badge}-${item.id}`}
                  onClick={() => remember()}
                >
                  <DiscoveryResultCard {...item} />
                </div>
              ))
            : null}
          {result.isLoading && !failure ? (
            <DiscoveryResultCardSkeleton count={4} />
          ) : null}
          {failure ? (
            <RequestFailureState
              error={failure}
              onRetry={() => void result.refetch()}
            />
          ) : null}
          {!result.isLoading && !failure && results.length === 0 ? (
            <div className="py-14 text-center">
              <Icon
                name="file-magnifying-glass"
                size={36}
                className="text-muted"
              />
              <p className="mt-3 text-sm text-muted">نتیجه‌ای پیدا نشد.</p>
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
}

function placeholderFor(kind?: PublicCatalogSearchKind) {
  if (kind === "club") return "جست‌وجوی باشگاه...";
  if (kind === "coach") return "جست‌وجوی مربی...";
  if (kind === "class") return "جست‌وجوی کلاس...";
  return "جست‌وجوی باشگاه، مربی یا کلاس...";
}
