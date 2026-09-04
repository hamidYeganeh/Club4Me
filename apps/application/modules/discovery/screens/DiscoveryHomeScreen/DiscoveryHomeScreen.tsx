"use client";

import { useDiscoveryFeed } from "@api/discovery";
import { Spinner } from "@heroui/react";
import { DiscoveryHomeHeaderSection } from "@modules/discovery/sections/DiscoveryHomeHeaderSection";
import { DiscoveryHomeExploreSection } from "@modules/discovery/sections/DiscoveryHomeExploreSection";
import { DiscoveryDynamicSection } from "@modules/discovery/sections/DiscoveryDynamicSection";
import { useTranslations } from "next-intl";

export function DiscoveryHomeScreen() {
  const t = useTranslations("nav");
  const feed = useDiscoveryFeed();

  return (
    <main className="app-page gap-6">
      <DiscoveryHomeHeaderSection title={t("discover")} />
      <DiscoveryHomeExploreSection />
      {feed.isPending ? (
        <div className="grid place-items-center py-12">
          <Spinner />
        </div>
      ) : null}
      {feed.isError ? (
        <div className="rounded-2xl bg-danger/10 p-4 text-center text-sm text-danger">
          <p>دریافت محتوای دیسکاوری ناموفق بود.</p>
          <button
            className="mt-2 font-bold"
            onClick={() => void feed.refetch()}
          >
            تلاش دوباره
          </button>
        </div>
      ) : null}
      {feed.data?.map((section) => (
        <DiscoveryDynamicSection key={section.id} section={section} />
      ))}
    </main>
  );
}
