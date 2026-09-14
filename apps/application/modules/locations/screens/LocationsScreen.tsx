"use client";
import { useRecordBrowser } from "@/components/record-browser";

import Link from "@/components/app-link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useDeleteUserLocation,
  useSetDefaultUserLocation,
  useUserLocations,
  type UserLocation,
} from "@api/locations";
import { Button, toast, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { LocationCardsSkeleton } from "@/components/loading-skeletons";

export function LocationsScreen({ role }: { role: "athlete" | "coach" }) {
  const router = useRouter();
  const locations = useUserLocations();
  const setDefault = useSetDefaultUserLocation();
  const deleteLocation = useDeleteUserLocation();
  const items = locations.data?.items ?? [];
  const browser = useRecordBrowser(items, {
    label: "موقعیت‌ها",
    text: (item) => `${item.title} ${item.address ?? ""}`,
    status: (item) => (item.isDefault ? "default" : "other"),
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);

  const close = () => router.push(`/${role}/profile`);
  const effectiveSelectedId =
    selectedId ??
    items.find((location) => location.isDefault)?.id ??
    items[0]?.id;
  const selected = items.find(
    (location) => location.id === effectiveSelectedId,
  );

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

  async function removeLocation(location: UserLocation) {
    if (!window.confirm(`لوکیشن «${location.title}» حذف شود؟`)) return;
    try {
      await deleteLocation.mutateAsync(location.id);
      if (selectedId === location.id) setSelectedId(null);
      toast.success("لوکیشن حذف شد");
    } catch {
      toast.danger("حذف لوکیشن انجام نشد");
    }
  }

  return (
    <main className="app-page gap-5">
      <SecondaryHeader
        title="لوکیشن‌های من"
        showFilter={false}
        backHref={`/${role}/profile`}
      />
      <div className="space-y-2">
        <p className="text-sm leading-7 text-muted">
          یک لوکیشن را انتخاب کن تا پیشنهادهای نزدیک به آن را ببینی.
        </p>
        {locations.isSuccess ? (
          <p className="text-xs text-muted">
            {items.length.toLocaleString("fa-IR")} از ۵ لوکیشن ذخیره شده
          </p>
        ) : null}
      </div>
      {items.length > 0 ? browser.controls : null}
      <section className="rounded-3xl bg-surface p-4">
        <div className="flex flex-col gap-3 pt-4">
          {locations.isLoading ? (
            <LocationCardsSkeleton count={2} />
          ) : locations.isError ? (
            <div className="rounded-[1.5rem] bg-danger/10 p-5 text-center">
              <Typography type="body-sm" className="text-danger">
                دریافت لوکیشن‌ها ناموفق بود.
              </Typography>
              <button
                type="button"
                onClick={() => void locations.refetch()}
                className="mt-3 rounded-xl bg-surface-secondary px-4 py-2 text-sm font-bold"
              >
                تلاش دوباره
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[1.5rem] bg-surface-secondary/70 px-5 py-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-accent/12 text-accent">
                <Icon name="map-pin-1" size={26} />
              </span>
              <Typography type="body" weight="bold">
                هنوز لوکیشنی ذخیره نکرده‌اید
              </Typography>
              <Typography type="body-sm" color="muted">
                خانه، محل کار یا باشگاه همیشگی‌تان را اضافه کنید.
              </Typography>
            </div>
          ) : browser.items.length === 0 ? (
            <div className="space-y-3 py-8 text-center">
              <p className="font-bold">لوکیشنی پیدا نشد</p>
              <p className="text-sm text-muted">
                نام یا آدرس دیگری را جست‌وجو کن یا فیلترها را پاک کن.
              </p>
              <Button variant="secondary" onPress={browser.reset}>
                پاک‌کردن جست‌وجو و فیلترها
              </Button>
            </div>
          ) : (
            <div
              role="radiogroup"
              aria-label="انتخاب لوکیشن پیش‌فرض"
              className="flex flex-col gap-3"
            >
              {browser.items.map((location) => (
                <LocationOption
                  key={location.id}
                  location={location}
                  selected={location.id === effectiveSelectedId}
                  onSelect={() => setSelectedId(location.id)}
                  editHref={`/${role}/profile/locations/${location.id}/edit`}
                  onDelete={() => void removeLocation(location)}
                  deleting={deleteLocation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {locations.isSuccess && items.length < 5 ? (
          <Link
            href={`/${role}/profile/locations/new`}
            className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl font-bold text-accent transition-colors hover:bg-accent/8 active:bg-accent/12"
          >
            افزودن لوکیشن جدید <Icon name="plus" size={20} />
          </Link>
        ) : locations.isSuccess ? (
          <Typography
            type="body-xs"
            color="muted"
            align="center"
            className="mt-5"
          >
            حداکثر ۵ لوکیشن قابل ذخیره است.
          </Typography>
        ) : null}

        {saveError ? (
          <Typography
            type="body-sm"
            align="center"
            className="mt-3 text-danger"
          >
            به‌روزرسانی لوکیشن ناموفق بود. دوباره تلاش کنید.
          </Typography>
        ) : null}

        <button
          type="button"
          onClick={() => void updateLocation()}
          disabled={
            !selected ||
            !locations.isSuccess ||
            setDefault.isPending ||
            deleteLocation.isPending
          }
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[1.15rem] bg-accent font-bold text-accent-foreground transition-transform disabled:opacity-50"
        >
          {setDefault.isPending
            ? "در حال به‌روزرسانی..."
            : "تأیید لوکیشن انتخاب‌شده"}
          {!setDefault.isPending ? <Icon name="check" size={20} /> : null}
        </button>
      </section>
    </main>
  );
}

function LocationOption({
  location,
  selected,
  onSelect,
  editHref,
  onDelete,
  deleting,
}: {
  location: UserLocation;
  selected: boolean;
  onSelect: () => void;
  editHref: string;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div
      className={`relative has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus flex min-h-28 items-center gap-4 rounded-[1.5rem] p-4 transition-[border-color,background-color,transform,box-shadow] ${selected ? "bg-accent/7" : "bg-surface-secondary/55"}`}
    >
      <input
        type="radio"
        name="default-location"
        value={location.id}
        checked={selected}
        onChange={onSelect}
        aria-label={`${location.title}، ${location.address}`}
        className="absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0"
      />
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${selected ? "bg-accent/12 text-accent" : "bg-surface text-muted"}`}
      >
        <Icon name="map-pin-1" size={24} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold">{location.title}</p>
        {location.isDefault ? (
          <span className="text-xs font-semibold text-accent">
            پیش‌فرض فعلی
          </span>
        ) : null}
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">
          {location.address}
        </p>
        <div className="relative z-20 mt-1 flex gap-3 text-xs font-semibold">
          <Link
            href={editHref}
            className="inline-flex min-h-11 items-center rounded-lg px-2 text-accent focus-visible:ring-2 focus-visible:ring-focus"
          >
            ویرایش
          </Link>
          <button
            type="button"
            disabled={deleting}
            onClick={onDelete}
            className="inline-flex min-h-11 items-center rounded-lg px-2 text-danger focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
          >
            حذف
          </button>
        </div>
      </div>
      <span
        aria-hidden
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-accent text-accent-foreground" : "bg-surface"}`}
      >
        {selected ? <Icon name="check" size={16} /> : null}
      </span>
    </div>
  );
}
