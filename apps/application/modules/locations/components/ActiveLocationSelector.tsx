"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { useUserLocations } from "@api/locations";
import { Typography } from "@heroui/react";
import { Icon } from "@theme/icon";

import { BottomSheet } from "@/components/motion/bottom-sheet";
import { RequestFailureState } from "@/components/request-failure-state";
import { LocationCardsSkeleton } from "@/components/loading-skeletons";
import { getQueryFailure } from "@/lib/request-failure";
import { useActiveLocation } from "../active-location";

export function ActiveLocationSelector({
  variant = "compact",
  onSelect,
}: {
  variant?: "compact" | "search";
  onSelect?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const locations = useUserLocations(open);
  const { active, selectSaved } = useActiveLocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const items = locations.data?.items ?? [];
  const failure = getQueryFailure(locations.error, locations.fetchStatus);
  const title =
    active?.kind === "saved"
      ? active.location.title
      : (active?.title ?? "انتخاب موقعیت");
  const effectiveSelectedId =
    selectedId ??
    (active?.kind === "saved" ? active.location.id : undefined) ??
    items.find((location) => location.isDefault)?.id ??
    items[0]?.id;
  const selected = items.find(
    (location) => location.id === effectiveSelectedId,
  );

  function close() {
    setOpen(false);
    setSelectedId(null);
  }

  function updateLocation() {
    if (!selected) return;
    selectSaved(selected);
    onSelect?.();
    close();
  }

  return (
    <div className={variant === "search" ? "w-full" : ""}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={
          variant === "search"
            ? "flex h-16 w-full items-center gap-3 rounded-[1.15rem] border border-border bg-surface px-5 text-base font-semibold text-foreground shadow-sm"
            : "flex max-w-52 items-center gap-2 rounded-full bg-surface-secondary px-4 py-2.5 text-sm font-semibold text-foreground"
        }
      >
        <Icon
          name="map-pin-1"
          size={variant === "search" ? 22 : 16}
          className={variant === "search" ? "text-accent" : undefined}
        />
        <span className="truncate">{title}</span>
        <Icon name="chevron-down" size={14} className="ms-auto" />
      </button>

      <BottomSheet
        open={open}
        onOpenChange={(nextOpen) => !nextOpen && close()}
        snapPoints={["auto"]}
        title="لوکیشن‌های من"
        description="موقعیت خود را برای نمایش باشگاه‌های نزدیک انتخاب کنید."
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

        <div
          role="radiogroup"
          aria-label="انتخاب لوکیشن"
          className="flex flex-col gap-3 pt-4"
        >
          {locations.isLoading && !failure ? (
            <LocationCardsSkeleton count={2} />
          ) : failure ? (
            <RequestFailureState
              compact
              error={failure}
              onRetry={() => void locations.refetch()}
            />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[1.5rem] bg-surface-secondary/70 px-5 py-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-accent/12 text-accent">
                <Icon name="map-pin-1" size={26} />
              </span>
              <Typography type="body" weight="bold">
                هنوز لوکیشنی ذخیره نکرده‌اید
              </Typography>
            </div>
          ) : (
            items.map((location) => {
              const isSelected = location.id === effectiveSelectedId;
              return (
                <button
                  key={location.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedId(location.id)}
                  className={`flex min-h-28 items-center gap-4 rounded-[1.5rem] border p-4 text-start transition-[border-color,background-color,transform,box-shadow] active:scale-[0.99] ${
                    isSelected
                      ? "border-accent bg-accent/7"
                      : "border-border bg-surface-secondary/55"
                  }`}
                >
                  <span
                    className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${isSelected ? "bg-accent/12 text-accent" : "bg-surface text-muted"}`}
                  >
                    <Icon name="map-pin-1" size={24} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">
                      {location.title}
                    </span>
                    <span className="mt-1 line-clamp-2 text-sm leading-6 text-muted">
                      {location.address}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg border ${isSelected ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface"}`}
                  >
                    {isSelected ? <Icon name="check" size={16} /> : null}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {items.length < 5 ? (
          <Link
            href="/athlete/profile/locations/new"
            onClick={close}
            className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl font-bold text-accent transition-colors hover:bg-accent/8 active:bg-accent/12"
          >
            افزودن لوکیشن جدید <Icon name="plus" size={20} />
          </Link>
        ) : null}

        <button
          type="button"
          onClick={updateLocation}
          disabled={!selected || locations.isLoading}
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[1.15rem] bg-accent font-bold text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          به‌روزرسانی <Icon name="check" size={20} />
        </button>
      </BottomSheet>
    </div>
  );
}
