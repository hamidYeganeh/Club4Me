"use client";

import { useState } from "react";
import Link from "@/components/app-link";
import {
  useInfinitePublicCatalogResource,
  usePublicCatalogResource,
  type DiscoverySportItem,
} from "@api/discovery";
import { Icon } from "@theme/icon";
import { SecondaryHeader } from "../components/SecondaryHeader";
import { DiscoveryBrowseIntro } from "../components/DiscoveryBrowseIntro";
import { DiscoverySearchField } from "../components/DiscoverySearchField";
import { DiscoveryEmptySection } from "../components/DiscoveryEmptySection";
import { InfiniteQueryTrigger } from "../components/InfiniteQueryTrigger";
import { DiscoverySportsRailSection } from "../sections/DiscoverySportsRailSection";
import { DiscoveryQueryState } from "../components/DiscoveryQueryState";
import { DiscoveryResultCardSkeleton } from "@/components/loading-skeletons";
import { resolveClubTypeIcon } from "../discovery-icons";
import { useDiscoveryList } from "../hooks/use-discovery-list";

export function DiscoverySportsScreen() {
  const { query, setQuery, q } = useDiscoveryList();
  const [categoryId, setCategoryId] = useState<string>();
  const categories = usePublicCatalogResource("sports", "sport-category", {
    limit: 100,
  });
  const featured = usePublicCatalogResource("sports", "sport", { limit: 8 });
  const sports = useInfinitePublicCatalogResource("sports", "sport", {
    search: q,
    parentId: categoryId,
    limit: 30,
  });
  const items = sports.data?.pages.flatMap((page) => page.items) ?? [];
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
      {!q && !categoryId && (
        <DiscoverySportsRailSection
          id="sports-featured"
          title="رشته‌های پیشنهادی"
          items={(featured.data?.items ?? []) as DiscoverySportItem[]}
          isLoading={featured.isPending}
        />
      )}
      <section aria-label="دسته‌بندی ورزش‌ها" className="space-y-3">
        <h2 className="text-lg font-bold">دسته‌بندی ورزش‌ها</h2>
        <DiscoveryQueryState query={categories} />
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
          {[
            { id: "", name: "همه ورزش‌ها" },
            ...(categories.data?.items ?? []),
          ].map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={(categoryId ?? "") === category.id}
              onClick={() => setCategoryId(category.id || undefined)}
              className={`shrink-0 rounded-2xl px-4 py-3 text-sm focus-visible:outline-2 focus-visible:outline-focus ${(categoryId ?? "") === category.id ? "bg-accent text-accent-foreground" : "bg-surface"}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>
      <DiscoveryQueryState query={sports} />
      {sports.isLoading ? <DiscoveryResultCardSkeleton count={4} /> : null}
      <div className="grid grid-cols-2 gap-3">
        {items.map((sport) => (
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
      {sports.isSuccess && !items.length ? (
        <DiscoveryEmptySection
          title="ورزشی پیدا نشد"
          subtitle="نام دیگری را جست‌وجو کن."
          icon="soccer"
        />
      ) : null}
      <InfiniteQueryTrigger {...sports} />
    </main>
  );
}
