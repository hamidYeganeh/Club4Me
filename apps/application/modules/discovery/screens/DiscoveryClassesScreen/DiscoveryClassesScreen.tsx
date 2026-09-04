"use client";

import { useDeferredValue, useState } from "react";
import { Button, Spinner, Typography } from "@heroui/react";
import { useCatalogClasses } from "@api/discovery";
import { DiscoveryPageHeader } from "@modules/discovery/components/DiscoveryPageHeader";
import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";
import { DiscoverySearchField } from "@modules/discovery/components/DiscoverySearchField";

export function DiscoveryClassesScreen() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const result = useCatalogClasses({ q: deferredQuery || undefined });
  const classes = result.data?.items ?? [];
  return (
    <main className="app-page gap-6">
      <DiscoveryPageHeader
        title="کلاس‌ها"
        description="کلاس‌های فعال و نزدیک در حال ثبت‌نام را ببین."
      />
      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder="نام کلاس، ورزش یا مربی"
      />
      <Typography type="body-sm" color="muted" className="app-reveal">
        {(result.data?.total ?? 0).toLocaleString("fa-IR")} کلاس فعال
      </Typography>
      <div className="flex flex-col gap-3">
        {classes.map((item) => (
          <DiscoveryResultCard
            key={item.id}
            title={item.title}
            subtitle={
              item.description ||
              (item.deliveryMode === "online" ? "آنلاین" : "حضوری")
            }
            meta={`${item.enrollmentCount.toLocaleString("fa-IR")} از ${item.capacity.toLocaleString("fa-IR")} نفر`}
            imageUrl={item.imageUrl ?? "/mock/clubs/02.jpg"}
            href={`/discovery/classes/${item.slug}`}
            badge="کلاس"
          />
        ))}
      </div>
      {result.isLoading ? <Spinner aria-label="در حال دریافت کلاس‌ها" /> : null}
      {result.isError ? (
        <Button onPress={() => result.refetch()}>تلاش دوباره</Button>
      ) : null}
      {!result.isLoading && !result.isError && classes.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted">
          <p>کلاس فعالی پیدا نشد.</p>
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
