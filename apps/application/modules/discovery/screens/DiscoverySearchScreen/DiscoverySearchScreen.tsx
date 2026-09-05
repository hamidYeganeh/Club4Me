"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { useCatalogSearch, type PublicCatalogSearchKind } from "@api/discovery";
import { Icon } from "@theme/icon";

import { ActiveLocationSelector } from "@modules/locations/components/ActiveLocationSelector";
import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";
import { RequestFailureState } from "@/components/request-failure-state";
import { DiscoveryResultCardSkeleton } from "@/components/loading-skeletons";

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
  const canSearch = deferredQuery.length >= 2;
  const result = useCatalogSearch(
    { q: deferredQuery, kind, limit: 20 },
    canSearch,
  );

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

  return (
    <main className="app-page gap-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div className="flex items-center gap-2" dir="rtl">
        <button
          type="button"
          aria-label="بازگشت"
          onClick={() => router.back()}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-surface-secondary"
        >
          <Icon name="chevron-right" size={24} />
        </button>
        <form
          className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-[1.15rem] border border-border bg-surface px-4 shadow-sm transition focus-within:border-focus focus-within:ring-3 focus-within:ring-focus/15"
          onSubmit={(event) => {
            event.preventDefault();
            remember();
          }}
        >
          <Icon name="magnifying-glass" size={23} className="text-muted" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholderFor(kind)}
            aria-label="جست‌وجو در دیسکاوری"
            className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted"
          />
        </form>
        <button
          type="button"
          aria-label="فیلتر نوع نتیجه"
          aria-expanded={showFilters}
          onClick={() => setShowFilters((value) => !value)}
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors ${showFilters || kind ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-surface-secondary"}`}
        >
          <Icon name="funnel-1" size={23} />
        </button>
      </div>

      {showFilters ? (
        <div className="app-chip-row app-reveal">
          {kinds.map((item) => (
            <Button
              key={item.label}
              size="sm"
              variant={kind === item.value ? "primary" : "secondary"}
              className="shrink-0"
              onPress={() => setKind(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      ) : null}

      <ActiveLocationSelector variant="search" />

      {!canSearch ? (
        <section className="pt-2">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">
              جست‌وجوهای اخیر
            </h1>
            {recent.length ? (
              <button
                type="button"
                className="text-sm font-semibold text-accent"
                onClick={() => {
                  setRecent([]);
                  window.localStorage.removeItem(RECENT_SEARCHES_KEY);
                }}
              >
                پاک کردن
              </button>
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
          <p className="text-sm text-muted">
            {result.isLoading
              ? "در حال جست‌وجو..."
              : result.isError
                ? "جست‌وجو انجام نشد"
                : `${(result.data?.total ?? 0).toLocaleString("fa-IR")} نتیجه`}
          </p>
          {!result.isError
            ? results.map((item) => (
                <div
                  key={`${item.badge}-${item.id}`}
                  onClick={() => remember()}
                >
                  <DiscoveryResultCard {...item} />
                </div>
              ))
            : null}
          {result.isLoading ? (
            <DiscoveryResultCardSkeleton count={4} />
          ) : null}
          {result.isError ? (
            <RequestFailureState
              error={result.error}
              onRetry={() => void result.refetch()}
            />
          ) : null}
          {!result.isLoading && !result.isError && results.length === 0 ? (
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
