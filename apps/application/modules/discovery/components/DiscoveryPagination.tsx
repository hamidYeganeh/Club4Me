"use client";

import { useEffect, useRef } from "react";
import { Button } from "@heroui/react";

export function DiscoveryPagination({
  page,
  total,
  limit,
  onChange,
  pending = false,
  failed = false,
  onRetry,
}: {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
  pending?: boolean;
  failed?: boolean;
  onRetry?: () => void;
}) {
  const target = useRef<HTMLDivElement>(null);
  const requested = useRef<number | null>(null);
  const pages = Math.max(1, Math.ceil(total / limit));
  const callback = useRef(onChange);
  useEffect(() => { callback.current = onChange; }, [onChange]);
  useEffect(() => {
    const element = target.current;
    if (
      !element ||
      failed ||
      pending ||
      page >= pages ||
      !("IntersectionObserver" in window)
    )
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && requested.current !== page) {
          requested.current = page;
          callback.current(page + 1);
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [page, pages, pending, failed]);
  useEffect(() => {
    requested.current = null;
  }, [page, total]);
  if (page >= pages && !pending && !failed) return null;
  return (
    <div ref={target} className="flex justify-center py-5" aria-live="polite">
      <Button
        variant="secondary"
        isPending={pending}
        onPress={() => (failed ? onRetry?.() : onChange(page + 1))}
        isDisabled={!failed && page >= pages}
      >
        {failed
          ? "تلاش دوباره"
          : pending
            ? "در حال دریافت نتایج بیشتر…"
            : "نمایش نتایج بیشتر"}
      </Button>
    </div>
  );
}
