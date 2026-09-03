"use client";

import { createPortalAuth } from "../portal/create-portal-auth";

export * from "./admin-clubs";

const portal = createPortalAuth("admin");

export const adminClient = portal.client;
export const adminEndpoints = portal.endpoints;
export const adminQueries = portal.queries;
export const useAdminMe = portal.useMe;
export const useRequestOtp = portal.useRequestOtp;
export const useConfirmOtp = portal.useConfirmOtp;
export const useLogin = portal.useLogin;
export const useSetPassword = portal.useSetPassword;
export const useForgotPassword = portal.useForgotPassword;
export const useConfirmForgotPassword = portal.useConfirmForgotPassword;
export const useRefreshSession = portal.useRefreshSession;
export const useLogout = portal.useLogout;
