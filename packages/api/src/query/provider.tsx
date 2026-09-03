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
  getAccessToken?: ApiConfig["getAccessToken"];
  onUnauthorized?: ApiConfig["onUnauthorized"];
};

export function ApiProvider({
  children,
  baseURL,
  getAccessToken = () => tokenStore.get(),
  onUnauthorized = () => tokenStore.clear(),
}: ApiProviderProps) {
  const [queryClient] = useState(() => createQueryClient());

  configureApi({
    baseURL,
    getAccessToken,
    onUnauthorized,
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
