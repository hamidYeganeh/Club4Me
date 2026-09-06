import { Capacitor } from "@capacitor/core";

const DEFAULT_API_URL = "https://api.gym4me.ir/api/v1";

export function resolveNativeApiUrl(url = DEFAULT_API_URL): string {
  if (Capacitor.getPlatform() !== "android") {
    return url;
  }

  return url.replace(/localhost|127\.0\.0\.1/g, "10.0.2.2");
}
