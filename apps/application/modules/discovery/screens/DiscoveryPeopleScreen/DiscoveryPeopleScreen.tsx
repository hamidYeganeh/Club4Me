"use client";
import { DiscoveryImageHero } from "../../components/DiscoveryImageHero";

import { useDiscoveryList } from "../../hooks/use-discovery-list";
import { DiscoveryPagination } from "../../components/DiscoveryPagination";
import { DiscoveryQueryState } from "../../components/DiscoveryQueryState";
import { DiscoveryEmptySection } from "../../components/DiscoveryEmptySection";

import { Skeleton } from "@heroui/react";
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
  const t = useTranslations("discovery.coaches");
  const { query, setQuery, q, page, setPage } = useDiscoveryList();
  const sections = useCoachSections();
  const result = useCoaches({ q, page, limit: 20 });
  const coaches = result.data?.items ?? [];

  return (
    <main className="app-page gap-6">
      <SecondaryHeader title={t("title")} showFilter={false} />
      <DiscoveryImageHero
        imageUrl="/profile/avatar.jpg"
        title="همراه مسیر ورزشی تو"
        description="تجربه، تخصص و شیوه تمرین مربی‌ها را ببین و مربی مناسب خودت را انتخاب کن."
        eyebrow="مربی‌های جیم‌فورمی"
      />
      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder={t("searchPlaceholder")}
      />

      {!q &&
        sections.data?.map((section) => (
          <DiscoveryDynamicSection key={section.id} section={section} />
        ))}
      {sections.isLoading ? <SectionSkeleton cards={2} /> : null}
      <DiscoveryQueryState query={sections} />

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
          title="همه مربی‌ها"
          subtitle={t("resultsCount", {
            count: (result.data?.total ?? coaches.length).toLocaleString(
              "fa-IR",
            ),
          })}
          icon="user"
        />
      )}
      <div className="flex flex-col gap-3">
        {coaches.map((coach) => (
          <DiscoveryResultCard
            key={coach.id}
            title={coach.displayName}
            subtitle={coach.shortBio}
            meta={`${coach.averageRating.toLocaleString("fa-IR")} ★ · ${coach.experienceYears.toLocaleString("fa-IR")} ${t("yearsExperience")}`}
            imageUrl={coach.imageUrl}
            href={`/discovery/coaches/${coach.slug}`}
            badge={t("badge")}
          />
        ))}
      </div>
      {result.isLoading ? <DiscoveryResultCardSkeleton count={4} /> : null}
      <DiscoveryQueryState query={result} />
      <DiscoveryPagination
        page={page}
        total={result.data?.total ?? 0}
        limit={20}
        onChange={setPage}
        pending={result.isFetching}
      />
      {result.isSuccess && coaches.length === 0 ? (
        <DiscoveryEmptySection
          title="مربی‌ای پیدا نشد"
          subtitle="نام یا تخصص دیگری را جست‌وجو کن."
          icon="medal"
        />
      ) : null}
    </main>
  );
}
