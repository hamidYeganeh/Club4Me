"use client";
import { useState } from "react";
import { Button, Switch } from "@heroui/react";
import { Columns3, X } from "lucide-react";
import Link from "@/components/app-link";
import { BottomSheet } from "@/components/motion/bottom-sheet";

export type ComparisonItem = {
  comparisonKey: string;
  title: string;
  subtitle?: string | null;
  badge: string;
  meta?: string | null;
  href: string;
};
export function DiscoveryComparison({
  items,
  onRemove,
  onClear,
}: {
  items: ComparisonItem[];
  onRemove: (key: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [differences, setDifferences] = useState(false);
  if (!items.length) return null;
  const rows = [
    { label: "نوع", values: items.map((item) => item.badge) },
    {
      label: "درباره گزینه",
      values: items.map((item) => item.subtitle || "اعلام نشده"),
    },
    {
      label: "قیمت، زمان و شرایط",
      values: items.map(
        (item) => item.meta || "برای شرایط کامل جزئیات را ببین",
      ),
    },
  ].filter((row) => !differences || new Set(row.values).size > 1);
  return (
    <>
      <aside
        aria-label="گزینه‌های انتخاب‌شده برای مقایسه"
        className="rounded-3xl border border-border bg-surface/95 p-4 shadow-xl backdrop-blur"
      >
        <div className="flex flex-wrap items-center gap-2">
          {items.map((item) => (
            <Button
              key={item.comparisonKey}
              size="sm"
              variant="secondary"
              aria-label={`حذف ${item.title} از مقایسه`}
              onPress={() => onRemove(item.comparisonKey)}
            >
              <span className="max-w-32 truncate">{item.title}</span>
              <X size={13} />
            </Button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button
            className="flex-1"
            isDisabled={items.length < 2}
            onPress={() => setOpen(true)}
          >
            <Columns3 size={17} />
            مقایسه {items.length.toLocaleString("fa-IR")} گزینه
          </Button>
          <Button size="sm" variant="ghost" onPress={onClear}>
            پاک‌کردن
          </Button>
        </div>
      </aside>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="انتخابی که به تو می‌آید"
        snapPoints={[0.9]}
      >
        <div className="space-y-5">
          <Switch isSelected={differences} onChange={setDifferences}>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Content>فقط تفاوت‌ها</Switch.Content>
          </Switch>
          <p className="text-xs leading-6 text-muted">
            قیمت هر گزینه با واحد خودش نمایش داده شده؛ مبلغ دوره با مبلغ یک جلسه
            برابر نیست. این اطلاعات مربوط به زمان انتخاب است؛ ظرفیت و شرایط
            نهایی را در جزئیات بررسی کن.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] border-separate border-spacing-2 text-right text-sm">
              <caption className="sr-only">مقایسه گزینه‌های انتخاب‌شده</caption>
              <thead>
                <tr>
                  <th className="w-24">ویژگی</th>
                  {items.map((item) => (
                    <th
                      key={item.comparisonKey}
                      className="min-w-40 rounded-xl bg-surface-secondary p-3"
                    >
                      {item.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th className="p-2 align-top text-xs text-muted">
                      {row.label}
                    </th>
                    {row.values.map((value, index) => (
                      <td
                        key={items[index]!.comparisonKey}
                        className="rounded-xl bg-surface-secondary/60 p-3 align-top text-xs leading-7"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th className="sr-only">جزئیات</th>
                  {items.map((item) => (
                    <td key={item.comparisonKey}>
                      <Link
                        href={item.href}
                        className="flex min-h-11 items-center justify-center rounded-xl bg-accent px-3 text-xs font-bold text-accent-foreground"
                      >
                        بررسی و رزرو
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
