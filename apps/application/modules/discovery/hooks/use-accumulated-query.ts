"use client";

import { useState } from "react";

/** Keep earlier pages visible; a new search/filter scope starts a fresh collection. */
export function useAccumulatedQuery<
  T extends { data: unknown; isPlaceholderData?: boolean },
>(query: T, page: number, scope: string): T {
  const [cache, setCache] = useState<{
    scope: string;
    pages: Map<number, unknown>;
    last: unknown;
  }>({ scope, pages: new Map(), last: undefined });
  let current = cache;
  if (cache.scope !== scope)
    current = { scope, pages: new Map(), last: undefined };
  if (
    query.data &&
    !query.isPlaceholderData &&
    current.pages.get(page) !== query.data
  ) {
    current = { scope, pages: new Map(current.pages), last: query.data };
    current.pages.set(page, query.data);
  }
  if (current !== cache) setCache(current);
  if (!current.last) return query;
  const data = { ...(current.last as Record<string, unknown>) };
  for (const key of Object.keys(data)) {
    if (!Array.isArray(data[key])) continue;
    const unique = new Map<string, unknown>();
    for (const [, value] of [...current.pages].sort(([a], [b]) => a - b)) {
      const items = (value as Record<string, unknown>)[key];
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const id =
          item && typeof item === "object" && "id" in item
            ? String(item.id)
            : JSON.stringify(item);
        unique.set(id, item);
      }
    }
    data[key] = [...unique.values()];
  }
  return { ...query, data } as T;
}
