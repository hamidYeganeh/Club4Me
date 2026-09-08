"use client";

import { useEffect, useState } from "react";

export function useDiscoveryList() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState({ q: "", page: 1 });
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch((current) =>
        current.q === query.trim() ? current : { q: query.trim(), page: 1 },
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  return {
    query,
    setQuery,
    q: search.q || undefined,
    page: search.page,
    setPage: (page: number) => setSearch((current) => ({ ...current, page })),
  };
}
