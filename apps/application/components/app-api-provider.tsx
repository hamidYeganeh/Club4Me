"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ApiProvider } from "@api/provider";
import { configureTokenPersistence } from "@api";
import { Capacitor } from "@capacitor/core";

import { resolveNativeApiUrl } from "@/lib/native-api-url";
import { secureTokenStorage } from "@/lib/secure-token-storage";

const CONFIGURED_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7088/api/v1";

type AppApiProviderProps = {
  children: ReactNode;
};

export function AppApiProvider({ children }: AppApiProviderProps) {
  const [storageReady, setStorageReady] = useState(
    () => !Capacitor.isNativePlatform(),
  );
  const baseURL = useMemo(() => resolveNativeApiUrl(CONFIGURED_API_URL), []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void configureTokenPersistence(secureTokenStorage)
      .catch((error) => console.error("Secure token storage failed", error))
      .finally(() => setStorageReady(true));
  }, []);

  if (!storageReady) return null;

  return <ApiProvider baseURL={baseURL}>{children}</ApiProvider>;
}
