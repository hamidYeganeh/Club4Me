"use client";

import { createPortalAuth } from "../portal/create-portal-auth";

export * from "./business-clubs";
export type * from "./club-profile.dto";
export * from "./business-operations";
export * from "./business-classes";
export * from "./business-memberships";
export {
  useBusinessSessions,
  useCancelBusinessSession,
  useClubReservations,
  useCompleteSession,
  useMarkClubReservationNoShow,
  useReservableClubClasses,
  useClubCoaches,
  useClubCourts,
  useCreateCourt,
  useCreateSession,
} from "../reservations";
export type {
  ClubCourt,
  CreateCourtPayload,
  CreateSessionPayload,
  ReservableSession,
  SessionReservation,
  SessionOption,
} from "../reservations";
export type {
  BusinessClub,
  BusinessCatalogItem,
  BusinessCatalogResponse,
  BusinessMedia,
  BusinessTag,
  BusinessTagsResponse,
  ClubCancellationRule,
  ClubCancellationTier,
  ClubLocation,
  ClubResourceQuantityPayload,
  CreateBusinessClubPayload,
  ListBusinessClubsResponse,
  SocialPlatform,
  UpdateBusinessClubPayload,
} from "./business-clubs.dto";

const portal = createPortalAuth("business");

export const businessClient = portal.client;
export const businessEndpoints = portal.endpoints;
export const businessQueries = portal.queries;
export const useBusinessMe = portal.useMe;
export const useRequestOtp = portal.useRequestOtp;
export const useConfirmOtp = portal.useConfirmOtp;
export const useLogin = portal.useLogin;
export const useSetPassword = portal.useSetPassword;
export const useForgotPassword = portal.useForgotPassword;
export const useConfirmForgotPassword = portal.useConfirmForgotPassword;
export const useRefreshSession = portal.useRefreshSession;
export const useLogout = portal.useLogout;
