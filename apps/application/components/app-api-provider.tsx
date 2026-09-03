"use client";

import { type ReactNode, useMemo } from "react";
import { ApiProvider } from "@api/provider";

import { resolveNativeApiUrl } from "@/lib/native-api-url";

const CONFIGURED_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7088/api/v1";

type AppApiProviderProps = {
  children: ReactNode;
};

export function AppApiProvider({ children }: AppApiProviderProps) {
  const baseURL = useMemo(
    () => resolveNativeApiUrl(CONFIGURED_API_URL),
    [],
  );

  return <ApiProvider baseURL={baseURL}>{children}</ApiProvider>;
}
