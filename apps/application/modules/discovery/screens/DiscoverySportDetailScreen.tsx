"use client";
import type { PublicResourceItem } from "@api/discovery";
import { SecondaryHeader } from "../components/SecondaryHeader";
import { DiscoveryBrowseIntro } from "../components/DiscoveryBrowseIntro";
import {
  RelatedClubs,
  RelatedClasses,
  RelatedCoaches,
  RelatedSports,
} from "../components/RelatedContent";
import { resolveClubTypeIcon } from "../discovery-icons";

export function DiscoverySportDetailScreen({
  sport,
}: {
  sport: PublicResourceItem;
}) {
  const params = { sportId: sport.id };
  return (
    <main className="app-page gap-8">
      <SecondaryHeader title={sport.name} showFilter={false} />
      <DiscoveryBrowseIntro
        title={sport.name}
        description={
          sport.description ||
          "باشگاه‌ها، کلاس‌ها و مربی‌های این رشته را کشف کن."
        }
        icon={resolveClubTypeIcon(
          typeof sport.code === "string" ? sport.code : undefined,
          typeof sport.icon === "string" ? sport.icon : undefined,
        )}
      />
      <RelatedClubs params={params} title={`باشگاه‌های ${sport.name}`} />
      <RelatedClasses params={params} title={`کلاس‌های ${sport.name}`} />
      <RelatedCoaches params={params} title={`مربی‌های ${sport.name}`} />
      <RelatedSports
        excludeId={sport.id}
        categoryId={
          typeof sport.categoryId === "string" ? sport.categoryId : undefined
        }
      />
    </main>
  );
}
