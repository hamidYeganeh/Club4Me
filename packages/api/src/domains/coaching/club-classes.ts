"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../http/client";

export type ClubClassSession = {
  id: string;
  classId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: "scheduled" | "completed" | "cancelled";
};

export type PublicClubClass = {
  id: string;
  slug: string;
  clubId: string;
  title: string;
  description: string;
  sport: string;
  level: string;
  model: "group" | "private" | "course" | "single" | "open";
  pricingModel: "monthly" | "course" | "per_session" | "package";
  price: number;
  currency: string;
  packageSessionCount: number | null;
  capacity: number;
  enrollmentCount: number;
  remainingCapacity: number;
  startDate: string;
  endDate: string;
  enrollmentMode: "automatic" | "requires_approval";
  status: "active" | "completed";
  club: {
    id: string;
    name: string;
    slug?: string;
    location?: { latitude: number; longitude: number } | null;
  };
  coach: { id: string; name: string } | null;
  branch: { id: string; name: string; address: string } | null;
  sessions: ClubClassSession[];
};

export type AthleteClubClassEnrollment = {
  id: string;
  classId: string;
  title: string;
  sport: string;
  startDate: string;
  endDate: string;
  status: "pending" | "active" | "waitlisted" | "cancelled" | "completed";
  paymentStatus:
    "pending" | "paid" | "partial" | "waived" | "failed" | "refunded";
  agreedPrice: number;
  remainingSessions: number | null;
  enrolledAt: string;
};

export type RecommendedClubClass = PublicClubClass & {
  recommendationScore: number;
  distanceKm: number | null;
  reasons: string[];
};

export type CoachClubClass = Omit<
  PublicClubClass,
  "remainingCapacity" | "coach" | "sessions"
> & { sessions?: ClubClassSession[] };

export type CoachClubClassEnrollment = {
  id: string;
  studentId: string;
  student: { name: string; phone: string } | null;
  status: AthleteClubClassEnrollment["status"];
  paymentStatus: AthleteClubClassEnrollment["paymentStatus"];
  agreedPrice: number;
  remainingSessions: number | null;
};

export type CoachClubClassAttendance = {
  studentId: string;
  student: { name: string; phone: string };
  status: "unrecorded" | "present" | "absent" | "excused";
  notes: string;
};

export type ClassCheckInCredential = {
  code: string;
  qrPayload: string;
  expiresAt: string;
};

const publicKey = ["discovery", "business-classes"] as const;
const athleteKey = ["athlete", "club-classes"] as const;
const coachKey = ["coach", "club-classes"] as const;

export function usePublicClubClasses(params?: { clubId?: string; q?: string }) {
  return useQuery({
    queryKey: [...publicKey, params ?? {}],
    queryFn: () =>
      http.get<{ items: PublicClubClass[]; total: number }>(
        "/discovery/business-classes",
        params,
      ),
  });
}

export function usePublicClubClass(classId: string) {
  return useQuery({
    queryKey: [...publicKey, classId],
    queryFn: () =>
      http.get<PublicClubClass>(`/discovery/business-classes/${classId}`),
    enabled: Boolean(classId),
  });
}

export function useAthleteClubClasses() {
  return useQuery({
    queryKey: athleteKey,
    queryFn: () =>
      http.get<{ items: AthleteClubClassEnrollment[] }>(
        "/athlete/club-classes",
      ),
  });
}

export function useAthleteClassRecommendations() {
  return useQuery({
    queryKey: [...athleteKey, "recommendations"],
    queryFn: () =>
      http.get<{ items: RecommendedClubClass[] }>(
        "/athlete/club-classes/recommendations",
      ),
  });
}

export function useEnrollInClubClass() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) =>
      http.post<AthleteClubClassEnrollment>(
        `/athlete/club-classes/${classId}/enroll`,
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: athleteKey }),
  });
}

export function useResolveClubClassPayment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      enrollmentId,
      result,
    }: {
      enrollmentId: string;
      result: "approve" | "reject";
    }) =>
      http.patch<AthleteClubClassEnrollment>(
        `/athlete/club-classes/enrollments/${enrollmentId}/payment`,
        { result },
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: athleteKey }),
  });
}

export function useCancelClubClassEnrollment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: string) =>
      http.post<AthleteClubClassEnrollment>(
        `/athlete/club-classes/enrollments/${enrollmentId}/cancel`,
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: athleteKey }),
  });
}

export function useClaimClubClassWaitlist() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: string) =>
      http.post<AthleteClubClassEnrollment>(
        `/athlete/club-classes/enrollments/${enrollmentId}/waitlist/claim`,
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: athleteKey }),
  });
}

export function useAthleteClassCheckIn() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      classId: string;
      sessionId: string;
      credential: string;
    }) =>
      http.post<{
        success: true;
        attendanceId: string;
        method: "qr" | "code";
        checkedInAt: string;
      }>("/athlete/club-classes/check-in", payload),
    onSuccess: () => client.invalidateQueries({ queryKey: athleteKey }),
  });
}

export function useCoachClubClasses() {
  return useQuery({
    queryKey: coachKey,
    queryFn: () => http.get<{ items: CoachClubClass[] }>("/coach/club-classes"),
  });
}

export function useCoachClubClass(classId: string) {
  return useQuery({
    queryKey: [...coachKey, classId],
    queryFn: () => http.get<CoachClubClass>(`/coach/club-classes/${classId}`),
    enabled: Boolean(classId),
  });
}

export function useCoachClubClassEnrollments(classId: string) {
  return useQuery({
    queryKey: [...coachKey, classId, "enrollments"],
    queryFn: () =>
      http.get<{ items: CoachClubClassEnrollment[] }>(
        `/coach/club-classes/${classId}/enrollments`,
      ),
    enabled: Boolean(classId),
  });
}

export function useCoachClubClassAttendance(
  classId: string,
  sessionId: string,
) {
  return useQuery({
    queryKey: [...coachKey, classId, "sessions", sessionId, "attendance"],
    queryFn: () =>
      http.get<{ items: CoachClubClassAttendance[] }>(
        `/coach/club-classes/${classId}/sessions/${sessionId}/attendance`,
      ),
    enabled: Boolean(classId && sessionId),
  });
}

export function useRecordCoachClubClassAttendance(
  classId: string,
  sessionId: string,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (
      items: Array<{
        studentId: string;
        status: "present" | "absent" | "excused";
        notes: string;
      }>,
    ) =>
      http.put<{ items: CoachClubClassAttendance[] }>(
        `/coach/club-classes/${classId}/sessions/${sessionId}/attendance`,
        { items },
      ),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: [...coachKey, classId, "sessions", sessionId, "attendance"],
      }),
  });
}

export function useGenerateCoachClassCheckIn(
  classId: string,
  sessionId: string,
) {
  return useMutation({
    mutationFn: (expiresInMinutes: number) =>
      http.post<ClassCheckInCredential>(
        `/coach/club-classes/${classId}/sessions/${sessionId}/check-in-credential`,
        { expiresInMinutes },
      ),
  });
}

export function useCreateCoachCalendarFeed() {
  return useMutation({
    mutationFn: () =>
      http.post<{ token: string; feedPath: string }>(
        "/coach/club-classes/calendar-feed",
        {},
      ),
  });
}

export function useUpdateCoachClubClassSession(classId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      sessionId: string;
      payload: Partial<
        Pick<ClubClassSession, "startsAt" | "endsAt" | "status">
      >;
    }) =>
      http.patch<ClubClassSession>(
        `/coach/club-classes/${classId}/sessions/${sessionId}`,
        payload,
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: [...coachKey, classId] }),
  });
}
