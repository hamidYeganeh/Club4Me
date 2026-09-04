"use client";

import Link from "next/link";
import {
  useDeleteUserLocation,
  useSetDefaultUserLocation,
  useUserLocations,
} from "@api/locations";
import { Typography } from "@heroui/react";
import { Icon } from "@theme/icon";

export function LocationsScreen({ role }: { role: "athlete" | "coach" }) {
  const locations = useUserLocations();
  const remove = useDeleteUserLocation();
  const setDefault = useSetDefaultUserLocation();
  const items = locations.data?.items ?? [];

  return (
    <main className="app-page">
      <header className="app-header justify-between">
        <Link
          href={`/${role}/profile`}
          className="app-icon-button"
          aria-label="بازگشت"
        >
          <Icon name="chevron-right" size={20} />
        </Link>
        <Typography type="h4">لوکیشن‌های من</Typography>
        <span className="size-11" />
      </header>
      <div aria-hidden className="app-header-spacer mb-6" />

      {locations.isLoading ? (
        <Typography type="body" color="muted" align="center" className="py-16">
          در حال بارگذاری...
        </Typography>
      ) : locations.isError ? (
        <div className="py-16 text-center">
          <Typography type="body-sm" className="mb-4 text-danger">
            دریافت لوکیشن‌ها ناموفق بود.
          </Typography>
          <button
            type="button"
            onClick={() => void locations.refetch()}
            className="rounded-xl bg-foreground px-4 py-2 text-background"
          >
            تلاش دوباره
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-surface-secondary">
            <Icon name="map-pin-1" size="lg" />
          </span>
          <Typography type="body" weight="bold">
            هنوز لوکیشنی ذخیره نکرده‌اید
          </Typography>
          <Typography
            type="body-sm"
            color="muted"
            align="center"
            className="max-w-64 leading-6"
          >
            خانه، محل کار یا باشگاه همیشگی‌تان را اضافه کنید.
          </Typography>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((location) => (
            <article key={location.id} className="app-card app-stack-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Typography type="h6">{location.title}</Typography>
                    {location.isDefault ? (
                      <span className="rounded-full bg-accent px-2 py-1 text-[11px] font-bold text-accent-foreground">
                        پیش‌فرض
                      </span>
                    ) : null}
                  </div>
                  <Typography
                    type="body-sm"
                    color="muted"
                    className="mt-2 line-clamp-2 leading-6"
                  >
                    {location.address}
                  </Typography>
                </div>
                <Icon name="map-pin-1" size={20} className="shrink-0" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3 text-sm">
                <Link
                  href={`/${role}/profile/locations/${location.id}/edit`}
                  className="rounded-xl bg-surface-secondary px-3 py-2"
                >
                  ویرایش
                </Link>
                {!location.isDefault ? (
                  <button
                    type="button"
                    disabled={setDefault.isPending}
                    onClick={() => setDefault.mutate(location.id)}
                    className="rounded-xl bg-surface-secondary px-3 py-2 disabled:opacity-50"
                  >
                    انتخاب به‌عنوان پیش‌فرض
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (window.confirm("این لوکیشن حذف شود؟")) {
                      remove.mutate(location.id);
                    }
                  }}
                  className="rounded-xl px-3 py-2 text-danger disabled:opacity-50"
                >
                  حذف
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {items.length < 5 ? (
        <Link
          href={`/${role}/profile/locations/new`}
          className="mt-6 flex h-13 items-center justify-center gap-2 rounded-[1.15rem] bg-accent font-bold text-accent-foreground shadow-[0_12px_30px_color-mix(in_oklch,var(--accent)_22%,transparent)] transition-transform active:scale-[0.98]"
        >
          <Icon name="plus" size={18} /> افزودن لوکیشن
        </Link>
      ) : (
        <Typography
          type="body-sm"
          color="muted"
          align="center"
          className="mt-5"
        >
          حداکثر ۵ لوکیشن قابل ذخیره است.
        </Typography>
      )}
    </main>
  );
}
