"use client";

import {
  useCatalogClubs,
  useCatalogClasses,
  useCatalogCoaches,
  useCatalogArticles,
  usePublicCatalogResource,
  type PublicCatalogParams,
  type DiscoverySportItem,
} from "@api/discovery";
import { DiscoveryClubsRailSection } from "../sections/DiscoveryClubsRailSection";
import { DiscoveryClassesRailSection } from "../sections/DiscoveryClassesRailSection";
import { DiscoveryCoachesRailSection } from "../sections/DiscoveryCoachesRailSection";
import { DiscoveryArticlesRailSection } from "../sections/DiscoveryArticlesRailSection";
import { DiscoverySportsRailSection } from "../sections/DiscoverySportsRailSection";
import { DiscoveryQueryState } from "./DiscoveryQueryState";

type Props = {
  excludeId?: string;
  params?: PublicCatalogParams;
  title?: string;
};
export function RelatedClubs({
  excludeId,
  params,
  title = "باشگاه‌های مشابه",
}: Props) {
  const query = useCatalogClubs({ ...params, limit: 9 });
  return (
    <>
      <DiscoveryQueryState query={query} />
      <DiscoveryClubsRailSection
        id={`related-${excludeId ?? "sport"}`}
        title={title}
        icon="weight"
        seeAllHref={`/discovery/clubs${params?.sportId ? `?sportId=${params.sportId}` : ""}`}
        items={(query.data?.items ?? [])
          .filter((item) => item.id !== excludeId)
          .slice(0, 8)}
        isLoading={query.isPending}
      />
    </>
  );
}
export function RelatedClasses({
  excludeId,
  params,
  title = "کلاس‌های مشابه",
}: Props) {
  const query = useCatalogClasses({ ...params, limit: 9 });
  return (
    <>
      <DiscoveryQueryState query={query} />
      <DiscoveryClassesRailSection
        id={`related-${excludeId ?? "sport"}`}
        title={title}
        seeAllHref={`/discovery/classes${params?.sportId ? `?sportId=${params.sportId}` : ""}`}
        items={(query.data?.items ?? [])
          .filter((item) => item.id !== excludeId)
          .slice(0, 8)}
        isLoading={query.isPending}
      />
    </>
  );
}
export function RelatedCoaches({
  excludeId,
  params,
  title = "مربی‌های مشابه",
}: Props) {
  const query = useCatalogCoaches({ ...params, limit: 9 });
  return (
    <>
      <DiscoveryQueryState query={query} />
      <DiscoveryCoachesRailSection
        id={`related-${excludeId ?? "sport"}`}
        title={title}
        seeAllHref={`/discovery/coaches${params?.sportId ? `?sportId=${params.sportId}` : ""}`}
        items={(query.data?.items ?? [])
          .filter((item) => item.id !== excludeId)
          .slice(0, 8)}
        isLoading={query.isPending}
      />
    </>
  );
}
export function RelatedArticles({ excludeId, params }: Props) {
  const query = useCatalogArticles({ ...params, limit: 9 });
  return (
    <>
      <DiscoveryQueryState query={query} />
      <DiscoveryArticlesRailSection
        id={`related-${excludeId}`}
        title="مقاله‌های مشابه"
        items={(query.data?.items ?? [])
          .filter((item) => item.id !== excludeId)
          .slice(0, 8)}
        isLoading={query.isPending}
      />
    </>
  );
}
export function RelatedSports({
  excludeId,
  categoryId,
}: {
  excludeId: string;
  categoryId?: string;
}) {
  const query = usePublicCatalogResource("sports", "sport", {
    parentId: categoryId,
    limit: 9,
  });
  return (
    <>
      <DiscoveryQueryState query={query} />
      <DiscoverySportsRailSection
        id={`related-${excludeId}`}
        title="ورزش‌های مشابه"
        items={
          (query.data?.items ?? [])
            .filter((item) => item.id !== excludeId)
            .slice(0, 8) as DiscoverySportItem[]
        }
        isLoading={query.isPending}
      />
    </>
  );
}
