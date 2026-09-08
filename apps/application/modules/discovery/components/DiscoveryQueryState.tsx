"use client";

import { RequestFailureState } from "@/components/request-failure-state";
import { getQueryFailure } from "@/lib/request-failure";

export function DiscoveryQueryState({
  query,
}: {
  query: {
    error: unknown;
    fetchStatus: "fetching" | "paused" | "idle";
    refetch: () => unknown;
  };
}) {
  const failure = getQueryFailure(query.error, query.fetchStatus);
  return failure ? (
    <RequestFailureState
      compact
      error={failure}
      onRetry={() => {
        void query.refetch();
      }}
    />
  ) : null;
}
