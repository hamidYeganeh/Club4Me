"use client";
import { FormSelect, FormOption } from "@repo/ui/form-select";
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
          <FormSelect
            className={field}
            value={value.sort ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                sort: (e || undefined) as PublicCatalogParams["sort"],
              })
            }
          >
            <FormOption value="">پیشنهادی</FormOption>
            <FormOption value="newest">جدیدترین</FormOption>
            <FormOption value="rating">بالاترین امتیاز</FormOption>
          </FormSelect>
        </label>
      )}
      {kind === "article" && (
        <label className="block text-sm">
          موضوع مقاله
          <FormSelect
            className={field}
            value={value.categoryId ?? ""}
            onChange={(e) => onChange({ ...value, categoryId: e || undefined })}
          >
            <FormOption value="">همه موضوع‌ها</FormOption>
            {categories.data?.items.map((category) => (
              <FormOption key={category.id} value={category.id}>
                {category.name}
              </FormOption>
            ))}
          </FormSelect>
        </label>
      )}
      {kind !== "article" && (
        <>
          <label className="block text-sm">
            رشته ورزشی
            <FormSelect
              className={field}
              value={value.sportId ?? ""}
              onChange={(e) => onChange({ ...value, sportId: e || undefined })}
            >
              <FormOption value="">همه رشته‌ها</FormOption>
              {sports.data?.items.map((sport) => (
                <FormOption key={sport.id} value={sport.id}>
                  {sport.name}
                </FormOption>
              ))}
            </FormSelect>
          </label>
          <label className="block text-sm">
            شیوه برگزاری
            <FormSelect
              className={field}
              value={value.serviceMode ?? ""}
              onChange={(e) =>
                onChange({ ...value, serviceMode: e || undefined })
              }
            >
              <FormOption value="">همه</FormOption>
              <FormOption value="online">آنلاین</FormOption>
              <FormOption value="club">حضوری</FormOption>
            </FormSelect>
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
