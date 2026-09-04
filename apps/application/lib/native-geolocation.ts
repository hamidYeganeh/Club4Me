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

const nativeGeolocation =
  registerPlugin<NativeGeolocationPlugin>("NativeGeolocation");

export async function getCurrentPosition(): Promise<NativePosition> {
  if (Capacitor.getPlatform() === "android") {
    return nativeGeolocation.getCurrentPosition();
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
      reject,
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 12_000 },
    );
  });
}
