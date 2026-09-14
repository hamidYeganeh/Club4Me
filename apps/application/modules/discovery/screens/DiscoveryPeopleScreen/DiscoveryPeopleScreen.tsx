"use client";
import { useState } from "react";
import type { PublicCatalogParams } from "@api/discovery";
import { DiscoveryCatalogFilters } from "@modules/discovery/components/DiscoveryCatalogFilters";
import { DiscoveryVirtualItems } from "@modules/discovery/components/DiscoveryViewport";
import { useAccumulatedQuery } from "@modules/discovery/hooks/use-accumulated-query";
import { useSearchParams } from "next/navigation";
import { DiscoveryImageHero } from "../../components/DiscoveryImageHero";

import { useDiscoveryList } from "../../hooks/use-discovery-list";
import { DiscoveryPagination } from "../../components/DiscoveryPagination";
import { DiscoveryQueryState } from "../../components/DiscoveryQueryState";
import { DiscoveryEmptySection } from "../../components/DiscoveryEmptySection";

import { Button, Skeleton } from "@heroui/react";
import { useCoachSections, useCoaches } from "@api/discovery";
import { useTranslations } from "next-intl";

import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";
import { DiscoverySearchField } from "@modules/discovery/components/DiscoverySearchField";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { DiscoveryDynamicSection } from "@modules/discovery/sections/DiscoveryDynamicSection";
import {
  DiscoveryResultCardSkeleton,
  SectionSkeleton,
} from "@/components/loading-skeletons";

export function DiscoveryPeopleScreen() {
  const sportId = useSearchParams().get("sportId") || undefined;
  const t = useTranslations("discovery.coaches");
  const { query, setQuery, q, page, setPage } = useDiscoveryList();
  const [filters, setFilters] = useState<PublicCatalogParams>({});
  const sections = useCoachSections();
  const resultPage = useCoaches({
    ...filters,
    q,
    page,
    limit: 20,
    sportId: sportId ?? filters.sportId,
  });
  const result = useAccumulatedQuery(
    resultPage,
    page,
    JSON.stringify([q, sportId, filters]),
  );
  const coaches = result.data?.items ?? [];
  const hasFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== "",
  );
  const showRecommendations = !q && !sportId && !hasFilters;

  return (
    <main className="app-page gap-6">
      <SecondaryHeader title={t("title")} showFilter={false} />
      <DiscoveryImageHero
        compact
        imageUrl="/profile/avatar.jpg"
        title="همراه مسیر ورزشی تو"
        description="تجربه، تخصص و شیوه تمرین مربی‌ها را ببین و مربی مناسب خودت را انتخاب کن."
        eyebrow="مربی‌های کلاب‌فورمی"
      />
      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder={t("searchPlaceholder")}
      />
      <DiscoveryCatalogFilters
        kind="coach"
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

      {showRecommendations &&
        sections.data?.map((section) => (
          <DiscoveryDynamicSection key={section.id} section={section} />
        ))}
      {showRecommendations && sections.isLoading ? (
        <SectionSkeleton cards={2} />
      ) : null}
      {showRecommendations ? <DiscoveryQueryState query={sections} /> : null}

      {result.isLoading ? (
        <div
          className="flex items-center gap-3"
          aria-busy="true"
          aria-label="در حال بارگذاری مربی‌ها"
        >
          <Skeleton className="size-10 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-28 rounded-lg" />
            <Skeleton className="h-3 w-20 rounded-lg" />
          </div>
        </div>
      ) : (
        <DiscoverySectionHeader
          title={
            q || hasFilters || sportId ? "نتیجه جست‌وجوی مربی" : "همه مربی‌ها"
          }
          subtitle={t("resultsCount", {
            count: (result.data?.total ?? coaches.length).toLocaleString(
              "fa-IR",
            ),
          })}
          icon="user"
        />
      )}
      <div className="flex flex-col gap-3">
        <DiscoveryVirtualItems>
          {coaches.map((coach) => (
            <DiscoveryResultCard
              key={coach.id}
              title={coach.displayName}
              subtitle={coach.shortBio}
              meta={`${coach.reviewsCount > 0 ? `${coach.averageRating.toLocaleString("fa-IR", { maximumFractionDigits: 1 })} ★ · ${coach.reviewsCount.toLocaleString("fa-IR")} نظر` : "بدون نظر"} · ${coach.experienceYears.toLocaleString("fa-IR")} ${t("yearsExperience")}`}
              imageUrl={coach.imageUrl}
              href={`/discovery/coaches/${coach.slug}`}
              badge={t("badge")}
            />
          ))}
        </DiscoveryVirtualItems>
      </div>
      {result.isLoading ? <DiscoveryResultCardSkeleton count={4} /> : null}
      <DiscoveryQueryState query={result} />
      <DiscoveryPagination
        page={page}
        total={result.data?.total ?? 0}
        limit={20}
        onChange={setPage}
        pending={result.isFetching}
        failed={result.isError}
        onRetry={() => void result.refetch()}
      />
      {result.isSuccess && coaches.length === 0 ? (
        <div className="space-y-4 text-center">
          <DiscoveryEmptySection
            title="مربی‌ای پیدا نشد"
            subtitle="نام یا تخصص دیگری را جست‌وجو کن."
            icon="medal"
          />
          {query || hasFilters ? (
            <Button
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
