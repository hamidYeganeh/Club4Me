"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ApiProvider } from "@api/provider";
import { configureTokenPersistence } from "@api/http";

import { resolveNativeApiUrl } from "@/lib/native-api-url";
import { secureTokenStorage } from "@/lib/secure-token-storage";
import { RouteLoadingSkeleton } from "@/components/loading-skeletons";

const CONFIGURED_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.gym4me.ir/api/v1";
const CONFIGURED_API_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 15_000,
);

type AppApiProviderProps = {
  children: ReactNode;
};

export function AppApiProvider({ children }: AppApiProviderProps) {
  const [storageReady, setStorageReady] = useState(
    () => !secureTokenStorage.isAvailable(),
  );
  const baseURL = useMemo(() => resolveNativeApiUrl(CONFIGURED_API_URL), []);

  useEffect(() => {
    if (!secureTokenStorage.isAvailable()) return;
    // Session restoration never opens a biometric dialog during navigation.
    void configureTokenPersistence(secureTokenStorage)
      .catch((error) => console.error("Secure token storage failed", error))
      .finally(() => setStorageReady(true));
  }, []);

  if (!storageReady) return <RouteLoadingSkeleton />;

  return (
    <ApiProvider baseURL={baseURL} requestTimeoutMs={CONFIGURED_API_TIMEOUT_MS}>
      {children}
    </ApiProvider>
  );
}
