"use client";

import { SecondaryHeader } from "./SecondaryHeader";
import { DiscoveryQueryState } from "./DiscoveryQueryState";

export function DiscoveryQueryPage({
  title,
  query,
}: {
  title: string;
  query: Parameters<typeof DiscoveryQueryState>[0]["query"];
}) {
  return (
    <main className="app-page gap-6">
      <SecondaryHeader title={title} showFilter={false} />
      <DiscoveryQueryState query={query} />
    </main>
  );
}
