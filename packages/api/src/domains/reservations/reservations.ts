"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../http/client";
import type {
  ClubCourt,
  ClubCoachSummary,
  ClubClassSummary,
  CreateCourtPayload,
  CreateReservationPayload,
  CreateSessionPayload,
  ReservableSession,
  SessionReservation,
} from "./reservations.dto";

export const reservationsClient = {
  listCourts: (clubId: string) =>
    http.get<{ items: ClubCourt[] }>(`/business/clubs/${clubId}/courts`),
  createCourt: (clubId: string, payload: CreateCourtPayload) =>
    http.post<ClubCourt>(`/business/clubs/${clubId}/courts`, payload),
  listBusinessSessions: (clubId: string) =>
    http.get<{ items: ReservableSession[] }>(
      `/business/clubs/${clubId}/sessions`,
    ),
  createSession: (clubId: string, payload: CreateSessionPayload) =>
    http.post<ReservableSession>(`/business/clubs/${clubId}/sessions`, payload),
  listPublicSessions: (clubId: string) =>
    http.get<{ items: ReservableSession[] }>(
      `/public/clubs/${clubId}/reservable-sessions`,
    ),
  listClubCoaches: (clubId: string) =>
    http.get<{ items: ClubCoachSummary[] }>(`/public/clubs/${clubId}/coaches`),
  listClubClasses: (clubId: string) =>
    http.get<{ items: ClubClassSummary[] }>(`/public/clubs/${clubId}/classes`),
  listMine: () => http.get<{ items: SessionReservation[] }>("/reservations"),
  reserve: (payload: CreateReservationPayload) =>
    http.post<SessionReservation>("/reservations", payload),
  cancel: (reservationId: string) =>
    http.patch<SessionReservation>(`/reservations/${reservationId}/cancel`),
};

export function useClubCourts(clubId: string) {
  return useQuery({
    queryKey: ["business", "clubs", clubId, "courts"],
    queryFn: () => reservationsClient.listCourts(clubId),
    enabled: /^[a-f\d]{24}$/i.test(clubId),
  });
}
export function useCreateCourt(clubId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCourtPayload) =>
      reservationsClient.createCourt(clubId, payload),
    onSuccess: async () =>
      qc.invalidateQueries({
        queryKey: ["business", "clubs", clubId, "courts"],
      }),
  });
}
export function useBusinessSessions(clubId: string) {
  return useQuery({
    queryKey: ["business", "clubs", clubId, "sessions"],
    queryFn: () => reservationsClient.listBusinessSessions(clubId),
    enabled: Boolean(clubId),
  });
}
export function useCreateSession(clubId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSessionPayload) =>
      reservationsClient.createSession(clubId, payload),
    onSuccess: async () =>
      qc.invalidateQueries({
        queryKey: ["business", "clubs", clubId, "sessions"],
      }),
  });
}
export function useClubCoaches(clubId: string) {
  return useQuery({
    queryKey: ["public", "clubs", clubId, "coaches"],
    queryFn: () => reservationsClient.listClubCoaches(clubId),
    enabled: /^[a-f\d]{24}$/i.test(clubId),
  });
}
export function useReservableClubClasses(clubId: string) {
  return useQuery({
    queryKey: ["public", "clubs", clubId, "classes"],
    queryFn: () => reservationsClient.listClubClasses(clubId),
    enabled: /^[a-f\d]{24}$/i.test(clubId),
  });
}
export function useReservableSessions(clubId: string) {
  return useQuery({
    queryKey: ["discovery", "clubs", clubId, "reservable-sessions"],
    queryFn: () => reservationsClient.listPublicSessions(clubId),
    enabled: /^[a-f\d]{24}$/i.test(clubId),
  });
}
export function useMyReservations() {
  return useQuery({
    queryKey: ["reservations", "mine"],
    queryFn: () => reservationsClient.listMine(),
  });
}
export function useReserveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReservationPayload) =>
      reservationsClient.reserve(payload),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });
}
export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationsClient.cancel(id),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });
}
