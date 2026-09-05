"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
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
  const [query, setQuery] = useState("");
  const sections = useCoachSections();
  const result = useCoaches();
  const coaches = result.data?.items ?? [];

  return (
    <main className="app-page gap-6">
      <SecondaryHeader title={t("title")} />
      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder={t("searchPlaceholder")}
        href="/discovery/search?kind=coach"
      />

      {sections.data?.map((section) => (
        <DiscoveryDynamicSection key={section.id} section={section} />
      ))}
      {sections.isLoading ? (
        <SectionSkeleton cards={2} />
      ) : null}
      {sections.isError ? (
        <Button variant="secondary" onPress={() => void sections.refetch()}>
          دریافت دوباره بخش‌های مربی‌ها
        </Button>
      ) : null}

      <DiscoverySectionHeader
        title="همه مربی‌ها"
        subtitle={t("resultsCount", {
          count: (result.data?.total ?? coaches.length).toLocaleString("fa-IR"),
        })}
        icon="user"
      />
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
      {result.isError ? (
        <Button onPress={() => void result.refetch()}>{t("retry")}</Button>
      ) : null}
      {!result.isLoading && !result.isError && coaches.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">{t("empty")}</p>
      ) : null}
    </main>
  );
}
