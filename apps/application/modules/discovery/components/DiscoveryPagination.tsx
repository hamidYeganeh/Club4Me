"use client";

import { Button } from "@heroui/react";

export function DiscoveryPagination({
  page,
  total,
  limit,
  onChange,
  pending = false,
}: {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
  pending?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages === 1 && page === 1) return null;
  return (
    <nav
      aria-label="صفحه‌بندی نتایج"
      className="flex items-center justify-between gap-3 border-t border-border pt-5"
    >
      <Button
        size="sm"
        variant="secondary"
        isDisabled={page <= 1 || pending}
        onPress={() => onChange(page - 1)}
      >
        قبلی
      </Button>
      <span className="text-xs tabular-nums text-muted" aria-live="polite">
        صفحه {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}
      </span>
      <Button
        size="sm"
        variant="secondary"
        isDisabled={page >= pages || pending}
        onPress={() => onChange(page + 1)}
      >
        بعدی
      </Button>
    </nav>
  );
}
