"use client";

import { useDeferredValue, useState } from "react";
import { useInfiniteBusinessCatalog } from "@api/business";

export function ClubResourceField({
  label,
  resource,
  category = "facilities",
  value,
  onChange,
  selectedLabel,
  legacyLabel,
}: {
  label: string;
  resource: string;
  category?: string;
  value?: string;
  onChange: (id: string | undefined, name?: string) => void;
  selectedLabel?: string;
  legacyLabel?: string;
}) {
  const [search, setSearch] = useState("");
  const deferred = useDeferredValue(search);
  const resources = useInfiniteBusinessCatalog(category, resource, {
    search: deferred,
  });
  const options = resources.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <div className="space-y-2">
      <label className="block text-sm">
        {label}
        <select
          className="mt-1 w-full rounded-xl border border-border bg-surface p-3 text-sm"
          value={value ?? ""}
          onChange={(event) =>
            onChange(
              event.target.value || undefined,
              options.find((option) => option.id === event.target.value)?.name,
            )
          }
        >
          <option value="">انتخاب نشده</option>
          {value && !options.some((option) => option.id === value) && (
            <option value={value}>
              {selectedLabel ?? "گزینه ثبت‌شده (در فهرست فعلی نیست)"}
            </option>
          )}
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
      <input
        aria-label={`جست‌وجوی ${label}`}
        placeholder={`جست‌وجوی ${label}`}
        maxLength={200}
        className="w-full rounded-lg border border-border bg-surface p-2 text-xs"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {resources.isPending && (
        <p className="text-xs text-muted">در حال دریافت گزینه‌ها…</p>
      )}
      {resources.isError && (
        <button
          type="button"
          className="text-xs text-danger"
          onClick={() => void resources.refetch()}
        >
          دریافت گزینه‌ها انجام نشد؛ تلاش دوباره
        </button>
      )}
      {!resources.isPending && !resources.isError && !options.length && (
        <p className="text-xs text-muted">
          گزینه فعالی پیدا نشد؛ تعریف گزینه‌ها توسط ادمین انجام می‌شود.
        </p>
      )}
      {resources.hasNextPage && (
        <button
          type="button"
          disabled={resources.isFetchingNextPage}
          className="text-xs text-accent"
          onClick={() => void resources.fetchNextPage()}
        >
          نمایش گزینه‌های بیشتر
        </button>
      )}
      {legacyLabel && !value && (
        <p className="text-xs text-muted">
          مقدار قبلی: {legacyLabel}؛ برای تغییر، از فهرست ادمین انتخاب کنید.
        </p>
      )}
    </div>
  );
}
