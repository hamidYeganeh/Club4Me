"use client";

import { useEffect, useRef } from "react";
import { Button, Skeleton, Spinner } from "@heroui/react";
import { useInfiniteClubs } from "@api/discovery";
import { ClubCard } from "@ui/club-card";
import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import { DiscoveryEmptySection } from "@modules/discovery/components/DiscoveryEmptySection";
import { RequestFailureState } from "@/components/request-failure-state";

export function DiscoveryInfiniteClubsSection() {
  const clubs = useInfiniteClubs();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const items = clubs.data?.pages.flatMap((page) => page.items) ?? [];
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = clubs;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (!clubs.isPending && !clubs.isError && items.length === 0) {
    return (
      <DiscoveryEmptySection
        title="همه باشگاه‌ها"
        subtitle="در حال حاضر باشگاه عمومی برای نمایش وجود ندارد"
      />
    );
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="all-clubs-title">
      <DiscoverySectionHeader
        id="all-clubs-title"
        title="همه باشگاه‌ها"
        subtitle="باشگاه‌های بیشتری را برای انتخاب بهتر ببین"
        icon="building-1"
      />

      {clubs.isPending ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton
              key={index}
              className="aspect-[16/9] w-full rounded-3xl"
            />
          ))}
        </div>
      ) : null}

      {clubs.isError && items.length === 0 ? (
        <RequestFailureState
          error={clubs.error}
          onRetry={() => void clubs.refetch()}
          compact
        />
      ) : null}

      <div className="flex flex-col gap-4">
        {items.map((club) => (
          <ClubCard
            key={club.id}
            variant="compact"
            title={club.name}
            location={club.city}
            href={`/discovery/clubs/${club.slug}`}
            className="!aspect-[16/9] !w-full"
          />
        ))}
      </div>

      {clubs.isError && items.length > 0 ? (
        <Button
          variant="secondary"
          onPress={() => void clubs.fetchNextPage()}
          className="w-full"
        >
          تلاش دوباره
        </Button>
      ) : null}

      <div ref={sentinelRef} className="grid min-h-12 place-items-center">
        {clubs.isFetchingNextPage ? <Spinner size="sm" /> : null}
        {!clubs.hasNextPage && items.length > 0 ? (
          <p className="text-center text-xs text-muted">
            همه باشگاه‌ها نمایش داده شدند.
          </p>
        ) : null}
      </div>
    </section>
  );
}
