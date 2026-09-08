import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosRequestConfig,
} from "axios";

import { toApiError } from "./errors";
import type { ApiConfig, ApiSuccess } from "./types";
import { ApiError } from "./errors";
import { tokenStore } from "./token-store";

const runtime: { config?: ApiConfig } = {};
let httpClient: AxiosInstance | undefined;
let refreshPromise: Promise<void> | undefined;

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
  expectedSessionIdentity?: string;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

const PUBLIC_AUTH_ENDPOINT =
  /\/auth\/(?:otp(?:\/confirm)?|login|forgot-password(?:\/confirm)?|refresh)\/?$/;

function isPublicAuthRequest(url?: string): boolean {
  return PUBLIC_AUTH_ENDPOINT.test((url ?? "").split("?")[0] ?? "");
}

function hasBearerToken(request: RetriableRequestConfig): boolean {
  const authorization = request.headers.get("Authorization");
  return (
    typeof authorization === "string" &&
    authorization.toLowerCase().startsWith("bearer ")
  );
}

function endsSession(error: unknown): boolean {
  const status = toApiError(error).status;
  return status === 400 || status === 401 || status === 403;
}

async function refreshSession(
  config: ApiConfig,
  refreshToken: string,
): Promise<void> {
  if (!refreshPromise) {
    const endpoint = config.refreshEndpoint;
    const pending = (async () => {
      try {
        const response = await axios.post<ApiSuccess<RefreshResponse>>(
          endpoint || "/account/auth/refresh",
          { refreshToken },
          {
            baseURL: config.baseURL,
            headers: { "Content-Type": "application/json" },
          },
        );
        if ((await config.getRefreshToken?.()) !== refreshToken) {
          throw new ApiError("Session changed during authentication refresh", {
            code: "SESSION_CHANGED",
            status: 401,
          });
        }
        const session = response.data.data;
        await config.onSessionRefreshed?.(
          session.accessToken,
          session.refreshToken,
        );
      } catch (error) {
        if (
          endsSession(error) &&
          (await config.getRefreshToken?.()) === refreshToken
        ) {
          await config.onUnauthorized?.();
        }
        throw toApiError(error);
      }
    })();

    refreshPromise = pending;
    const clearPendingRefresh = () => {
      if (refreshPromise === pending) {
        refreshPromise = undefined;
      }
    };
    void pending.then(clearPendingRefresh, clearPendingRefresh);
  }

  await refreshPromise;
}

function ensureClient(): AxiosInstance {
  if (httpClient) {
    return httpClient;
  }

  httpClient = axios.create({
    headers: {
      "Content-Type": "application/json",
    },
    timeout: runtime.config?.requestTimeoutMs ?? 15_000,
  });

  httpClient.interceptors.request.use(async (request) => {
    const expectedIdentity = (request as RetriableRequestConfig)
      .expectedSessionIdentity;
    if (
      typeof navigator !== "undefined" &&
      navigator.onLine === false &&
      !["get", "head", "options"].includes(request.method ?? "get")
    ) {
      throw new ApiError("This operation requires an internet connection", {
        code: "NETWORK_ERROR",
      });
    }
    const config = runtime.config;

    if (!config) {
      throw new Error(
        "API client is not configured. Wrap the tree with <ApiProvider /> or call configureApi().",
      );
    }

    request.baseURL = config.baseURL;
    if (typeof FormData !== "undefined" && request.data instanceof FormData) {
      request.headers.delete("Content-Type");
      request.timeout = Math.max(request.timeout ?? 0, 120_000);
    }
    if (isPublicAuthRequest(request.url)) {
      request.headers.delete("Authorization");
      return request;
    }

    const token = await config.getAccessToken?.();

    if (expectedIdentity && tokenStore.identity() !== expectedIdentity) {
      throw new ApiError("Session changed before offline synchronization", {
        code: "SESSION_CHANGED",
        status: 401,
      });
    }

    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }

    return request;
  });

  httpClient.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      const apiError = toApiError(error);
      const request = axios.isAxiosError(error)
        ? (error.config as RetriableRequestConfig | undefined)
        : undefined;
      const config = runtime.config;

      if (
        request?.expectedSessionIdentity &&
        tokenStore.identity() !== request.expectedSessionIdentity
      ) {
        return Promise.reject(
          new ApiError("Session changed before offline synchronization", {
            code: "SESSION_CHANGED",
            status: 401,
          }),
        );
      }

      if (
        apiError.status !== 401 ||
        !request ||
        !config ||
        !hasBearerToken(request)
      ) {
        return Promise.reject(apiError);
      }

      if (request._authRetry || config.refreshEndpoint === false) {
        await config.onUnauthorized?.();
        return Promise.reject(apiError);
      }

      const [accessToken, refreshToken] = await Promise.all([
        config.getAccessToken?.(),
        config.getRefreshToken?.(),
      ]);

      if (!accessToken || !refreshToken) {
        await config.onUnauthorized?.();
        return Promise.reject(apiError);
      }

      request._authRetry = true;

      try {
        const requestToken = request.headers.get("Authorization");
        if (requestToken === `Bearer ${accessToken}`) {
          await refreshSession(config, refreshToken);
        }
        return await getHttpClient().request(request);
      } catch (refreshError) {
        return Promise.reject(toApiError(refreshError));
      }
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
  get: async <T>(
    url: string,
    params?: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<T> => {
    const response = await getHttpClient().get<ApiSuccess<T>>(url, {
      params,
      signal,
    });
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

/** Replay remains bound to its original account, including after an auth refresh. */
export async function sessionRequest<T>(
  identity: string,
  method: "PUT" | "DELETE",
  url: string,
  data?: unknown,
): Promise<T> {
  const options: AxiosRequestConfig & { expectedSessionIdentity: string } = {
    method,
    url,
    data,
    expectedSessionIdentity: identity,
  };
  const response = await getHttpClient().request<ApiSuccess<T>>(options);
  return response.data.data;
}
