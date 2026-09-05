"use client";

import { useTranslations } from "next-intl";
import { usePublicCatalogResource } from "@api/discovery";

import { DiscoveryClassesRailSection } from "@modules/discovery/sections/DiscoveryClassesRailSection";
import { DiscoveryClubsEditorialListSection } from "@modules/discovery/sections/DiscoveryClubsEditorialListSection";
import { DiscoveryClubsLocationsSection } from "@modules/discovery/sections/DiscoveryClubsLocationsSection";
import { DiscoveryClubsRailSection } from "@modules/discovery/sections/DiscoveryClubsRailSection";
import { DiscoveryClubTypesSection } from "@modules/discovery/sections/DiscoveryClubTypesSection";

import { discoveryClubsCatalogSectionsStyles } from "./DiscoveryClubsCatalogSections.styles";
import type { DiscoveryClubsCatalogSectionsProps } from "./DiscoveryClubsCatalogSections.types";

const RAIL_LIMIT = 6;

export function DiscoveryClubsCatalogSections({
  idPrefix = "clubs",
  showClubTypes = true,
  showEditorialList = true,
}: DiscoveryClubsCatalogSectionsProps) {
  const t = useTranslations("discovery.clubs");
  const tClasses = useTranslations("discovery.classes");
  const styles = discoveryClubsCatalogSectionsStyles();
  const sports = usePublicCatalogResource("sports", "sport");

  return (
    <div className={styles.root()}>
      <DiscoveryClubsRailSection
        id={`${idPrefix}-nearby`}
        title={t("nearbyTitle")}
        subtitle={t("nearbySubtitle")}
        icon="pin-1"
        seeAllHref="/discovery/clubs?nearby=1"
        params={{ limit: RAIL_LIMIT }}
        tone="accent"
        cardVariant="compact"
      />
      <div className={styles.sheet()}>
        {showClubTypes ? <DiscoveryClubTypesSection /> : null}
        <DiscoveryClubsRailSection
          id={`${idPrefix}-top-rated`}
          title={t("topRatedTitle")}
          subtitle={t("topRatedSubtitle")}
          icon="medal"
          seeAllHref="/discovery/clubs?sort=rating"
          params={{ sort: "rating", limit: RAIL_LIMIT }}
          cardVariant="editorial"
        />
        <DiscoveryClubsRailSection
          id={`${idPrefix}-newest`}
          title={t("newestTitle")}
          subtitle={t("newestSubtitle")}
          icon="sparkle-1"
          seeAllHref="/discovery/clubs?sort=newest"
          params={{ sort: "newest", limit: RAIL_LIMIT }}
          cardVariant="compact"
        />
        <DiscoveryClubsLocationsSection />
        <DiscoveryClassesRailSection
          id={`${idPrefix}-classes-featured`}
          title={tClasses("featuredTitle")}
          subtitle={tClasses("featuredSubtitle")}
          icon="academic-cap"
          seeAllHref="/discovery/classes"
          params={{ limit: RAIL_LIMIT }}
        />
        {(sports.data?.items ?? []).slice(0, 6).map((sport, index) => (
          <DiscoveryClubsRailSection
            key={sport.id}
            id={`${idPrefix}-sport-${sport.id}`}
            title={sport.name}
            subtitle={t("sportSubtitle", { sport: sport.name })}
            icon="weight"
            seeAllHref={`/discovery/sports/${String(sport.slug ?? sport.id)}`}
            params={{ sportId: sport.id, limit: RAIL_LIMIT }}
            cardVariant={index % 2 === 0 ? "editorial" : "compact"}
          />
        ))}
        {showEditorialList ? (
          <DiscoveryClubsEditorialListSection
            id={`${idPrefix}-editorial-list`}
            params={{ limit: 8 }}
          />
        ) : null}
      </div>
    </div>
  );
}
