import axios, { type AxiosInstance } from "axios";

import { toApiError } from "./errors";
import type { ApiConfig, ApiSuccess } from "./types";

const runtime: { config?: ApiConfig } = {};
let httpClient: AxiosInstance | undefined;

function ensureClient(): AxiosInstance {
  if (httpClient) {
    return httpClient;
  }

  httpClient = axios.create({
    headers: {
      "Content-Type": "application/json",
    },
  });

  httpClient.interceptors.request.use(async (request) => {
    const config = runtime.config;

    if (!config) {
      throw new Error(
        "API client is not configured. Wrap the tree with <ApiProvider /> or call configureApi().",
      );
    }

    request.baseURL = config.baseURL;
    const token = await config.getAccessToken?.();

    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }

    return request;
  });

  httpClient.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const apiError = toApiError(error);

      if (apiError.status === 401) {
        runtime.config?.onUnauthorized?.();
      }

      return Promise.reject(apiError);
    },
  );

  return httpClient;
}

export function configureApi(config: ApiConfig): void {
  runtime.config = config;
  ensureClient();
}

export function getHttpClient(): AxiosInstance {
  if (!runtime.config) {
    throw new Error(
      "API client is not configured. Wrap the tree with <ApiProvider /> or call configureApi().",
    );
  }

  return ensureClient();
}

export function getApiConfig(): ApiConfig {
  if (!runtime.config) {
    throw new Error(
      "API client is not configured. Wrap the tree with <ApiProvider /> or call configureApi().",
    );
  }

  return runtime.config;
}

export const http = {
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
    const response = await getHttpClient().get<ApiSuccess<T>>(url, { params });
    return response.data.data;
  },
  post: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await getHttpClient().post<ApiSuccess<T>>(url, data);
    return response.data.data;
  },
  put: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await getHttpClient().put<ApiSuccess<T>>(url, data);
    return response.data.data;
  },
  patch: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await getHttpClient().patch<ApiSuccess<T>>(url, data);
    return response.data.data;
  },
  delete: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await getHttpClient().delete<ApiSuccess<T>>(url, { data });
    return response.data.data;
  },
};
