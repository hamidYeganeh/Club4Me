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
  RequestableRole,
  RequestOtpPayload,
  ReviewRoleRequestPayload,
  SetPasswordPayload,
  UpdateAccountMePayload,
} from "./account.dto";
import { accountQueries } from "./account.queries";
import {
  resetTelemetryIdentity,
  trackUserSignedUp,
} from "../../tracking/tracking";

export function useAccountMe(enabled = true) {
  return useQuery({
    queryKey: accountQueries.me(),
    queryFn: () => accountClient.me(),
    enabled: enabled && Boolean(tokenStore.get()),
  });
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: (payload: RequestOtpPayload) =>
      accountClient.requestOtp(payload),
  });
}

export function useConfirmOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfirmOtpPayload) =>
      accountClient.confirmOtp(payload),
    onSuccess: async (data) => {
      tokenStore.setSession(data.accessToken, data.refreshToken);
      if (Date.now() - new Date(data.user.createdAt).getTime() < 120_000) {
        const initialRole = data.user.roles.find(
          (role) => role === "athlete" || role === "coach" || role === "owner",
        );
        if (initialRole) {
          trackUserSignedUp({
            signup_method: "otp",
            initial_role: initialRole,
          });
        }
      }
      await queryClient.invalidateQueries({ queryKey: accountQueries.me() });
    },
  });
}

export type LoginVariables = LoginPayload & {
  remember?: boolean;
};

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: LoginVariables) => {
      const payload = { ...variables };
      delete payload.remember;
      return accountClient.login(payload);
    },
    onSuccess: async (data, variables) => {
      tokenStore.setSession(
        data.accessToken,
        data.refreshToken,
        variables.remember !== false,
      );
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
      resetTelemetryIdentity();
      tokenStore.clear();
      queryClient.removeQueries({ queryKey: accountQueries.all() });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountClient.deleteAccount,
    onSuccess: () => {
      resetTelemetryIdentity();
      tokenStore.clear();
      queryClient.clear();
    },
  });
}

export function useUpdateAccountMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAccountMePayload) =>
      accountClient.updateMe(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: accountQueries.me() });
    },
  });
}

export function useRequestRole() {
  return useMutation({
    mutationFn: (role: RequestableRole) => accountClient.requestRole(role),
  });
}

export function useAdminRoleRequests(enabled = true) {
  return useQuery({
    queryKey: accountQueries.roleRequests(),
    queryFn: () => accountClient.listRoleRequests(),
    enabled,
  });
}

export function useReviewRoleRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      status,
    }: ReviewRoleRequestPayload & { requestId: string }) =>
      accountClient.reviewRoleRequest(requestId, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: accountQueries.roleRequests(),
      });
    },
  });
}
