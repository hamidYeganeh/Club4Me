"use client";

import { Skeleton } from "@heroui/react";
import {
  usePublicCatalogResource,
  type DiscoverySportItem,
} from "@api/discovery";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import { DiscoverySportsRailSection } from "@modules/discovery/sections/DiscoverySportsRailSection/DiscoverySportsRailSection";

export function ClubSportsSection({ sportIds }: { sportIds: string[] }) {
  const sports = usePublicCatalogResource("sports", "sport");
  const selectedSports = (sports.data?.items ?? []).filter((sport) =>
    sportIds.includes(sport.id),
  ) as DiscoverySportItem[];

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-hidden px-5 pb-8">
      {sports.isPending ? (
        <section className="space-y-4" aria-label="رشته‌های ورزشی">
          <DiscoverySectionHeader
            title="رشته‌های ورزشی"
            subtitle="فعالیت‌هایی که در این باشگاه ارائه می‌شوند"
            icon="soccer"
          />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton
                key={index}
                className="h-52 w-[12.5rem] shrink-0 rounded-[1.35rem]"
              />
            ))}
          </div>
        </section>
      ) : (
        <DiscoverySportsRailSection
          id="club-detail"
          title="رشته‌های ورزشی"
          subtitle="فعالیت‌هایی که در این باشگاه ارائه می‌شوند"
          items={selectedSports}
          seeAllHref="/discovery/search"
        />
      )}
    </div>
  );
}
