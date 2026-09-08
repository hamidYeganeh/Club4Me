"use client";
import { useEffect, useRef } from "react";
import { Button } from "@heroui/react";

export function InfiniteQueryTrigger({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  fetchNextPage,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  fetchNextPage: () => Promise<unknown>;
}) {
  const target = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      !hasNextPage ||
      isFetchingNextPage ||
      isFetchNextPageError ||
      !target.current
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void fetchNextPage();
      },
      { root: document.querySelector(".app-scroll-root"), rootMargin: "320px" },
    );
    observer.observe(target.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);
  return (
    <div
      ref={target}
      className="flex min-h-16 justify-center py-4"
      aria-live="polite"
    >
      {isFetchingNextPage ? (
        <span className="text-sm text-muted">در حال دریافت موارد بیشتر…</span>
      ) : hasNextPage ? (
        <Button variant="ghost" onPress={() => void fetchNextPage()}>
          {isFetchNextPageError
            ? "دریافت انجام نشد؛ تلاش دوباره"
            : "نمایش بیشتر"}
        </Button>
      ) : null}
    </div>
  );
}
