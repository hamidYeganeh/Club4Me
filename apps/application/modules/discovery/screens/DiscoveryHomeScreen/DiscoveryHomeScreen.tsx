"use client";

import { useDiscoveryFeed } from "@api/discovery";
import { Spinner } from "@heroui/react";
import { useTranslations } from "next-intl";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { mockDiscoveryArticles } from "@modules/discovery/discovery-articles.mock";
import { mockDiscoveryBanners } from "@modules/discovery/discovery-banners.mock";
import { mockDiscoveryClasses } from "@modules/discovery/discovery-classes.mock";
import { mockDiscoveryCoaches } from "@modules/discovery/discovery-coaches.mock";
import { DiscoveryArticlesRailSection } from "@modules/discovery/sections/DiscoveryArticlesRailSection";
import { DiscoveryBannersSection } from "@modules/discovery/sections/DiscoveryBannersSection";
import { DiscoveryClassesRailSection } from "@modules/discovery/sections/DiscoveryClassesRailSection";
import { DiscoveryClubsCatalogSections } from "@modules/discovery/sections/DiscoveryClubsCatalogSections";
import { DiscoveryCoachesRailSection } from "@modules/discovery/sections/DiscoveryCoachesRailSection";
import { DiscoveryDynamicSection } from "@modules/discovery/sections/DiscoveryDynamicSection";
import { DiscoveryHomeExploreSection } from "@modules/discovery/sections/DiscoveryHomeExploreSection";

export function DiscoveryHomeScreen() {
  const t = useTranslations("discovery.home");
  const feed = useDiscoveryFeed();

  return (
    <main className="app-page gap-6">
      <SecondaryHeader />
      <DiscoveryBannersSection
        id="home-hero"
        items={mockDiscoveryBanners(0, 4)}
        aspectRatio="16/9"
        slidesPerView={1}
      />
      <DiscoveryHomeExploreSection />
      <DiscoveryClassesRailSection
        id="home-classes-featured"
        title={t("classesFeaturedTitle")}
        subtitle={t("classesFeaturedSubtitle")}
        icon="academic-cap"
        seeAllHref="/discovery/classes"
        items={mockDiscoveryClasses(0, 6)}
      />
      <DiscoveryCoachesRailSection
        id="home-coaches-top"
        title={t("coachesTopTitle")}
        subtitle={t("coachesTopSubtitle")}
        icon="medal"
        seeAllHref="/discovery/coaches"
        items={mockDiscoveryCoaches(0, 5)}
        cardType="normal"
      />
      <DiscoveryClubsCatalogSections idPrefix="home" />
      <DiscoveryClassesRailSection
        id="home-classes-open"
        title={t("classesOpenTitle")}
        subtitle={t("classesOpenSubtitle")}
        icon="sparkle-1"
        seeAllHref="/discovery/classes"
        items={mockDiscoveryClasses(2, 6)}
      />
      <DiscoveryArticlesRailSection
        id="home-articles-latest"
        title={t("articlesLatestTitle")}
        subtitle={t("articlesLatestSubtitle")}
        icon="sparkle-1"
        seeAllHref="/articles"
        items={mockDiscoveryArticles(0, 5)}
        cardVariant={{ orientation: "vertical", outlined: false }}
      />
      <DiscoveryCoachesRailSection
        id="home-coaches-nearby"
        title={t("coachesNearbyTitle")}
        subtitle={t("coachesNearbySubtitle")}
        icon="pin-1"
        seeAllHref="/discovery/coaches"
        items={mockDiscoveryCoaches(2, 5)}
        cardType="compact"
      />
      <DiscoveryArticlesRailSection
        id="home-articles-reading"
        title={t("articlesReadingTitle")}
        subtitle={t("articlesReadingSubtitle")}
        icon="star-full"
        seeAllHref="/articles"
        items={mockDiscoveryArticles(1, 4)}
        cardVariant={{ orientation: "horizontal", outlined: true }}
      />
      <DiscoveryArticlesRailSection
        id="home-articles-picks"
        title={t("articlesPicksTitle")}
        subtitle={t("articlesPicksSubtitle")}
        icon="sparkle-1"
        seeAllHref="/articles"
        items={mockDiscoveryArticles(3, 4)}
        cardVariant={{ orientation: "vertical", outlined: true }}
      />
      {feed.isPending ? (
        <div className="grid place-items-center py-12">
          <Spinner />
        </div>
      ) : null}
      {feed.isError ? (
        <div className="rounded-2xl bg-danger/10 p-4 text-center text-sm text-danger">
          <p>دریافت محتوای دیسکاوری ناموفق بود.</p>
          <button
            className="mt-2 font-bold"
            onClick={() => void feed.refetch()}
          >
            تلاش دوباره
          </button>
        </div>
      ) : null}
      {feed.data?.map((section) => (
        <DiscoveryDynamicSection key={section.id} section={section} />
      ))}
    </main>
  );
}
