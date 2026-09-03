"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tokenStore } from "../../http/token-store";
import { accountClient } from "./account.client";
import type {
  ConfirmForgotPasswordPayload,
  ConfirmOtpPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RefreshSessionPayload,
  RequestOtpPayload,
  SetPasswordPayload,
} from "./account.dto";
import { accountQueries } from "./account.queries";

export function useAccountMe(enabled = true) {
  return useQuery({
    queryKey: accountQueries.me(),
    queryFn: () => accountClient.me(),
    enabled: enabled && Boolean(tokenStore.get()),
  });
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: (payload: RequestOtpPayload) => accountClient.requestOtp(payload),
  });
}

export function useConfirmOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfirmOtpPayload) => accountClient.confirmOtp(payload),
    onSuccess: async (data) => {
      tokenStore.setSession(data.accessToken, data.refreshToken);
      await queryClient.invalidateQueries({ queryKey: accountQueries.me() });
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => accountClient.login(payload),
    onSuccess: async (data) => {
      tokenStore.setSession(data.accessToken, data.refreshToken);
      await queryClient.invalidateQueries({ queryKey: accountQueries.me() });
    },
  });
}

export function useSetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetPasswordPayload) =>
      accountClient.setPassword(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: accountQueries.me() });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) =>
      accountClient.forgotPassword(payload),
  });
}

export function useConfirmForgotPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfirmForgotPasswordPayload) =>
      accountClient.confirmForgotPassword(payload),
    onSuccess: async (data) => {
      tokenStore.setSession(data.accessToken, data.refreshToken);
      await queryClient.invalidateQueries({ queryKey: accountQueries.me() });
    },
  });
}

export function useRefreshSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: RefreshSessionPayload) =>
      accountClient.refresh({
        refreshToken: payload?.refreshToken ?? tokenStore.getRefresh() ?? "",
      }),
    onSuccess: async (data) => {
      tokenStore.setSession(data.accessToken, data.refreshToken);
      await queryClient.invalidateQueries({ queryKey: accountQueries.me() });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => accountClient.logout(),
    onSettled: () => {
      tokenStore.clear();
      queryClient.removeQueries({ queryKey: accountQueries.all() });
    },
  });
}
