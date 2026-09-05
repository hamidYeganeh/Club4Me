import { Capacitor, registerPlugin } from "@capacitor/core";

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
  getCurrentPosition(): Promise<NativePosition>;
};

export type LocationErrorCode =
  | "unsupported"
  | "denied"
  | "unavailable"
  | "timeout"
  | "unknown";

export class LocationAccessError extends Error {
  constructor(public readonly code: LocationErrorCode, message: string) {
    super(message);
    this.name = "LocationAccessError";
  }
}

const nativeGeolocation =
  registerPlugin<NativeGeolocationPlugin>("NativeGeolocation");

export async function getCurrentPosition(): Promise<NativePosition> {
  if (Capacitor.getPlatform() === "android") {
    try {
      return await nativeGeolocation.getCurrentPosition();
    } catch (error) {
      throw normalizeLocationError(error);
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
