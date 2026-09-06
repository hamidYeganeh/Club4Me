"use client";

import { useEffect, useRef, useState } from "react";

import type { Map as NeshanMapInstance } from "@neshan-maps-platform/maplibre-sdk";

const NESHAN_STYLE = "https://static.neshan.org/sdk/maplibre/styles/light.json";
const DEFAULT_CENTER = { latitude: 35.6892, longitude: 51.389 };

type LocationMarker = {
  addTo: (map: NeshanMapInstance) => LocationMarker;
  remove: () => void;
  setLngLat: (coordinates: [number, number]) => LocationMarker;
};

type ClubLocationMapProps = {
  point: ClubLocationPoint | null;
  onPointChange: (point: ClubLocationPoint) => void;
  labels: {
    loading: string;
    unavailable: string;
    instructions: string;
  };
};

export type ClubLocationPoint = {
  latitude: number;
  longitude: number;
};

function waitForVisibleSize(element: HTMLElement): Promise<void> {
  if (element.clientWidth > 0 && element.clientHeight > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.clearTimeout(timeoutId);
      resolve();
    };

    const resizeObserver = new ResizeObserver(() => {
      if (element.clientWidth > 0 && element.clientHeight > 0) finish();
    });
    const intersectionObserver = new IntersectionObserver((entries) => {
      if (
        entries.some((entry) => entry.isIntersecting) &&
        element.clientWidth > 0 &&
        element.clientHeight > 0
      ) {
        finish();
      }
    });
    const timeoutId = window.setTimeout(finish, 4000);

    resizeObserver.observe(element);
    intersectionObserver.observe(element);
  });
}

export function ClubLocationMap({
  point,
  onPointChange,
  labels,
}: ClubLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NeshanMapInstance | null>(null);
  const markerRef = useRef<LocationMarker | null>(null);
  const onPointChangeRef = useRef(onPointChange);
  const pointRef = useRef(point);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_NESHAN_MAP_KEY?.trim();

  useEffect(() => {
    onPointChangeRef.current = onPointChange;
  }, [onPointChange]);

  useEffect(() => {
    pointRef.current = point;
  }, [point]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !apiKey) return;

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

    void (async () => {
      try {
        await waitForVisibleSize(container);
        if (disposed || !container.isConnected) return;

        const { default: maplibregl } = await import(
          "@neshan-maps-platform/maplibre-sdk"
        );
        if (disposed || !container.isConnected) return;

        const center = pointRef.current ?? DEFAULT_CENTER;
        const map = new maplibregl.Map({
          apiKey,
          center: [center.longitude, center.latitude],
          container,
          copyRightPosition: "bottom-left",
          logoPosition: "bottom-right",
          maxZoom: 21,
          minZoom: 3,
          rtl: { lazy: false },
          style: NESHAN_STYLE,
          trackResize: true,
          zoom: pointRef.current ? 15 : 11,
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
        map.on("click", (event) => {
          onPointChangeRef.current({
            latitude: event.lngLat.lat,
            longitude: event.lngLat.lng,
          });
        });

        resizeObserver = new ResizeObserver(() => map.resize());
        resizeObserver.observe(container);
      } catch {
        if (!disposed) setMapError(true);
      }
    })();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !point) return;

    void import("@neshan-maps-platform/maplibre-sdk").then(
      ({ default: maplibregl }) => {
        if (!mapRef.current) return;
        const coordinates: [number, number] = [point.longitude, point.latitude];

        if (markerRef.current) {
          markerRef.current.setLngLat(coordinates);
        } else {
          markerRef.current = new maplibregl.Marker({ color: "#2563eb" })
            .setLngLat(coordinates)
            .addTo(mapRef.current) as LocationMarker;
        }

        map.flyTo({
          center: coordinates,
          essential: true,
          zoom: Math.max(map.getZoom(), 15),
        });
      },
    );
  }, [mapReady, point]);

  const unavailable = !apiKey || mapError;

  return (
    <div className="md:col-span-2">
      <div className="relative h-80 overflow-hidden app-card shadow-none active:scale-100-secondary">
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />
        {!unavailable && !mapReady ? (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted">
            {labels.loading}
          </div>
        ) : null}
        {unavailable ? (
          <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted">
            {labels.unavailable}
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-muted">{labels.instructions}</p>
    </div>
  );
}
