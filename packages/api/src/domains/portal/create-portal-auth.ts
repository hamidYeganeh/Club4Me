"use client";

import { useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tokenStore } from "../../http/token-store";
import { http } from "../../http/client";
import type {
  AccountMeResponse,
  ConfirmForgotPasswordPayload,
  ConfirmForgotPasswordResponse,
  ConfirmOtpPayload,
  ConfirmOtpResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  RefreshSessionPayload,
  RefreshSessionResponse,
  RequestOtpPayload,
  RequestOtpResponse,
  SetPasswordPayload,
  SetPasswordResponse,
} from "../account/account.dto";

export type PortalScope = "admin" | "business";

export function createPortalAuth(scope: PortalScope) {
  const endpoints = {
    requestOtp: `/${scope}/auth/otp`,
    confirmOtp: `/${scope}/auth/otp/confirm`,
    login: `/${scope}/auth/login`,
    setPassword: `/${scope}/auth/set-password`,
    forgotPassword: `/${scope}/auth/forgot-password`,
    confirmForgotPassword: `/${scope}/auth/forgot-password/confirm`,
    refresh: `/${scope}/auth/refresh`,
    logout: `/${scope}/auth/logout`,
    me: `/${scope}/me`,
  } as const;

  const client = {
    requestOtp: (payload: RequestOtpPayload) =>
      http.post<RequestOtpResponse>(endpoints.requestOtp, payload),

    confirmOtp: (payload: ConfirmOtpPayload) =>
      http.post<ConfirmOtpResponse>(endpoints.confirmOtp, payload),

    login: (payload: LoginPayload) =>
      http.post<LoginResponse>(endpoints.login, payload),

    setPassword: (payload: SetPasswordPayload) =>
      http.post<SetPasswordResponse>(endpoints.setPassword, payload),

    forgotPassword: (payload: ForgotPasswordPayload) =>
      http.post<ForgotPasswordResponse>(endpoints.forgotPassword, payload),

    confirmForgotPassword: (payload: ConfirmForgotPasswordPayload) =>
      http.post<ConfirmForgotPasswordResponse>(
        endpoints.confirmForgotPassword,
        payload,
      ),

    refresh: (payload: RefreshSessionPayload) =>
      http.post<RefreshSessionResponse>(endpoints.refresh, payload),

    logout: () => http.post<LogoutResponse>(endpoints.logout),

    me: (signal?: AbortSignal) =>
      http.get<AccountMeResponse>(endpoints.me, undefined, signal),
  };

  const queries = {
    all: () => [scope] as const,
    me: () => [...queries.all(), "me"] as const,
  };

  function useMe(enabled = true) {
    const identity = useSyncExternalStore(
      tokenStore.subscribe,
      tokenStore.identity,
      () => "guest",
    );
    return useQuery({
      queryKey: [...queries.me(), identity],
      queryFn: ({ signal }) => client.me(signal),
      enabled: enabled && Boolean(tokenStore.get()),
    });
  }

  function useRequestOtp() {
    return useMutation({
      mutationFn: (payload: RequestOtpPayload) => client.requestOtp(payload),
    });
  }

  function useConfirmOtp() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (payload: ConfirmOtpPayload) => client.confirmOtp(payload),
      onSuccess: async (data) => {
        await queryClient.cancelQueries({ queryKey: queries.me() });
        tokenStore.setSession(data.accessToken, data.refreshToken);
        queryClient.removeQueries({ queryKey: queries.me() });
      },
    });
  }

  type LoginVariables = LoginPayload & {
    remember?: boolean;
  };

  function useLogin() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (variables: LoginVariables) => {
        const payload = { ...variables };
        delete payload.remember;
        return client.login(payload);
      },
      onSuccess: async (data, variables) => {
        await queryClient.cancelQueries({ queryKey: queries.me() });
        tokenStore.setSession(
          data.accessToken,
          data.refreshToken,
          variables.remember !== false,
        );
        queryClient.removeQueries({ queryKey: queries.me() });
      },
    });
  }

  function useSetPassword() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (payload: SetPasswordPayload) => client.setPassword(payload),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: queries.me() });
      },
    });
  }

  function useForgotPassword() {
    return useMutation({
      mutationFn: (payload: ForgotPasswordPayload) =>
        client.forgotPassword(payload),
    });
  }

  function useConfirmForgotPassword() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (payload: ConfirmForgotPasswordPayload) =>
        client.confirmForgotPassword(payload),
      onSuccess: async (data) => {
        await queryClient.cancelQueries({ queryKey: queries.me() });
        tokenStore.setSession(data.accessToken, data.refreshToken);
        queryClient.removeQueries({ queryKey: queries.me() });
      },
    });
  }

  function useRefreshSession() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (payload?: RefreshSessionPayload) =>
        client.refresh({
          refreshToken: payload?.refreshToken ?? tokenStore.getRefresh() ?? "",
        }),
      onSuccess: async (data) => {
        await queryClient.cancelQueries({ queryKey: queries.me() });
        tokenStore.setSession(data.accessToken, data.refreshToken);
        queryClient.removeQueries({ queryKey: queries.me() });
      },
    });
  }

  function useLogout() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: () => client.logout(),
      onSettled: () => {
        tokenStore.clear();
        queryClient.clear();
      },
    });
  }

  return {
    client,
    endpoints,
    queries,
    useMe,
    useRequestOtp,
    useConfirmOtp,
    useLogin,
    useSetPassword,
    useForgotPassword,
    useConfirmForgotPassword,
    useRefreshSession,
    useLogout,
  };
}
