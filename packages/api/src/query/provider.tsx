"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { configureApi } from "../http/client";
import { tokenStore } from "../http/token-store";
import type { ApiConfig } from "../http/types";
import { createQueryClient } from "./client";

type ApiProviderProps = {
  children: ReactNode;
  baseURL: string;
  requestTimeoutMs?: ApiConfig["requestTimeoutMs"];
  getAccessToken?: ApiConfig["getAccessToken"];
  getRefreshToken?: ApiConfig["getRefreshToken"];
  refreshEndpoint?: ApiConfig["refreshEndpoint"];
  onSessionRefreshed?: ApiConfig["onSessionRefreshed"];
  onUnauthorized?: ApiConfig["onUnauthorized"];
};

export function ApiProvider({
  children,
  baseURL,
  requestTimeoutMs,
  getAccessToken = () => tokenStore.get(),
  getRefreshToken = () => tokenStore.getRefresh(),
  refreshEndpoint = "/account/auth/refresh",
  onSessionRefreshed = (accessToken, refreshToken) =>
    tokenStore.replaceSession(accessToken, refreshToken),
  onUnauthorized = () => tokenStore.clear(),
}: ApiProviderProps) {
  const [queryClient] = useState(() => createQueryClient());

  configureApi({
    baseURL,
    requestTimeoutMs,
    getAccessToken,
    getRefreshToken,
    refreshEndpoint,
    onSessionRefreshed,
    onUnauthorized,
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
