"use client";

import { useDeferredValue, useState } from "react";
import { Button, Spinner, Typography } from "@heroui/react";
import { useCatalogCoaches } from "@api/discovery";
import { useTranslations } from "next-intl";

import { DiscoveryResultCard } from "@modules/discovery/components/DiscoveryResultCard";
import { DiscoverySearchField } from "@modules/discovery/components/DiscoverySearchField";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { mockDiscoveryCoachBanners } from "@modules/discovery/discovery-banners.mock";
import { DiscoveryBannersSection } from "@modules/discovery/sections/DiscoveryBannersSection";

export function DiscoveryPeopleScreen() {
  const t = useTranslations("discovery.coaches");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const result = useCatalogCoaches({ q: deferredQuery || undefined });
  const coaches = result.data?.items ?? [];
  const showBrowse = !deferredQuery;

  return (
    <main className="app-page gap-6">
      <SecondaryHeader title={t("title")} />
      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder={t("searchPlaceholder")}
      />

      {showBrowse ? (
        <>
          <DiscoveryBannersSection
            id="coaches-hero"
            items={mockDiscoveryCoachBanners(0, 4)}
            aspectRatio="16/9"
            slidesPerView={1}
          />
          <DiscoveryBannersSection
            id="coaches-promo"
            title={t("bannersPromoTitle")}
            subtitle={t("bannersPromoSubtitle")}
            items={mockDiscoveryCoachBanners(1, 3)}
            aspectRatio="4/3"
            slidesPerView={1.2}
          />
          <DiscoveryBannersSection
            id="coaches-stories"
            title={t("bannersStoriesTitle")}
            subtitle={t("bannersStoriesSubtitle")}
            items={mockDiscoveryCoachBanners(2, 4)}
            aspectRatio="9/16"
            slidesPerView="auto"
          />
          <DiscoveryBannersSection
            id="coaches-editorial"
            title={t("bannersEditorialTitle")}
            subtitle={t("bannersEditorialSubtitle")}
            items={mockDiscoveryCoachBanners(0, 3)}
            aspectRatio="3/4"
            slidesPerView="auto"
          />
        </>
      ) : null}

      <Typography type="body-sm" color="muted" className="app-reveal">
        {t("resultsCount", {
          count: (result.data?.total ?? coaches.length).toLocaleString("fa-IR"),
        })}
      </Typography>
      <div className="flex flex-col gap-3">
        {coaches.map((coach) => (
          <DiscoveryResultCard
            key={coach.id}
            title={coach.displayName}
            subtitle={coach.shortBio}
            meta={`${coach.averageRating.toLocaleString("fa-IR")} ★ · ${coach.experienceYears.toLocaleString("fa-IR")} ${t("yearsExperience")}`}
            imageUrl={coach.imageUrl ?? "/profile/avatar.jpg"}
            href={`/discovery/coaches/${coach.slug}`}
            badge={t("badge")}
          />
        ))}
      </div>
      {result.isLoading ? <Spinner aria-label={t("loading")} /> : null}
      {result.isError ? (
        <Button onPress={() => void result.refetch()}>{t("retry")}</Button>
      ) : null}
      {!result.isLoading && !result.isError && coaches.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted">
          <p>{t("empty")}</p>
          {query ? (
            <Button
              className="mt-4"
              size="sm"
              variant="secondary"
              onPress={() => setQuery("")}
            >
              {t("clearSearch")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
