"use client";

import Link from "@/components/app-link";
import { usePublicCatalogResource } from "@api/discovery";
import { Icon } from "@theme/icon";
import { SecondaryHeader } from "../components/SecondaryHeader";
import { DiscoveryBrowseIntro } from "../components/DiscoveryBrowseIntro";
import { DiscoverySearchField } from "../components/DiscoverySearchField";
import { DiscoveryEmptySection } from "../components/DiscoveryEmptySection";
import { DiscoveryPagination } from "../components/DiscoveryPagination";
import { DiscoveryQueryState } from "../components/DiscoveryQueryState";
import { DiscoveryResultCardSkeleton } from "@/components/loading-skeletons";
import { resolveClubTypeIcon } from "../discovery-icons";
import { useDiscoveryList } from "../hooks/use-discovery-list";

export function DiscoverySportsScreen() {
  const { query, setQuery, q, page, setPage } = useDiscoveryList();
  const sports = usePublicCatalogResource("sports", "sport", {
    search: q,
    page,
    limit: 30,
  });
  return (
    <main className="app-page gap-6">
      <SecondaryHeader title="ورزش‌ها" showFilter={false} />
      <DiscoveryBrowseIntro
        title="ورزش مورد علاقه‌ات را کشف کن"
        description="از آمادگی جسمانی تا ورزش‌های گروهی؛ یک رشته انتخاب کن و باشگاه‌هایش را ببین."
        icon="soccer"
      />
      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder="جست‌وجوی رشته ورزشی"
      />
      <DiscoveryQueryState query={sports} />
      {sports.isLoading ? <DiscoveryResultCardSkeleton count={4} /> : null}
      <div className="grid grid-cols-2 gap-3">
        {sports.data?.items.map((sport) => (
          <Link
            key={sport.id}
            href={`/discovery/sports/${sport.slug || sport.id}`}
            className="group flex min-w-0 flex-col gap-4 rounded-3xl bg-surface p-4 no-underline outline-none transition-colors hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-focus active:bg-surface-secondary"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-accent/12 text-accent">
              <Icon
                name={resolveClubTypeIcon(
                  typeof sport.code === "string" ? sport.code : undefined,
                  typeof sport.icon === "string" ? sport.icon : undefined,
                )}
                size={28}
              />
            </span>
            <div>
              <h2 className="font-bold text-foreground">{sport.name}</h2>
              <p className="mt-1 line-clamp-2 text-xs leading-6 text-muted">
                {(typeof sport.description === "string" && sport.description) ||
                  "باشگاه‌ها و محل‌های تمرین این رشته"}
              </p>
            </div>
            <span className="mt-auto flex items-center justify-between text-xs font-bold text-accent">
              دیدن باشگاه‌ها
              <Icon name="arrow-left" size={16} />
            </span>
          </Link>
        ))}
      </div>
      {sports.isSuccess && !sports.data.items.length ? (
        <DiscoveryEmptySection
          title="ورزشی پیدا نشد"
          subtitle="نام دیگری را جست‌وجو کن."
          icon="soccer"
        />
      ) : null}
      <DiscoveryPagination
        page={page}
        total={sports.data?.total ?? 0}
        limit={30}
        onChange={setPage}
        pending={sports.isFetching}
      />
    </main>
  );
}
