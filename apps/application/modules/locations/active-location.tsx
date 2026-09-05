"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { useUserLocations, type UserLocation } from "@api/locations";

export type ActiveLocation =
  | { kind: "saved"; location: UserLocation }
  | {
      kind: "gps";
      latitude: number;
      longitude: number;
      title: string;
    };

type ActiveLocationContextValue = {
  active: ActiveLocation | null;
  selectSaved: (location: UserLocation) => void;
  selectGps: (latitude: number, longitude: number) => void;
};

const STORAGE_KEY = "gym4me.active-location-id";
const ActiveLocationContext = createContext<ActiveLocationContextValue | null>(
  null,
);

export function ActiveLocationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const locations = useUserLocations(pathname.startsWith("/discovery"));
  const [selection, setSelection] = useState<
    | { kind: "saved"; id: string }
    | { kind: "gps"; latitude: number; longitude: number }
    | null
  >(null);

  useEffect(() => {
    const id = window.sessionStorage.getItem(STORAGE_KEY);
    if (!id) return;
    const frame = window.requestAnimationFrame(() => {
      setSelection({ kind: "saved", id });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const active = useMemo<ActiveLocation | null>(() => {
    if (selection?.kind === "gps") {
      return { ...selection, title: "موقعیت فعلی من" };
    }
    const items = locations.data?.items ?? [];
    const selected =
      selection?.kind === "saved"
        ? items.find((item) => item.id === selection.id)
        : undefined;
    const location = selected ?? items.find((item) => item.isDefault);
    return location ? { kind: "saved", location } : null;
  }, [locations.data?.items, selection]);

  const value = useMemo<ActiveLocationContextValue>(
    () => ({
      active,
      selectSaved: (location) => {
        window.sessionStorage.setItem(STORAGE_KEY, location.id);
        setSelection({ kind: "saved", id: location.id });
      },
      selectGps: (latitude, longitude) => {
        window.sessionStorage.removeItem(STORAGE_KEY);
        setSelection({ kind: "gps", latitude, longitude });
      },
    }),
    [active],
  );

  return (
    <ActiveLocationContext.Provider value={value}>
      {children}
    </ActiveLocationContext.Provider>
  );
}

export function useActiveLocation() {
  const context = useContext(ActiveLocationContext);
  if (!context) throw new Error("ActiveLocationProvider is missing");
  return context;
}

export function getActiveCoordinates(active: ActiveLocation | null) {
  if (!active) return undefined;
  return active.kind === "gps"
    ? { latitude: active.latitude, longitude: active.longitude }
    : {
        latitude: active.location.latitude,
        longitude: active.location.longitude,
      };
}
