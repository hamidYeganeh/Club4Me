"use client";

import { useEffect, useRef, useState } from "react";
import { Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { getCurrentPosition } from "@/lib/native-geolocation";

import type { Map as NeshanMapInstance } from "@neshan-maps-platform/maplibre-sdk";

const NESHAN_LIGHT_STYLE =
  "https://static.neshan.org/sdk/maplibre/styles/light.json";

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

type NeshanMapProps = {
  center: GeoPoint;
  className?: string;
  marker?: GeoPoint;
  markerLabel?: string;
  zoom?: number;
  onPointChange?: (point: GeoPoint) => void;
};

type RemovableMarker = {
  remove: () => void;
};

export function NeshanMap({
  center,
  className,
  marker,
  markerLabel,
  zoom = 14,
  onPointChange,
}: NeshanMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NeshanMapInstance | null>(null);
  const userMarkerRef = useRef<RemovableMarker | null>(null);
  const [mapError, setMapError] = useState(false);
  const [locating, setLocating] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_NESHAN_MAP_KEY?.trim();
  const markerLatitude = marker?.latitude;
  const markerLongitude = marker?.longitude;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !apiKey) {
      return;
    }

    let disposed = false;
    let locationMarker: RemovableMarker | null = null;

    void import("@neshan-maps-platform/maplibre-sdk")
      .then(({ default: maplibregl }) => {
        if (disposed) {
          return;
        }

        const map = new maplibregl.Map({
          apiKey,
          center: [center.longitude, center.latitude],
          container,
          copyRightPosition: "bottom-left",
          logoPosition: "bottom-right",
          maxZoom: 21,
          minZoom: 3,
          rtl: { lazy: false },
          style: NESHAN_LIGHT_STYLE,
          trackResize: true,
          zoom,
        });

        mapRef.current = map;
        map.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          "top-left",
        );

        if (markerLatitude !== undefined && markerLongitude !== undefined) {
          const nextLocationMarker = new maplibregl.Marker({ color: "#121212" })
            .setLngLat([markerLongitude, markerLatitude])
            .addTo(map);

          if (markerLabel) {
            nextLocationMarker.setPopup(
              new maplibregl.Popup({ offset: 20 }).setText(markerLabel),
            );
          }

          locationMarker = nextLocationMarker;
        }

        if (onPointChange) {
          map.on("click", (event) => {
            const point = {
              latitude: event.lngLat.lat,
              longitude: event.lngLat.lng,
            };
            onPointChange(point);
          });
        }

        map.once("error", () => setMapError(true));
      })
      .catch(() => setMapError(true));

    return () => {
      disposed = true;
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      locationMarker?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [
    apiKey,
    center.latitude,
    center.longitude,
    markerLatitude,
    markerLongitude,
    markerLabel,
    onPointChange,
    zoom,
  ]);

  async function locateUser() {
    const map = mapRef.current;
    if (!map || locating) {
      return;
    }

    setLocating(true);
    try {
      const position = await getCurrentPosition();
      const point: [number, number] = [
        position.coords.longitude,
        position.coords.latitude,
      ];
      const { default: maplibregl } =
        await import("@neshan-maps-platform/maplibre-sdk");

      userMarkerRef.current?.remove();
      userMarkerRef.current = new maplibregl.Marker({ color: "#c6ff4e" })
        .setLngLat(point)
        .addTo(map);
      map.flyTo({ center: point, essential: true, zoom: Math.max(zoom, 15) });
    } finally {
      setLocating(false);
    }
  }

  const unavailable = !apiKey || mapError;

  return (
    <div
      className={`relative isolate min-h-60 overflow-hidden rounded-[calc(var(--radius)*3)] bg-surface-secondary ${className ?? ""}`}
    >
      <div ref={containerRef} className="absolute inset-0" />

      {unavailable && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Icon name="map-pin-1" size="lg" />
          </span>
          <Typography type="body-sm" weight="semibold">
            نقشه در حال راه‌اندازی است
          </Typography>
          <Typography type="body-xs" color="muted" className="leading-5">
            کلید دسترسی نقشه نشان هنوز تنظیم نشده است.
          </Typography>
        </div>
      )}

      {!unavailable && (
        <button
          type="button"
          aria-label="نمایش موقعیت فعلی من"
          disabled={locating}
          onClick={() => void locateUser()}
          className="absolute bottom-4 right-4 z-10 flex size-11 items-center justify-center rounded-full border border-foreground/10 bg-background text-foreground shadow-lg transition-transform active:scale-95 disabled:opacity-50"
        >
          <Icon name="compass" size="lg" />
        </button>
      )}
    </div>
  );
}
