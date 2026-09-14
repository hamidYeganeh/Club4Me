"use client";
import {
  usePublicCatalogResource,
  type PublicCatalogParams,
} from "@api/discovery";
import { DiscoveryFilterSheet } from "./DiscoveryFilterSheet";
import { useArticleCategories } from "@api";
import { Button } from "@heroui/react";

export function DiscoveryCatalogFilters({
  kind,
  value,
  onChange,
  resultCount,
}: {
  kind: "class" | "coach" | "article";
  value: PublicCatalogParams;
  resultCount?: number;
  onChange: (value: PublicCatalogParams) => void;
}) {
  const activeCount = Object.values(value).filter(
    (item) => item !== undefined && item !== "",
  ).length;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DiscoveryFilterSheet
        activeCount={activeCount}
        resultCount={resultCount}
        title={
          kind === "article"
            ? "فیلتر مقاله‌ها"
            : kind === "coach"
              ? "فیلتر مربی‌ها"
              : "فیلتر کلاس‌ها"
        }
      >
        <Fields kind={kind} value={value} onChange={onChange} />
      </DiscoveryFilterSheet>
      {activeCount > 0 ? (
        <Button size="sm" variant="ghost" onPress={() => onChange({})}>
          پاک‌کردن فیلترها
        </Button>
      ) : null}
    </div>
  );
}
function Fields({
  kind,
  value,
  onChange,
}: {
  kind: "class" | "coach" | "article";
  value: PublicCatalogParams;
  onChange: (value: PublicCatalogParams) => void;
}) {
  const sports = usePublicCatalogResource(
    "sports",
    "sport",
    { limit: 100 },
    kind !== "article",
  );
  const categories = useArticleCategories(kind === "article");
  const field =
    "mt-2 min-h-12 w-full rounded-2xl border border-border bg-surface-secondary px-4 text-foreground";
  return (
    <>
      {kind === "coach" && (
        <label className="block text-sm">
          مرتب‌سازی
          <select
            className={field}
            value={value.sort ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                sort: (e.target.value ||
                  undefined) as PublicCatalogParams["sort"],
              })
            }
          >
            <option value="">پیشنهادی</option>
            <option value="newest">جدیدترین</option>
            <option value="rating">بالاترین امتیاز</option>
          </select>
        </label>
      )}
      {kind === "article" && (
        <label className="block text-sm">
          موضوع مقاله
          <select
            className={field}
            value={value.categoryId ?? ""}
            onChange={(e) =>
              onChange({ ...value, categoryId: e.target.value || undefined })
            }
          >
            <option value="">همه موضوع‌ها</option>
            {categories.data?.items.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {kind !== "article" && (
        <>
          <label className="block text-sm">
            رشته ورزشی
            <select
              className={field}
              value={value.sportId ?? ""}
              onChange={(e) =>
                onChange({ ...value, sportId: e.target.value || undefined })
              }
            >
              <option value="">همه رشته‌ها</option>
              {sports.data?.items.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            شیوه برگزاری
            <select
              className={field}
              value={value.serviceMode ?? ""}
              onChange={(e) =>
                onChange({ ...value, serviceMode: e.target.value || undefined })
              }
            >
              <option value="">همه</option>
              <option value="online">آنلاین</option>
              <option value="club">حضوری</option>
            </select>
          </label>
        </>
      )}
      {kind === "class" && (
        <>
          <label className="block text-sm">
            حداکثر شهریه (ریال)
            <input
              type="number"
              min="0"
              className={field}
              value={value.maxPrice ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  maxPrice:
                    e.target.value === ""
                      ? undefined
                      : Math.max(0, Number(e.target.value)),
                })
              }
            />
          </label>
          <label className="block text-sm">
            شروع دوره از
            <input
              type="date"
              className={field}
              value={value.startsFrom ?? ""}
              onChange={(e) =>
                onChange({ ...value, startsFrom: e.target.value || undefined })
              }
            />
          </label>
        </>
      )}
      <Button variant="secondary" onPress={() => onChange({})}>
        پاک‌کردن فیلترها
      </Button>
    </>
  );
}
