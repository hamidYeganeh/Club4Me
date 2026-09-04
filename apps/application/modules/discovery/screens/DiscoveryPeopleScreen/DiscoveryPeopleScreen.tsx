"use client";

import { useDeferredValue, useState } from "react";
import { Button, Spinner, Typography } from "@heroui/react";
import { useCatalogCoaches } from "@api/discovery";

import { DiscoveryPageHeader } from "@modules/discovery/components/DiscoveryPageHeader";
import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";
import { DiscoverySearchField } from "@modules/discovery/components/DiscoverySearchField";

export function DiscoveryPeopleScreen() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const result = useCatalogCoaches({ q: deferredQuery || undefined });
  const coaches = result.data?.items ?? [];

  return (
    <main className="app-page gap-6">
      <DiscoveryPageHeader
        title="مربی‌ها"
        description="مربی مناسب را بر اساس تخصص و محل فعالیت پیدا کن."
      />
      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder="نام یا تخصص مربی"
      />
      <Typography type="body-sm" color="muted" className="app-reveal">
        {(result.data?.total ?? 0).toLocaleString("fa-IR")} مربی
      </Typography>
      <div className="flex flex-col gap-3">
        {coaches.map((coach) => (
          <DiscoveryResultCard
            key={coach.id}
            title={coach.displayName}
            subtitle={coach.shortBio}
            meta={`${coach.averageRating.toLocaleString("fa-IR")} ★ · ${coach.experienceYears.toLocaleString("fa-IR")} سال تجربه`}
            imageUrl={coach.imageUrl ?? "/profile/avatar.jpg"}
            href={`/discovery/coaches/${coach.slug}`}
            badge="مربی"
          />
        ))}
      </div>
      {result.isLoading ? <Spinner aria-label="در حال دریافت مربی‌ها" /> : null}
      {result.isError ? (
        <Button onPress={() => result.refetch()}>تلاش دوباره</Button>
      ) : null}
      {!result.isLoading && !result.isError && coaches.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted">
          <p>مربی‌ای پیدا نشد.</p>
          {query ? (
            <Button
              className="mt-4"
              size="sm"
              variant="secondary"
              onPress={() => setQuery("")}
            >
              پاک‌کردن جست‌وجو
            </Button>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
