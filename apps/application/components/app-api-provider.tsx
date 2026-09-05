"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiProvider } from "@api/provider";
import { configureTokenPersistence } from "@api/http";
import { Capacitor } from "@capacitor/core";

import { resolveNativeApiUrl } from "@/lib/native-api-url";
import { secureTokenStorage } from "@/lib/secure-token-storage";
import { biometricAuth } from "@/lib/biometric-auth";

const CONFIGURED_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7088/api/v1";
const CONFIGURED_API_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 15_000,
);

type AppApiProviderProps = {
  children: ReactNode;
};

export function AppApiProvider({ children }: AppApiProviderProps) {
  const router = useRouter();
  const [storageReady, setStorageReady] = useState(
    () => !Capacitor.isNativePlatform(),
  );
  const baseURL = useMemo(() => resolveNativeApiUrl(CONFIGURED_API_URL), []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void (async () => {
      const hasSavedSession = await secureTokenStorage.hasSession();
      const canAuthenticate =
        hasSavedSession && (await biometricAuth.isAvailable());

      if (canAuthenticate) {
        try {
          await biometricAuth.authenticate();
        } catch {
          await configureTokenPersistence(secureTokenStorage, {
            hydrate: false,
          });
          router.replace("/auth/login");
          return;
        }
      }

      await configureTokenPersistence(secureTokenStorage);
    })()
      .catch((error) => console.error("Secure token storage failed", error))
      .finally(() => setStorageReady(true));
  }, [router]);

  if (!storageReady) return null;

  return (
    <ApiProvider
      baseURL={baseURL}
      requestTimeoutMs={CONFIGURED_API_TIMEOUT_MS}
    >
      {children}
    </ApiProvider>
  );
}
