"use client";
import { useState } from "react";
import type { PublicCatalogParams } from "@api/discovery";
import { DiscoveryCatalogFilters } from "@modules/discovery/components/DiscoveryCatalogFilters";
import { DiscoveryVirtualItems } from "@modules/discovery/components/DiscoveryViewport";
import { useAccumulatedQuery } from "@modules/discovery/hooks/use-accumulated-query";
import { DiscoveryImageHero } from "../../components/DiscoveryImageHero";
import { useSearchParams } from "next/navigation";
import { ButtonLink } from "@/components/button-link";

import { useDiscoveryList } from "../../hooks/use-discovery-list";
import { ClassBrowseCard } from "../../components/ClassBrowseCard";
import { DiscoveryPagination } from "../../components/DiscoveryPagination";
import { DiscoveryQueryState } from "../../components/DiscoveryQueryState";
import { DiscoveryEmptySection } from "../../components/DiscoveryEmptySection";

import { Button, Skeleton, Typography } from "@heroui/react";
import { useCatalogSearch } from "@api/discovery";
import { DiscoverySearchField } from "@modules/discovery/components/DiscoverySearchField";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { DiscoveryResultCardSkeleton } from "@/components/loading-skeletons";

export function DiscoveryClassesScreen() {
  const params = useSearchParams();
  const clubId = params.get("clubId") || undefined;
  const sportId = params.get("sportId") || undefined;
  return (
    <ClassesResults
      key={`${clubId}-${sportId}`}
      clubId={clubId}
      sportId={sportId}
    />
  );
}

function ClassesResults({
  clubId,
  sportId,
}: {
  clubId?: string;
  sportId?: string;
}) {
  const { query, setQuery, q, page, setPage } = useDiscoveryList();
  const [filters, setFilters] = useState<PublicCatalogParams>({});
  const resultPage = useCatalogSearch({
    ...filters,
    kind: "class",
    q,
    page,
    limit: 20,
    clubId,
    sportId: sportId ?? filters.sportId,
  });
  const result = useAccumulatedQuery(
    resultPage,
    page,
    JSON.stringify([q, clubId, sportId, filters]),
  );
  const classes = result.data?.classes ?? [];
  return (
    <main className="app-page gap-6">
      <SecondaryHeader title="کلاس‌ها" showFilter={false} />
      <DiscoveryImageHero
        compact
        imageUrl="/profile/cover.jpg"
        title="وقت یک تمرین تازه است."
        description="کلاس دلخواهت را پیدا کن؛ ظرفیت، شهریه و زمان شروع را کنار هم ببین."
        eyebrow="کلاس‌ها و دوره‌های ورزشی"
      />
      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder="نام کلاس، ورزش یا مربی"
      />
      <DiscoveryCatalogFilters
        kind="class"
        value={filters}
        resultCount={
          result.isSuccess && !result.isFetching
            ? result.data?.total
            : undefined
        }
        onChange={(value) => {
          setFilters(value);
          setPage(1);
        }}
      />
      {clubId ? (
        <ButtonLink href="/discovery/classes" variant="secondary" size="sm">
          نمایش کلاس‌های همه باشگاه‌ها
        </ButtonLink>
      ) : null}
      {result.isLoading ? (
        <Skeleton
          className="h-4 w-28 rounded-lg"
          aria-label="در حال بارگذاری تعداد کلاس‌ها"
        />
      ) : (
        <Typography type="body-sm" color="muted" className="app-reveal">
          {(result.data?.total ?? 0).toLocaleString("fa-IR")} کلاس
        </Typography>
      )}
      <DiscoveryQueryState query={result} />
      <div className="flex flex-col gap-5">
        <DiscoveryVirtualItems>
          {(result.data?.businessClasses ?? []).map((item) => (
            <ClassBrowseCard
              key={`club-${item.id}`}
              title={item.title}
              description={item.description || "کلاس باشگاه"}
              remaining={Math.max(0, item.capacity - item.enrollmentCount)}
              price={item.price.amount}
              currency={item.price.currency}
              startAt={item.startDate}
              href={`/discovery/business-class?classId=${item.id}`}
              badge="کلاس باشگاه"
            />
          ))}
        </DiscoveryVirtualItems>
        <DiscoveryVirtualItems>
          {classes.map((item) => (
            <ClassBrowseCard
              key={item.id}
              title={item.title}
              description={
                item.description ||
                (item.deliveryMode === "online" ? "آنلاین" : "حضوری")
              }
              remaining={item.capacity - item.enrollmentCount}
              price={item.price.amount}
              currency={item.price.currency}
              startAt={item.courseStartAt}
              imageUrl={item.imageUrl}
              href={`/discovery/classes/${item.slug}`}
              badge={item.deliveryMode === "online" ? "آنلاین" : "حضوری"}
            />
          ))}
        </DiscoveryVirtualItems>
      </div>
      {result.isLoading ? <DiscoveryResultCardSkeleton count={4} /> : null}
      <DiscoveryPagination
        page={page}
        total={result.data?.totalPages ?? 0}
        limit={1}
        onChange={setPage}
        pending={result.isFetching}
        failed={result.isError}
        onRetry={() => void result.refetch()}
      />
      {!result.isLoading &&
      !result.isError &&
      classes.length === 0 &&
      !result.data?.businessClasses?.length ? (
        <div className="py-16 text-center text-sm text-muted">
          <DiscoveryEmptySection
            title="کلاسی پیدا نشد"
            subtitle="عبارت دیگری را جست‌وجو کن یا جست‌وجو را پاک کن."
            icon="academic-cap"
          />
          {query ||
          Object.values(filters).some(
            (value) => value !== undefined && value !== "",
          ) ? (
            <Button
              className="mt-4"
              size="sm"
              variant="secondary"
              onPress={() => {
                setQuery("");
                setFilters({});
                setPage(1);
              }}
            >
              پاک‌کردن جست‌وجو و فیلترها
            </Button>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
