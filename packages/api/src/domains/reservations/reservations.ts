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
import {
  trackReservationCancelled,
  trackReservationCreated,
  trackSessionPublished,
  groupSession,
} from "../../tracking/tracking";

export const reservationsClient = {
  listCourts: (clubId: string) =>
    http.get<{ items: ClubCourt[] }>(`/business/clubs/${clubId}/courts`),
  createCourt: (clubId: string, payload: CreateCourtPayload) =>
    http.post<ClubCourt>(`/business/clubs/${clubId}/courts`, payload),
  listBusinessSessions: (clubId: string) =>
    http.get<{ items: ReservableSession[] }>(
      `/business/clubs/${clubId}/sessions`,
    ),
  listClubReservations: (clubId: string) =>
    http.get<{ items: SessionReservation[] }>(
      `/business/clubs/${clubId}/reservations`,
    ),
  createSession: (clubId: string, payload: CreateSessionPayload) =>
    http.post<ReservableSession>(`/business/clubs/${clubId}/sessions`, payload),
  completeSession: (clubId: string, sessionId: string) =>
    http.patch<ReservableSession>(
      `/business/clubs/${clubId}/sessions/${sessionId}/complete`,
    ),
  cancelBusinessSession: (clubId: string, sessionId: string) =>
    http.patch<ReservableSession>(
      `/business/clubs/${clubId}/sessions/${sessionId}/cancel`,
    ),
  markNoShow: (clubId: string, reservationId: string) =>
    http.patch<SessionReservation>(
      `/business/clubs/${clubId}/reservations/${reservationId}/no-show`,
    ),
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
  approveMockPayment: (reservationId: string) =>
    http.patch<SessionReservation>(
      `/reservations/${reservationId}/mock-payment/approve`,
    ),
  rejectMockPayment: (reservationId: string) =>
    http.patch<SessionReservation>(
      `/reservations/${reservationId}/mock-payment/reject`,
    ),
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
export function useClubReservations(clubId: string) {
  return useQuery({
    queryKey: ["business", "clubs", clubId, "reservations"],
    queryFn: () => reservationsClient.listClubReservations(clubId),
    enabled: Boolean(clubId),
  });
}
export function useCreateSession(clubId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSessionPayload) =>
      reservationsClient.createSession(clubId, payload),
    onSuccess: async (session) => {
      const sessionType = session.courtId
        ? "court"
        : session.classId
          ? "class"
          : "coached_session";
      groupSession(session.id, {
        parent_group_id: clubId,
        session_type: sessionType,
        status: session.status,
        starts_at: session.startsAt,
      });
      trackSessionPublished({
        club_id: clubId,
        session_id: session.id,
        session_type: sessionType,
      });
      return qc.invalidateQueries({
        queryKey: ["business", "clubs", clubId, "sessions"],
      });
    },
  });
}
export function useCompleteSession(clubId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      reservationsClient.completeSession(clubId, sessionId),
    onSuccess: async () =>
      qc.invalidateQueries({
        queryKey: ["business", "clubs", clubId, "sessions"],
      }),
  });
}
export function useCancelBusinessSession(clubId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      reservationsClient.cancelBusinessSession(clubId, sessionId),
    onSuccess: async () =>
      qc.invalidateQueries({
        queryKey: ["business", "clubs", clubId, "sessions"],
      }),
  });
}
export function useMarkClubReservationNoShow(clubId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: string) =>
      reservationsClient.markNoShow(clubId, reservationId),
    onSuccess: async () =>
      qc.invalidateQueries({
        queryKey: ["business", "clubs", clubId, "reservations"],
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
    onSuccess: async (reservation) => {
      trackReservationCreated({
        reservation_id: reservation.id,
        club_id: reservation.clubId,
        session_id: reservation.sessionId,
        session_type: reservation.sessionType,
        participant_count: reservation.participantCount,
      });
      await qc.invalidateQueries({ queryKey: ["reservations"] });
      await qc.invalidateQueries({ queryKey: ["discovery", "clubs"] });
      await qc.invalidateQueries({ queryKey: ["public", "coaches"] });
    },
  });
}
export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationsClient.cancel(id),
    onSuccess: async (reservation) => {
      trackReservationCancelled({
        reservation_id: reservation.id,
        club_id: reservation.clubId,
        session_id: reservation.sessionId,
        cancelled_by: "athlete",
      });
      await qc.invalidateQueries({ queryKey: ["reservations"] });
      await qc.invalidateQueries({ queryKey: ["discovery", "clubs"] });
      await qc.invalidateQueries({ queryKey: ["public", "coaches"] });
    },
  });
}
export function useResolveMockClubPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reservationId,
      result,
    }: {
      reservationId: string;
      result: "approve" | "reject";
    }) =>
      result === "approve"
        ? reservationsClient.approveMockPayment(reservationId)
        : reservationsClient.rejectMockPayment(reservationId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["reservations"] });
      await qc.invalidateQueries({ queryKey: ["discovery", "clubs"] });
      await qc.invalidateQueries({ queryKey: ["public", "coaches"] });
    },
  });
}
