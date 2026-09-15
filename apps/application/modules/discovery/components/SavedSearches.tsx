"use client";
import { useState } from "react";
import { Bell, Bookmark, Trash2 } from "lucide-react";
import { Button, InputGroup, Switch } from "@heroui/react";
import { useAccountMe } from "@api";
import {
  useSavedSearches,
  useSaveSearch,
  useRemoveSavedSearch,
} from "@api/domains/discovery/saved-searches";
import Link from "@/components/app-link";
import { BottomSheet } from "@/components/motion/bottom-sheet";

const filterKeys = [
  "q",
  "kind",
  "minPrice",
  "maxPrice",
  "latitude",
  "longitude",
  "radiusKm",
  "skillLevelId",
  "cityId",
  "districtId",
  "cityRegionId",
  "sportId",
  "clubTypeId",
  "amenityId",
  "equipmentId",
  "coachId",
  "clubId",
  "categoryId",
  "sort",

  "serviceMode",
  "admission",
  "startsFrom",
  "startsTo",
  "timeFrom",
  "timeTo",
];
export function SavedSearches({ canSave }: { canSave: boolean }) {
  const account = useAccountMe();
  const saved = useSavedSearches(Boolean(account.data));
  const save = useSaveSearch();
  const remove = useRemoveSavedSearch();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [alerts, setAlerts] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  if (!account.data)
    return canSave ? (
      <Link href="/auth/login" className="text-sm text-accent">
        برای ذخیره جست‌وجو وارد شو
      </Link>
    ) : null;
  return (
    <section aria-label="جست‌وجوهای ذخیره‌شده" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold">جست‌وجوهای من</h2>
        {canSave && (
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              const params = new URLSearchParams(window.location.search);
              setFilters(
                Object.fromEntries(
                  filterKeys.flatMap((key) =>
                    params.has(key) ? [[key, params.get(key)!]] : [],
                  ),
                ),
              );
              setTitle(params.get("q") || "جست‌وجوی من");
              save.reset();
              setMessage("");
              setOpen(true);
            }}
          >
            <Bookmark size={16} /> ذخیره این جست‌وجو
          </Button>
        )}
      </div>
      {saved.isPending ? (
        <p role="status" className="text-xs text-muted">
          در حال دریافت جست‌وجوها…
        </p>
      ) : saved.isError ? (
        <Button size="sm" variant="ghost" onPress={() => void saved.refetch()}>
          دریافت جست‌وجوها ناموفق بود؛ تلاش دوباره
        </Button>
      ) : saved.data?.items.length ? (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {saved.data.items.map((item) => (
            <div
              key={item.id}
              className="flex shrink-0 items-center gap-1 rounded-2xl border border-border bg-surface px-3"
            >
              <Link
                href={`/discovery/search?${new URLSearchParams({ ...item.filters, nearby: item.filters.latitude ? "1" : "0" })}`}
                className="flex min-h-11 items-center gap-2 text-xs font-medium"
              >
                {item.alerts ? (
                  <Bell size={14} className="text-accent" />
                ) : (
                  <Bookmark size={14} />
                )}
                {item.title}
              </Link>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label={`حذف جست‌وجوی ${item.title}`}
                isDisabled={remove.isPending}
                onPress={() => remove.mutate(item.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs leading-6 text-muted">
          شرایط دلخواهت را نگه دار و از گزینه‌های تازه باخبر شو.
        </p>
      )}
      {remove.isError && (
        <p role="alert" className="text-sm text-danger">
          حذف انجام نشد؛ دوباره امتحان کن.
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-accent">
          {message}
        </p>
      )}
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="همین شرایط را برایم نگه دار"
        snapPoints={[0.6]}
      >
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await save.mutateAsync({ title: title.trim(), alerts, filters });
              setOpen(false);
              setMessage("جست‌وجویت ذخیره شد.");
            } catch {
              /* Error remains next to the preserved form. */
            }
          }}
        >
          <label className="grid gap-2 text-sm">
            نام جست‌وجو
            <InputGroup className="mt-2 w-full" variant="secondary">
              <InputGroup.Input
                aria-label="نام جست‌وجو"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={80}
                required
              />
            </InputGroup>
          </label>
          <Switch isSelected={alerts} onChange={setAlerts}>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Content>گزینه‌های تازه را خبر بده</Switch.Content>
          </Switch>
          <p className="text-xs leading-6 text-muted">
            بودجه، زمان و محدوده انتخابی ذخیره می‌شوند. گزینه‌های تازه هر ۱۵
            دقیقه در میان جدیدترین نتایج بررسی می‌شوند؛ موجودبودن ظرفیت هنگام
            رزرو دوباره کنترل می‌شود.
          </p>
          {save.isError && (
            <p role="alert" className="text-sm text-danger">
              ذخیره نشد؛ شرایط جست‌وجو را بررسی کن و دوباره امتحان کن.
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            isPending={save.isPending}
            isDisabled={!title.trim()}
          >
            ذخیره جست‌وجو
          </Button>
        </form>
      </BottomSheet>
    </section>
  );
}
