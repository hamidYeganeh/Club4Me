"use client";
import { useState } from "react";
import { DiscoverySearchField } from "@modules/discovery/components/DiscoverySearchField";
import { DiscoveryFilterSheet } from "@modules/discovery/components/DiscoveryFilterSheet";
import { Button } from "@heroui/react";

const statusLabels: Record<string, string> = {
  active: "فعال",
  inactive: "غیرفعال",
  pending: "در انتظار",
  completed: "تکمیل‌شده",
  cancelled: "لغوشده",
  draft: "پیش‌نویس",
  paused: "متوقف",
  expired: "منقضی",
  open: "باز",
  closed: "بسته",
  resolved: "پاسخ داده‌شده",
  waitlisted: "لیست انتظار",
  reserved: "رزروشده",
  confirmed: "تأییدشده",
  paid: "پرداخت‌شده",
  unread: "خوانده‌نشده",
  read: "خوانده‌شده",
  default: "پیش‌فرض",
  other: "سایر",
  published: "منتشرشده",
};
const normalize = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .toLocaleLowerCase()
    .trim();

/** Search the supplied records by explicit display fields, without querying other models. */
export function useRecordBrowser<T>(
  records: readonly T[],
  {
    label,
    text,
    status,
  }: { label: string; text: (item: T) => string; status?: (item: T) => string },
) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [sort, setSort] = useState("default");
  const statuses = [
    ...new Set(status ? records.map(status).filter(Boolean) : []),
  ];
  const items = records.filter(
    (item) =>
      normalize(text(item)).includes(normalize(search)) &&
      (!selected || !status || status(item) === selected),
  );
  if (sort !== "default")
    items.sort(
      (a, b) =>
        (sort === "asc" ? 1 : -1) * text(a).localeCompare(text(b), "fa"),
    );
  const reset = () => {
    setSearch("");
    setSelected("");
    setSort("default");
  };
  const controls = (
    <div className="mb-5 space-y-3">
      <DiscoverySearchField
        value={search}
        onChange={setSearch}
        placeholder={`جست‌وجو در ${label}`}
      />
      <DiscoveryFilterSheet
        title={`فیلتر ${label}`}
        activeCount={Number(Boolean(selected)) + Number(sort !== "default")}
        resultCount={items.length}
      >
        {status && (
          <label className="block text-sm">
            وضعیت
            <select
              aria-label="وضعیت"
              className="mt-2 min-h-12 w-full rounded-2xl bg-surface-secondary px-4"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">همه وضعیت‌ها</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value] ?? value}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block text-sm">
          ترتیب نام
          <select
            aria-label="ترتیب نام"
            className="mt-2 min-h-12 w-full rounded-2xl bg-surface-secondary px-4"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="default">ترتیب پیش‌فرض</option>
            <option value="asc">الف تا ی</option>
            <option value="desc">ی تا الف</option>
          </select>
        </label>
        <Button
          variant="secondary"
          onPress={() => {
            setSelected("");
            setSort("default");
            setSearch("");
          }}
        >
          پاک‌کردن جست‌وجو و فیلترها
        </Button>
      </DiscoveryFilterSheet>
      {(search || selected || sort !== "default") && (
        <div className="flex flex-wrap items-center gap-2">
          <p role="status" className="me-auto text-xs text-muted">
            {items.length.toLocaleString("fa-IR")} نتیجه در این فهرست
          </p>
          {selected ? (
            <Button
              size="sm"
              variant="secondary"
              onPress={() => setSelected("")}
              aria-label={`حذف فیلتر ${statusLabels[selected] ?? selected}`}
            >
              {statusLabels[selected] ?? selected}
              <span aria-hidden>×</span>
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            onPress={() => {
              setSearch("");
              setSelected("");
              setSort("default");
            }}
          >
            پاک‌کردن همه
          </Button>
        </div>
      )}
    </div>
  );
  return { items, controls, search, setSearch, reset };
}
