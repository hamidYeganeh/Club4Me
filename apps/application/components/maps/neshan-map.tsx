"use client";

import { useEffect, useRef, useState } from "react";
import { Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { useTheme } from "next-themes";
import { getCurrentPosition } from "@/lib/native-geolocation";
import { cn } from "@/lib/cn";

import type { Map as NeshanMapInstance } from "@neshan-maps-platform/maplibre-sdk";

const NESHAN_LIGHT_STYLE =
  "https://static.neshan.org/sdk/maplibre/styles/light.json";
const NESHAN_DARK_STYLE =
  "https://static.neshan.org/sdk/maplibre/styles/dark.json";
const MARKER_COLOR = "#121212";
const MARKER_SELECTED_COLOR = "#c6ff4e";
const USER_MARKER_COLOR = "#c6ff4e";

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type NeshanMapMarker = GeoPoint & {
  id: string;
  label?: string;
};

type NeshanSdk = typeof import("@neshan-maps-platform/maplibre-sdk").default;

type RemovableMarker = {
  addTo: (map: NeshanMapInstance) => RemovableMarker;
  getElement: () => HTMLElement;
  remove: () => void;
  setLngLat: (lngLat: [number, number]) => RemovableMarker;
  setPopup: (popup: unknown) => RemovableMarker;
};

type NeshanMapProps = {
  center: GeoPoint;
  className?: string;
  followCenter?: boolean;
  locateClassName?: string;
  marker?: GeoPoint;
  markerLabel?: string;
  markers?: NeshanMapMarker[];
  selectedMarkerId?: string;
  zoom?: number;
  onMarkerSelect?: (id: string) => void;
  onPointChange?: (point: GeoPoint) => void;
};

export function NeshanMap({
  center,
  className,
  followCenter = true,
  locateClassName,
  marker,
  markerLabel,
  markers,
  selectedMarkerId,
  zoom = 14,
  onMarkerSelect,
  onPointChange,
}: NeshanMapProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NeshanMapInstance | null>(null);
  const sdkRef = useRef<NeshanSdk | null>(null);
  const appliedMapStyleRef = useRef<string | null>(null);
  const locationMarkersRef = useRef<RemovableMarker[]>([]);
  const userMarkerRef = useRef<RemovableMarker | null>(null);
  const onMarkerSelectRef = useRef(onMarkerSelect);
  const onPointChangeRef = useRef(onPointChange);
  const skipNextFlyRef = useRef(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [locating, setLocating] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_NESHAN_MAP_KEY?.trim();
  const mapStyle =
    resolvedTheme === "light" ? NESHAN_LIGHT_STYLE : NESHAN_DARK_STYLE;

  useEffect(() => {
    onMarkerSelectRef.current = onMarkerSelect;
    onPointChangeRef.current = onPointChange;
  }, [onMarkerSelect, onPointChange]);

  const resolvedMarkers: NeshanMapMarker[] =
    markers ??
    (marker
      ? [
          {
            id: "location",
            latitude: marker.latitude,
            longitude: marker.longitude,
            label: markerLabel,
          },
        ]
      : []);
  const markersKey = resolvedMarkers
    .map(
      (entry) =>
        `${entry.id}:${entry.latitude}:${entry.longitude}:${entry.label ?? ""}`,
    )
    .join("|");

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !apiKey) {
      return;
    }

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

    void import("@neshan-maps-platform/maplibre-sdk")
      .then(({ default: maplibregl }) => {
        if (disposed || !container.isConnected) {
          return;
        }

        sdkRef.current = maplibregl;
        appliedMapStyleRef.current = mapStyle;
        const map = new maplibregl.Map({
          apiKey,
          center: [center.longitude, center.latitude],
          container,
          copyRightPosition: "bottom-left",
          logoPosition: "bottom-right",
          maxZoom: 21,
          minZoom: 3,
          rtl: { lazy: false },
          style: mapStyle,
          trackResize: true,
          zoom,
        });

        mapRef.current = map;
        map.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          "top-left",
        );
        map.once("load", () => {
          if (!disposed) {
            map.resize();
            setMapReady(true);
          }
        });
        map.once("error", () => setMapError(true));

        resizeObserver = new ResizeObserver(() => {
          map.resize();
        });
        resizeObserver.observe(container);
      })
      .catch(() => setMapError(true));

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      locationMarkersRef.current.forEach((entry) => entry.remove());
      locationMarkersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      sdkRef.current = null;
      appliedMapStyleRef.current = null;
      setMapReady(false);
    };
    // Map is created once per API key; later center/zoom changes use flyTo.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable map instance
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || appliedMapStyleRef.current === mapStyle) {
      return;
    }

    appliedMapStyleRef.current = mapStyle;
    map.setStyle(mapStyle);
  }, [mapReady, mapStyle]);

  useEffect(() => {
    if (!mapReady) {
      skipNextFlyRef.current = true;
      return;
    }

    const map = mapRef.current;
    if (!map || !followCenter) {
      return;
    }

    if (skipNextFlyRef.current) {
      skipNextFlyRef.current = false;
      return;
    }

    map.flyTo({
      center: [center.longitude, center.latitude],
      essential: true,
      zoom: Math.max(map.getZoom(), zoom),
    });
  }, [center.latitude, center.longitude, followCenter, mapReady, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = sdkRef.current;
    if (!mapReady || !map || !maplibregl) {
      return;
    }

    locationMarkersRef.current.forEach((entry) => entry.remove());
    locationMarkersRef.current = resolvedMarkers.map((entry) => {
      const nextMarker = new maplibregl.Marker({
        color:
          selectedMarkerId && entry.id === selectedMarkerId
            ? MARKER_SELECTED_COLOR
            : MARKER_COLOR,
      }).setLngLat([entry.longitude, entry.latitude]) as RemovableMarker;

      if (entry.label) {
        nextMarker.setPopup(
          new maplibregl.Popup({ offset: 20 }).setText(entry.label),
        );
      }

      nextMarker.addTo(map);
      nextMarker.getElement().addEventListener("click", (event) => {
        event.stopPropagation();
        onMarkerSelectRef.current?.(entry.id);
      });

      return nextMarker;
    });

    return () => {
      locationMarkersRef.current.forEach((entry) => entry.remove());
      locationMarkersRef.current = [];
    };
    // resolvedMarkers is represented by markersKey to avoid identity churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, markersKey, selectedMarkerId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !onPointChange) {
      return;
    }

    const handleClick = (event: { lngLat: { lat: number; lng: number } }) => {
      onPointChangeRef.current?.({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      });
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [mapReady, onPointChange]);

  async function locateUser() {
    const map = mapRef.current;
    const maplibregl = sdkRef.current;
    if (!map || !maplibregl || locating) {
      return;
    }

    setLocating(true);
    try {
      const position = await getCurrentPosition();
      const point: [number, number] = [
        position.coords.longitude,
        position.coords.latitude,
      ];

      userMarkerRef.current?.remove();
      userMarkerRef.current = new maplibregl.Marker({
        color: USER_MARKER_COLOR,
      }).setLngLat(point) as RemovableMarker;
      userMarkerRef.current.addTo(map);
      map.flyTo({ center: point, essential: true, zoom: Math.max(zoom, 15) });
    } finally {
      setLocating(false);
    }
  }

  const unavailable = !apiKey || mapError;

  return (
    <div
      className={cn(
        "relative isolate min-h-60 overflow-hidden bg-surface-secondary",
        className?.includes("rounded")
          ? undefined
          : "rounded-[calc(var(--radius)*3)]",
        className,
      )}
    >
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ inset: 0, position: "absolute" }}
      />

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
          className={cn(
            "absolute bottom-4 right-4 z-10 flex size-11 items-center justify-center rounded-full border border-foreground/10 bg-background text-foreground shadow-lg transition-transform active:scale-95 disabled:opacity-50",
            locateClassName,
          )}
        >
          <Icon name="compass" size="lg" />
        </button>
      )}
    </div>
  );
}
