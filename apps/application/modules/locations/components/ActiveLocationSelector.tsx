"use client";

import { useState } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { useUserLocations } from "@api/locations";
import { Icon } from "@theme/icon";

import { Typography } from "@heroui/react";
import { useActiveLocation } from "../active-location";

export function ActiveLocationSelector() {
  const locations = useUserLocations();
  const { active, selectGps, selectSaved } = useActiveLocation();
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const title =
    active?.kind === "saved"
      ? active.location.title
      : (active?.title ?? "انتخاب لوکیشن");

  async function useCurrentLocation() {
    setLocating(true);
    setGpsError(false);
    try {
      // This explicit click is the only point where GPS permission is requested.
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 30_000,
      });
      selectGps(position.coords.latitude, position.coords.longitude);
      setOpen(false);
    } catch {
      setGpsError(true);
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex max-w-44 items-center gap-1.5 rounded-full bg-surface-secondary px-3 py-2 text-sm font-semibold text-foreground"
      >
        <Icon name="map-pin-1" size={16} />
        <span className="truncate">{title}</span>
        <Icon name="chevron-down" size={14} />
      </button>

      {open ? (
        <div className="absolute start-0 top-full z-30 mt-2 w-64 rounded-2xl border border-border bg-surface p-2 shadow-xl">
          <button
            type="button"
            disabled={locating}
            onClick={() => void useCurrentLocation()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-start text-sm hover:bg-surface-secondary disabled:opacity-50"
          >
            <Icon name="compass" size={18} />
            {locating ? "در حال دریافت موقعیت..." : "موقعیت فعلی من"}
          </button>
          {gpsError ? (
            <Typography type="body-xs" className="px-3 pb-2 text-danger">
              دسترسی موقعیت ممکن نشد. مجوز GPS را بررسی کنید.
            </Typography>
          ) : null}
          {(locations.data?.items ?? []).map((location) => (
            <button
              key={location.id}
              type="button"
              onClick={() => {
                selectSaved(location);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-start text-sm hover:bg-surface-secondary"
            >
              <span className="truncate">{location.title}</span>
              {location.isDefault ? (
                <Typography type="body-xs" color="muted">پیش‌فرض</Typography>
              ) : null}
            </button>
          ))}
          {locations.isError ? (
            <button
              type="button"
              onClick={() => void locations.refetch()}
              className="w-full rounded-xl px-3 py-2 text-sm text-danger"
            >
              تلاش دوباره
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
