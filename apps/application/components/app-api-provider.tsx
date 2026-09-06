"use client";

import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { ApiProvider } from "@api/provider";
import { configureTokenPersistence, tokenStore } from "@api/http";
import { OfflineProvider } from "@api/offline/provider";
import { OFFLINE_MAX_AGE } from "@api/offline/cache";
import { createQueryClient } from "@api/query/client";

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

  return <SessionBoundary baseURL={baseURL}>{children}</SessionBoundary>;
}

function SessionBoundary({
  children,
  baseURL,
}: {
  children: ReactNode;
  baseURL: string;
}) {
  const identity = useSyncExternalStore(
    tokenStore.subscribe,
    tokenStore.identity,
    () => "guest",
  );
  return (
    <SessionApiProvider key={identity} identity={identity} baseURL={baseURL}>
      {children}
    </SessionApiProvider>
  );
}

function SessionApiProvider({
  children,
  identity,
  baseURL,
}: {
  children: ReactNode;
  identity: string;
  baseURL: string;
}) {
  const [client] = useState(() => {
    const value = createQueryClient();
    value.setDefaultOptions({
      queries: {
        ...value.getDefaultOptions().queries,
        gcTime: OFFLINE_MAX_AGE,
      },
      mutations: { retry: 0, networkMode: "always" },
    });
    return value;
  });
  return (
    <ApiProvider
      queryClient={client}
      baseURL={baseURL}
      requestTimeoutMs={CONFIGURED_API_TIMEOUT_MS}
    >
      <OfflineProvider
        client={client}
        identity={identity}
        namespace={baseURL}
        fallback={<RouteLoadingSkeleton />}
      >
        {children}
      </OfflineProvider>
    </ApiProvider>
  );
}
