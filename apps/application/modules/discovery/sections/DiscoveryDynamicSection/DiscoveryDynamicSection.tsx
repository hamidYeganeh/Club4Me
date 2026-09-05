"use client";

import type {
  DiscoveryArticleItem,
  DiscoveryClubItem,
  DiscoveryCoachItem,
  DiscoverySection,
  DiscoverySportItem,
  PublicCatalogClass,
} from "@api/discovery";
import { DiscoveryArticlesRailSection } from "@modules/discovery/sections/DiscoveryArticlesRailSection";
import {
  DiscoveryBannersSection,
  parseDiscoveryBannersLayout,
} from "@modules/discovery/sections/DiscoveryBannersSection";
import { DiscoveryClassesRailSection } from "@modules/discovery/sections/DiscoveryClassesRailSection";
import { DiscoveryClubsRailSection } from "@modules/discovery/sections/DiscoveryClubsRailSection";
import { DiscoveryCoachesRailSection } from "@modules/discovery/sections/DiscoveryCoachesRailSection";
import { DiscoverySportsRailSection } from "@modules/discovery/sections/DiscoverySportsRailSection";
import { DiscoveryEmptySection } from "@modules/discovery/components/DiscoveryEmptySection";

const sectionDestinations: Record<DiscoverySection["type"], string> = {
  banners: "/discovery/search",
  clubs: "/discovery/clubs",
  coaches: "/discovery/coaches",
  classes: "/discovery/classes",
  sports: "/discovery/search",
  articles: "/discovery/articles",
};

const sectionIcons = {
  banners: "magnifying-glass",
  clubs: "building-1",
  coaches: "medal",
  classes: "academic-cap",
  sports: "soccer",
  articles: "book-open",
} as const;

export function DiscoveryDynamicSection({
  section,
}: {
  section: DiscoverySection;
}) {
  const title = section.appearance.showHeader ? section.title : "";
  const subtitle = section.appearance.showHeader ? section.subtitle : "";
  const viewAllUrl = section.appearance.showViewAll
    ? section.viewAllUrl || sectionDestinations[section.type]
    : "";
  const viewAllLabel = section.appearance.showViewAll
    ? section.viewAllLabel || "مشاهده همه"
    : "";

  if (!section.items.length) {
    return (
      <DiscoveryEmptySection
        title={title}
        subtitle={subtitle}
        icon={sectionIcons[section.type]}
        viewAllLabel={viewAllLabel}
        viewAllUrl={viewAllUrl}
      />
    );
  }

  if (section.type === "banners") {
    const { aspectRatio, slidesPerView } = parseDiscoveryBannersLayout(
      section.layout,
    );
    return (
      <DiscoveryBannersSection
        id={section.id}
        title={title}
        subtitle={subtitle}
        viewAllLabel={viewAllLabel}
        viewAllUrl={viewAllUrl}
        items={section.items}
        aspectRatio={aspectRatio}
        slidesPerView={slidesPerView}
      />
    );
  }

  if (section.type === "clubs") {
    const editorial =
      section.layout.includes("editorial") ||
      section.key.includes("top-rated") ||
      section.key.includes("popular");
    const accent =
      section.layout.includes("accent") || section.key.includes("nearby");
    const clubs = (section.items as DiscoveryClubItem[]).map((club) => ({
      ...club,
      imageUrl: club.imageUrl ?? "/discovery/locations/city-modern.jpg",
    }));
    return (
      <DiscoveryClubsRailSection
        id={section.id}
        title={title}
        subtitle={subtitle}
        icon={editorial ? "medal" : "weight"}
        seeAllHref={viewAllUrl}
        items={clubs}
        tone={accent ? "accent" : "surface"}
        cardVariant={editorial ? "editorial" : "compact"}
      />
    );
  }

  if (section.type === "coaches") {
    const coaches = (section.items as DiscoveryCoachItem[]).map((coach) => ({
      ...coach,
      imageUrl: coach.imageUrl ?? "/profile/avatar.jpg",
    }));
    return (
      <DiscoveryCoachesRailSection
        id={section.id}
        title={title}
        subtitle={subtitle}
        icon="medal"
        seeAllHref={viewAllUrl}
        seeAllLabel={viewAllLabel}
        items={coaches}
        cardType={
          section.layout.includes("compact") || section.key.includes("new-")
            ? "compact"
            : "normal"
        }
      />
    );
  }

  if (section.type === "classes") {
    const classes = (section.items as PublicCatalogClass[]).map((item) => ({
      ...item,
      imageUrl: item.imageUrl ?? "/welcome/introduce/progress-iran-v2.png",
    }));
    return (
      <DiscoveryClassesRailSection
        id={section.id}
        title={title}
        subtitle={subtitle}
        icon="academic-cap"
        seeAllHref={viewAllUrl}
        seeAllLabel={viewAllLabel}
        items={classes}
      />
    );
  }

  if (section.type === "sports") {
    return (
      <DiscoverySportsRailSection
        id={section.id}
        title={title}
        subtitle={subtitle}
        seeAllHref={viewAllUrl}
        seeAllLabel={viewAllLabel}
        items={section.items as DiscoverySportItem[]}
      />
    );
  }

  const articles = (section.items as DiscoveryArticleItem[]).map((article) => ({
    ...article,
    coverImageUrl:
      article.coverImageUrl ?? "/welcome/introduce/discover-iran-v2.png",
  }));
  return (
    <DiscoveryArticlesRailSection
      id={section.id}
      title={title}
      subtitle={subtitle}
      icon="sparkle-1"
      seeAllHref={viewAllUrl}
      seeAllLabel={viewAllLabel}
      items={articles}
      cardVariant={{
        orientation:
          section.layout.includes("horizontal") ||
          section.key.includes("library")
            ? "horizontal"
            : "vertical",
        outlined: section.layout.includes("outline"),
      }}
    />
  );
}
