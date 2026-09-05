"use client";

import { ClubEmptyState } from "@modules/discovery/components/ClubEmptyState";

import { Button, Skeleton } from "@heroui/react";
import {
  usePublicCatalogResource,
  type DiscoverySportItem,
} from "@api/discovery";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import { DiscoverySportsRailSection } from "@modules/discovery/sections/DiscoverySportsRailSection/DiscoverySportsRailSection";

export function ClubSportsSection({ sportIds }: { sportIds: string[] }) {
  const sports = usePublicCatalogResource(
    "sports",
    "sport",
    { limit: 100 },
    sportIds.length > 0,
  );
  const selectedSports = (sports.data?.items ?? []).filter((sport) =>
    sportIds.includes(sport.id),
  ) as DiscoverySportItem[];

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-hidden px-5 pb-8">
      {sportIds.length > 0 && sports.isPending ? (
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
      ) : sports.isError ? (
        <div className="app-surface rounded-3xl p-5 text-center text-sm text-muted">
          دریافت رشته‌های ورزشی انجام نشد.
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            onPress={() => void sports.refetch()}
          >
            تلاش دوباره
          </Button>
        </div>
      ) : selectedSports.length === 0 ? (
        <section className="space-y-4">
          <DiscoverySectionHeader title="رشته‌های ورزشی" icon="soccer" />
          <ClubEmptyState
            title="هنوز رشته‌ای معرفی نشده است"
            description="رشته‌های ورزشی این باشگاه پس از ثبت اینجا نمایش داده می‌شوند."
          />
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
