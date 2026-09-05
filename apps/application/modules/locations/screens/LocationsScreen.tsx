"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSetDefaultUserLocation, useUserLocations, type UserLocation } from "@api/locations";
import { Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { BottomSheet } from "@/components/motion/bottom-sheet";
import { LocationCardsSkeleton } from "@/components/loading-skeletons";

export function LocationsScreen({ role }: { role: "athlete" | "coach" }) {
  const router = useRouter();
  const locations = useUserLocations();
  const setDefault = useSetDefaultUserLocation();
  const items = locations.data?.items ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);

  const close = () => router.push(`/${role}/profile`);
  const effectiveSelectedId =
    selectedId ?? items.find((location) => location.isDefault)?.id ?? items[0]?.id;
  const selected = items.find((location) => location.id === effectiveSelectedId);

  async function updateLocation() {
    if (!selected || setDefault.isPending) return;
    setSaveError(false);
    try {
      if (!selected.isDefault) await setDefault.mutateAsync(selected.id);
      close();
    } catch {
      setSaveError(true);
    }
  }

  return (
    <main className="min-h-dvh bg-background">
      <BottomSheet
        open
        onOpenChange={(open) => !open && close()}
        snapPoints={["auto"]}
        title="لوکیشن‌های من"
        description="موقعیت پیش‌فرض خود را برای نمایش باشگاه‌های نزدیک انتخاب کنید."
        className="max-h-[88dvh]"
      >
        <button
          type="button"
          onClick={close}
          aria-label="بستن"
          className="absolute end-5 top-6 flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-secondary hover:text-foreground active:scale-95"
        >
          <Icon name="close-x" size={24} />
        </button>

        <div className="flex flex-col gap-3 pt-4">
          {locations.isLoading ? (
            <LocationCardsSkeleton count={2} />
          ) : locations.isError ? (
            <div className="rounded-[1.5rem] bg-danger/10 p-5 text-center">
              <Typography type="body-sm" className="text-danger">دریافت لوکیشن‌ها ناموفق بود.</Typography>
              <button type="button" onClick={() => void locations.refetch()} className="mt-3 rounded-xl bg-surface-secondary px-4 py-2 text-sm font-bold">
                تلاش دوباره
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[1.5rem] bg-surface-secondary/70 px-5 py-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-accent/12 text-accent"><Icon name="map-pin-1" size={26} /></span>
              <Typography type="body" weight="bold">هنوز لوکیشنی ذخیره نکرده‌اید</Typography>
              <Typography type="body-sm" color="muted">خانه، محل کار یا باشگاه همیشگی‌تان را اضافه کنید.</Typography>
            </div>
          ) : (
            <div role="radiogroup" aria-label="انتخاب لوکیشن پیش‌فرض" className="flex flex-col gap-3">
              {items.map((location) => (
                <LocationOption
                  key={location.id}
                  location={location}
                  selected={location.id === effectiveSelectedId}
                  onSelect={() => setSelectedId(location.id)}
                  editHref={`/${role}/profile/locations/${location.id}/edit`}
                />
              ))}
            </div>
          )}
        </div>

        {items.length < 5 ? (
          <Link href={`/${role}/profile/locations/new`} className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl font-bold text-accent transition-colors hover:bg-accent/8 active:bg-accent/12">
            افزودن لوکیشن جدید <Icon name="plus" size={20} />
          </Link>
        ) : (
          <Typography type="body-xs" color="muted" align="center" className="mt-5">حداکثر ۵ لوکیشن قابل ذخیره است.</Typography>
        )}

        {saveError ? <Typography type="body-sm" align="center" className="mt-3 text-danger">به‌روزرسانی لوکیشن ناموفق بود. دوباره تلاش کنید.</Typography> : null}

        <button
          type="button"
          onClick={() => void updateLocation()}
          disabled={!selected || locations.isLoading || setDefault.isPending}
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[1.15rem] bg-accent font-bold text-accent-foreground shadow-[0_12px_30px_color-mix(in_oklch,var(--accent)_22%,transparent)] transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {setDefault.isPending ? "در حال به‌روزرسانی..." : "به‌روزرسانی"}
          {!setDefault.isPending ? <Icon name="check" size={20} /> : null}
        </button>
      </BottomSheet>
    </main>
  );
}

function LocationOption({ location, selected, onSelect, editHref }: { location: UserLocation; selected: boolean; onSelect: () => void; editHref: string }) {
  return (
    <div className={`relative flex min-h-28 items-center gap-4 rounded-[1.5rem] border p-4 transition-[border-color,background-color,transform,box-shadow] active:scale-[0.99] ${selected ? "border-accent bg-accent/7 shadow-[0_8px_24px_color-mix(in_oklch,var(--accent)_10%,transparent)]" : "border-border bg-surface-secondary/55"}`}>
      <button type="button" role="radio" aria-checked={selected} onClick={onSelect} className="absolute inset-0 rounded-[1.5rem]" aria-label={`${location.title}، ${location.address}`} />
      <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${selected ? "bg-accent/12 text-accent" : "bg-surface text-muted"}`}><Icon name="map-pin-1" size={24} /></span>
      <div className="min-w-0 flex-1">
        <Typography type="body" weight="bold" className="truncate">{location.title}</Typography>
        <Typography type="body-sm" color="muted" className="mt-1 line-clamp-2 leading-6">{location.address}</Typography>
        <Link href={editHref} className="relative z-10 mt-1 inline-block text-xs font-semibold text-accent">ویرایش</Link>
      </div>
      <span aria-hidden className={`flex size-7 shrink-0 items-center justify-center rounded-lg border ${selected ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface"}`}>
        {selected ? <Icon name="check" size={16} /> : null}
      </span>
    </div>
  );
}
