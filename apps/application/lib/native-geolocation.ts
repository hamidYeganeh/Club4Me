import { Capacitor, registerPlugin } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const LOCATION_GRANTED_KEY = "gym4me.location.granted";

type NativePosition = {
  timestamp: number;
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
  };
};

type NativeGeolocationPlugin = {
  checkPermission(): Promise<{ granted: boolean }>;
  getCurrentPosition(): Promise<NativePosition>;
};

export type LocationErrorCode =
  "unsupported" | "denied" | "unavailable" | "timeout" | "unknown";

export class LocationAccessError extends Error {
  constructor(
    public readonly code: LocationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LocationAccessError";
  }
}

const nativeGeolocation =
  registerPlugin<NativeGeolocationPlugin>("NativeGeolocation");

export async function getCurrentPosition(): Promise<NativePosition> {
  if (Capacitor.getPlatform() === "android") {
    try {
      const position = await nativeGeolocation.getCurrentPosition();
      await Preferences.set({ key: LOCATION_GRANTED_KEY, value: "true" });
      return position;
    } catch (error) {
      const normalized = normalizeLocationError(error);
      if (normalized.code === "denied")
        await Preferences.remove({ key: LOCATION_GRANTED_KEY });
      throw normalized;
    }
  }

  if (!("geolocation" in navigator)) {
    throw new LocationAccessError(
      "unsupported",
      "Geolocation is not supported on this device.",
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          timestamp: position.timestamp,
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
          },
        }),
      (error) => reject(normalizeLocationError(error)),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 12_000 },
    );
  });
}

export async function hasGrantedLocationPermission() {
  if (Capacitor.getPlatform() === "android") {
    try {
      const permission = await nativeGeolocation.checkPermission();
      if (permission.granted) {
        await Preferences.set({ key: LOCATION_GRANTED_KEY, value: "true" });
        return true;
      }
      await Preferences.remove({ key: LOCATION_GRANTED_KEY });
      return false;
    } catch {
      return (
        (await Preferences.get({ key: LOCATION_GRANTED_KEY })).value === "true"
      );
    }
  }
  if (!("permissions" in navigator)) return false;
  try {
    return (
      (await navigator.permissions.query({ name: "geolocation" })).state ===
      "granted"
    );
  } catch {
    return false;
  }
}

function normalizeLocationError(error: unknown): LocationAccessError {
  if (error instanceof LocationAccessError) return error;

  const value = error as { code?: number | string; message?: string } | null;
  const message = value?.message ?? "Unable to determine the current location.";

  if (value?.code === 1 || /denied|permission/i.test(message)) {
    return new LocationAccessError("denied", message);
  }
  if (value?.code === 2 || /unavailable|disabled|provider/i.test(message)) {
    return new LocationAccessError("unavailable", message);
  }
  if (value?.code === 3 || /timed? out|timeout/i.test(message)) {
    return new LocationAccessError("timeout", message);
  }
  return new LocationAccessError("unknown", message);
}
