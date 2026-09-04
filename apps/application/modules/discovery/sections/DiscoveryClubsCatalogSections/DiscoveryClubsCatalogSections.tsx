"use client";

import { useTranslations } from "next-intl";

import { mockDiscoveryBanners } from "@modules/discovery/discovery-banners.mock";
import {
  MOCK_DISCOVERY_RAIL_SPORTS,
  mockRailClubs,
} from "@modules/discovery/discovery-clubs-rails.mock";
import { DiscoveryBannersSection } from "@modules/discovery/sections/DiscoveryBannersSection";
import { DiscoveryClassesRailSection } from "@modules/discovery/sections/DiscoveryClassesRailSection";
import { DiscoveryClubsEditorialListSection } from "@modules/discovery/sections/DiscoveryClubsEditorialListSection";
import { DiscoveryClubsLocationsSection } from "@modules/discovery/sections/DiscoveryClubsLocationsSection";
import { DiscoveryClubsRailSection } from "@modules/discovery/sections/DiscoveryClubsRailSection";
import { DiscoveryClubTypesSection } from "@modules/discovery/sections/DiscoveryClubTypesSection";
import { mockDiscoveryClasses } from "@modules/discovery/discovery-classes.mock";

import { discoveryClubsCatalogSectionsStyles } from "./DiscoveryClubsCatalogSections.styles";
import type { DiscoveryClubsCatalogSectionsProps } from "./DiscoveryClubsCatalogSections.types";

const RAIL_LIMIT = 6;
const EDITORIAL_LIST_LIMIT = 8;

export function DiscoveryClubsCatalogSections({
  idPrefix = "clubs",
  showClubTypes = true,
  showHero = false,
  showEditorialList = true,
}: DiscoveryClubsCatalogSectionsProps) {
  const t = useTranslations("discovery.clubs");
  const tClasses = useTranslations("discovery.classes");
  const styles = discoveryClubsCatalogSectionsStyles();

  return (
    <div className={styles.root()}>
      {showHero ? (
        <div className={styles.hero()}>
          <DiscoveryBannersSection
            id={`${idPrefix}-hero`}
            items={mockDiscoveryBanners(0, 4)}
            aspectRatio="16/9"
            slidesPerView={1}
          />
        </div>
      ) : null}
      <DiscoveryClubsRailSection
        id={`${idPrefix}-nearby`}
        title={t("nearbyTitle")}
        subtitle={t("nearbySubtitle")}
        icon="pin-1"
        seeAllHref="/discovery/clubs?nearby=1"
        items={mockRailClubs(0, RAIL_LIMIT)}
        tone="accent"
        cardVariant="compact"
      />
      <div className={styles.sheet()}>
        {showClubTypes ? <DiscoveryClubTypesSection /> : null}
        <DiscoveryBannersSection
          id={`${idPrefix}-featured`}
          title={t("bannersFeaturedTitle")}
          subtitle={t("bannersFeaturedSubtitle")}
          items={mockDiscoveryBanners(0, 3)}
          aspectRatio="16/9"
          slidesPerView={1.2}
        />
        <DiscoveryClubsRailSection
          id={`${idPrefix}-top-rated`}
          title={t("topRatedTitle")}
          subtitle={t("topRatedSubtitle")}
          icon="medal"
          seeAllHref="/discovery/clubs?sort=rating"
          items={mockRailClubs(2, RAIL_LIMIT)}
          cardVariant="editorial"
        />
        <DiscoveryBannersSection
          id={`${idPrefix}-stories`}
          title={t("bannersStoriesTitle")}
          subtitle={t("bannersStoriesSubtitle")}
          items={mockDiscoveryBanners(1, 4)}
          aspectRatio="9/16"
          slidesPerView="auto"
        />
        <DiscoveryClubsRailSection
          id={`${idPrefix}-newest`}
          title={t("newestTitle")}
          subtitle={t("newestSubtitle")}
          icon="sparkle-1"
          seeAllHref="/discovery/clubs?sort=newest"
          items={mockRailClubs(4, RAIL_LIMIT)}
          cardVariant="compact"
        />
        <DiscoveryClubsLocationsSection />
        <DiscoveryClassesRailSection
          id={`${idPrefix}-classes-featured`}
          title={tClasses("featuredTitle")}
          subtitle={tClasses("featuredSubtitle")}
          icon="academic-cap"
          seeAllHref="/discovery/classes"
          items={mockDiscoveryClasses(0, RAIL_LIMIT)}
        />
        <DiscoveryBannersSection
          id={`${idPrefix}-wide`}
          title={t("bannersWideTitle")}
          subtitle={t("bannersWideSubtitle")}
          items={mockDiscoveryBanners(3, 3)}
          aspectRatio="4/3"
          slidesPerView={1.2}
        />
        <DiscoveryClassesRailSection
          id={`${idPrefix}-classes-open`}
          title={tClasses("openTitle")}
          subtitle={tClasses("openSubtitle")}
          icon="sparkle-1"
          seeAllHref="/discovery/classes"
          items={mockDiscoveryClasses(2, RAIL_LIMIT)}
        />
        <DiscoveryBannersSection
          id={`${idPrefix}-editorial`}
          title={t("bannersEditorialTitle")}
          subtitle={t("bannersEditorialSubtitle")}
          items={mockDiscoveryBanners(2, 3)}
          aspectRatio="3/4"
          slidesPerView="auto"
        />
        {MOCK_DISCOVERY_RAIL_SPORTS.map((sport, index) => (
          <DiscoveryClubsRailSection
            key={sport.id}
            id={`${idPrefix}-sport-${sport.id}`}
            title={sport.name}
            subtitle={t("sportSubtitle", { sport: sport.name })}
            icon={sport.icon}
            seeAllHref={`/discovery/clubs?sportId=${sport.id}`}
            items={mockRailClubs(index + 1, RAIL_LIMIT)}
            cardVariant={index % 2 === 0 ? "editorial" : "compact"}
          />
        ))}
        {showEditorialList ? (
          <DiscoveryClubsEditorialListSection
            id={`${idPrefix}-editorial-list`}
            items={mockRailClubs(0, EDITORIAL_LIST_LIMIT)}
          />
        ) : null}
      </div>
    </div>
  );
}
