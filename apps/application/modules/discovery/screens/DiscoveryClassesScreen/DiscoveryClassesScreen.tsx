"use client";

import { useState } from "react";
import { Button, Skeleton, Typography } from "@heroui/react";
import { useCatalogClasses } from "@api/discovery";
import { usePublicClubClasses } from "@api";
import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";
import { DiscoverySearchField } from "@modules/discovery/components/DiscoverySearchField";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { DiscoveryResultCardSkeleton } from "@/components/loading-skeletons";

export function DiscoveryClassesScreen() {
  const [query, setQuery] = useState("");
  const result = useCatalogClasses();
  const clubResult = usePublicClubClasses(query ? { q: query } : undefined);
  const classes = result.data?.items ?? [];
  return (
    <main className="app-page gap-6">
      <SecondaryHeader title="کلاس‌ها" />
      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder="نام کلاس، ورزش یا مربی"
        href="/discovery/search?kind=class"
      />
      {result.isLoading || clubResult.isLoading ? (
        <Skeleton
          className="h-4 w-28 rounded-lg"
          aria-label="در حال بارگذاری تعداد کلاس‌ها"
        />
      ) : (
        <Typography type="body-sm" color="muted" className="app-reveal">
          {(
            (result.data?.total ?? 0) + (clubResult.data?.total ?? 0)
          ).toLocaleString("fa-IR")}{" "}
          کلاس فعال
        </Typography>
      )}
      <div className="flex flex-col gap-3">
        {(clubResult.data?.items ?? []).map((item) => (
          <DiscoveryResultCard
            key={`club-${item.id}`}
            title={item.title}
            subtitle={
              item.description ||
              `${item.club.name} · ${item.coach?.name ?? "مربی در حال تعیین"}`
            }
            meta={`${item.remainingCapacity.toLocaleString("fa-IR")} جای خالی`}
            imageUrl={null}
            href={`/discovery/business-class?classId=${item.id}`}
            badge="کلاس باشگاه"
          />
        ))}
        {classes.map((item) => (
          <DiscoveryResultCard
            key={item.id}
            title={item.title}
            subtitle={
              item.description ||
              (item.deliveryMode === "online" ? "آنلاین" : "حضوری")
            }
            meta={`${item.enrollmentCount.toLocaleString("fa-IR")} از ${item.capacity.toLocaleString("fa-IR")} نفر`}
            imageUrl={item.imageUrl}
            href={`/discovery/classes/${item.slug}`}
            badge="کلاس"
          />
        ))}
      </div>
      {result.isLoading || clubResult.isLoading ? (
        <DiscoveryResultCardSkeleton count={4} />
      ) : null}
      {result.isError && clubResult.isError ? (
        <Button onPress={() => result.refetch()}>تلاش دوباره</Button>
      ) : null}
      {!result.isLoading &&
      !clubResult.isLoading &&
      !result.isError &&
      !clubResult.isError &&
      classes.length === 0 &&
      !clubResult.data?.items.length ? (
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
