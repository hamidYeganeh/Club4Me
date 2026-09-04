"use client";

import { useDeferredValue, useState } from "react";
import { Button, Spinner, Typography } from "@heroui/react";
import { useCatalogSearch } from "@api/discovery";

import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";
import { DiscoverySearchField } from "@modules/discovery/components/DiscoverySearchField";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";

const KINDS = [
  { label: "همه", value: undefined },
  { label: "باشگاه", value: "club" },
  { label: "مربی", value: "coach" },
  { label: "کلاس", value: "class" },
] as const;

export function DiscoverySearchScreen() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<string | undefined>();
  const deferredQuery = useDeferredValue(query.trim());
  const result = useCatalogSearch({ q: deferredQuery || undefined, kind });
  const results = [
    ...(result.data?.clubs ?? []).map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: item.address || item.shortDescription,
      imageUrl: item.imageUrl,
      kind: "باشگاه",
      href: `/discovery/clubs/${item.id}`,
    })),
    ...(result.data?.coaches ?? []).map((item) => ({
      id: item.id,
      title: item.displayName,
      subtitle: item.shortBio,
      imageUrl: item.imageUrl,
      kind: "مربی",
      href: `/discovery/coaches/${item.slug}`,
    })),
    ...(result.data?.classes ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.description,
      imageUrl: item.imageUrl,
      kind: "کلاس",
      href: `/discovery/classes/${item.slug}`,
    })),
  ];

  return (
    <main className="app-page gap-6">
      <SecondaryHeader title="جست‌وجو" showFilter={false} />
      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder="چه چیزی می‌خواهی پیدا کنی؟"
      />
      <div className="app-chip-row app-reveal">
        {KINDS.map((item) => (
          <Button
            key={item.label}
            size="sm"
            variant={kind === item.value ? "primary" : "secondary"}
            onPress={() => setKind(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <Typography type="body-sm" color="muted" className="app-reveal">
        {(result.data?.total ?? 0).toLocaleString("fa-IR")} نتیجه
      </Typography>
      <div className="flex flex-col gap-3">
        {results.map((item) => (
          <DiscoveryResultCard
            key={`${item.kind}-${item.id}`}
            {...item}
            badge={item.kind}
          />
        ))}
      </div>
      {result.isLoading ? <Spinner aria-label="در حال جست‌وجو" /> : null}
      {result.isError ? (
        <Button onPress={() => result.refetch()}>تلاش دوباره</Button>
      ) : null}
      {!result.isLoading && !result.isError && results.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted">
          <p>نتیجه‌ای پیدا نشد.</p>
          <Button
            className="mt-4"
            size="sm"
            variant="secondary"
            onPress={() => {
              setQuery("");
              setKind(undefined);
            }}
          >
            حذف فیلترها
          </Button>
        </div>
      ) : null}
    </main>
  );
}
