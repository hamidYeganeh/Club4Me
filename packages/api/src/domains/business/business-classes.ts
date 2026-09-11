"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../http/client";

type Base = {
  id: string;
  clubId: string;
  createdAt: string;
  updatedAt: string;
};
export type BusinessClassModel =
  "group" | "private" | "course" | "single" | "open";
export type BusinessClassPricingModel =
  "monthly" | "course" | "per_session" | "package";
export type BusinessClassStatus =
  "draft" | "active" | "paused" | "completed" | "cancelled";
export type BusinessTrainingClass = Base & {
  title: string;
  description: string;
  faqs: Array<{ question: string; answer: string }>;
  sport: string;
  level: string;
  skillLevelId: string | null;
  model: BusinessClassModel;
  pricingModel: BusinessClassPricingModel;
  price: number;
  currency: string;
  packageSessionCount: number | null;
  capacity: number;
  coachProfileId: string | null;
  branchId: string | null;
  coverMediaId: string | null;
  galleryMediaIds: string[];
  prerequisites: string[];
  requiredEquipmentIds: string[];
  amenityIds: string[];
  minAge: number | null;
  maxAge: number | null;
  registrationStartAt: string | null;
  registrationEndAt: string | null;
  scheduleError?: string | null;
  readiness?: { ready: boolean; missing: string[] };
  startDate: string;
  endDate: string;
  schedule: Array<{
    dayOfWeek: number;
    startTime: string;
    durationMinutes: number;
  }>;
  visibility: "public" | "private";
  enrollmentMode: "automatic" | "requires_approval";
  status: BusinessClassStatus;
  enrollmentCount: number;
  sessionCount?: number;
};
export type BusinessClassSession = Base & {
  classId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: "scheduled" | "completed" | "cancelled";
};
export type BusinessClassSessionChange = {
  startsAt: string;
  endsAt: string;
  affectedCount: number;
  conflicts: Array<{
    type: "class" | "reservation";
    id: string;
    title?: string;
    startsAt: string;
    endsAt: string;
  }>;
};
export type BusinessCalendarClassSession = BusinessClassSession & {
  classTitle: string;
};
export type BusinessClassEnrollment = Base & {
  studentName?: string;
  classId: string;
  studentId: string;
  status: "pending" | "active" | "waitlisted" | "cancelled" | "completed";
  agreedPrice: number | null;
  paymentStatus:
    "pending" | "paid" | "partial" | "waived" | "failed" | "refunded";
  totalSessions: number | null;
  remainingSessions: number | null;
  enrolledAt: string;
};
export type BusinessClassAttendance = Base & {
  changes?: Array<{
    actorId: string;
    at: string;
    before: string;
    after: string;
    beforeCredits: number | null;
    afterCredits: number | null;
  }>;
  sessionId: string;
  classId: string;
  studentId: string;
  status: "present" | "absent" | "excused";
  notes: string;
  recordedBy: string;
  checkInMethod?: "manual" | "qr" | "code";
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
};

export type BusinessClassCheckInCredential = {
  code: string;
  qrPayload: string;
  expiresAt: string;
};
export type CalendarFeed = { token: string; feedPath: string };
export type BusinessClassPayload = Omit<
  BusinessTrainingClass,
  keyof Base | "enrollmentCount" | "sessionCount" | "faqs"
> & { faqs?: BusinessTrainingClass["faqs"] };
export type CreateClassEnrollmentPayload = {
  studentId: string;
  status: "active" | "waitlisted";
  agreedPrice: number;
  paymentStatus: "pending" | "paid" | "partial" | "waived";
  totalSessions: number | null;
};

const root = (clubId: string) => `/business/clubs/${clubId}/operations/classes`;
const detail = (clubId: string, classId: string) =>
  `${root(clubId)}/${classId}`;
const key = (clubId: string) =>
  ["business", "operations", clubId, "classes"] as const;
const invalidate = (
  client: ReturnType<typeof useQueryClient>,
  clubId: string,
) => client.invalidateQueries({ queryKey: key(clubId) });

export function useBusinessClasses(clubId: string) {
  return useQuery({
    queryKey: key(clubId),
    queryFn: () => http.get<{ items: BusinessTrainingClass[] }>(root(clubId)),
    enabled: Boolean(clubId),
  });
}
export function useBusinessClass(clubId: string, classId: string) {
  return useQuery({
    queryKey: [...key(clubId), classId],
    queryFn: () => http.get<BusinessTrainingClass>(detail(clubId, classId)),
    enabled: Boolean(clubId && classId),
  });
}
export function useCreateBusinessClass(clubId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: BusinessClassPayload) =>
      http.post<BusinessTrainingClass>(root(clubId), payload),
    onSuccess: () => invalidate(client, clubId),
  });
}
export function useUpdateBusinessClass(clubId: string, classId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<BusinessClassPayload>) =>
      http.patch<BusinessTrainingClass>(detail(clubId, classId), payload),
    onSuccess: () => invalidate(client, clubId),
  });
}
export function useRegenerateBusinessClassSessions(
  clubId: string,
  classId: string,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () =>
      http.post<{ items: BusinessClassSession[] }>(
        `${detail(clubId, classId)}/regenerate-sessions`,
      ),
    onSuccess: () => invalidate(client, clubId),
  });
}

export function useGenerateBusinessClassCheckIn(
  clubId: string,
  classId: string,
  sessionId: string,
) {
  return useMutation({
    mutationFn: (expiresInMinutes: number) =>
      http.post<BusinessClassCheckInCredential>(
        `${detail(clubId, classId)}/sessions/${sessionId}/check-in-credential`,
        { expiresInMinutes },
      ),
  });
}
export function useCreateBusinessCalendarFeed(clubId: string) {
  return useMutation({
    mutationFn: () =>
      http.post<CalendarFeed>(`${root(clubId)}/calendar-feed`, {}),
  });
}
export function useRevokeBusinessCalendarFeed(clubId: string) {
  return useMutation({
    mutationFn: () =>
      http.delete<{ revoked: boolean }>(`${root(clubId)}/calendar-feed`),
  });
}
export function useBusinessClassSessions(clubId: string, classId: string) {
  return useQuery({
    queryKey: [...key(clubId), classId, "sessions"],
    queryFn: () =>
      http.get<{ items: BusinessClassSession[] }>(
        `${detail(clubId, classId)}/sessions`,
      ),
    enabled: Boolean(clubId && classId),
  });
}
export function useBusinessCalendarClassSessions(
  clubId: string,
  from: string,
  to: string,
) {
  return useQuery({
    queryKey: [...key(clubId), "calendar-sessions", from, to],
    queryFn: () =>
      http.get<{ items: BusinessCalendarClassSession[] }>(
        `${root(clubId)}/calendar-sessions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      ),
    enabled: Boolean(clubId && from && to),
  });
}
export function useUpdateBusinessClassSession(clubId: string, classId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      sessionId: string;
      payload: Partial<
        Pick<BusinessClassSession, "startsAt" | "endsAt" | "status">
      > & { scope?: "single" | "future" };
    }) =>
      http.patch<BusinessClassSession>(
        `${detail(clubId, classId)}/sessions/${sessionId}`,
        payload,
      ),
    onSuccess: () => invalidate(client, clubId),
  });
}
export function usePreviewBusinessClassSessionChange(
  clubId: string,
  classId: string,
) {
  return useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      sessionId: string;
      payload: Pick<BusinessClassSession, "startsAt" | "endsAt"> & {
        scope: "single" | "future";
      };
    }) =>
      http.post<BusinessClassSessionChange>(
        `${detail(clubId, classId)}/sessions/${sessionId}/change-preview`,
        payload,
      ),
  });
}
export function useBusinessClassEnrollments(clubId: string, classId: string) {
  return useQuery({
    queryKey: [...key(clubId), classId, "enrollments"],
    queryFn: () =>
      http.get<{ items: BusinessClassEnrollment[] }>(
        `${detail(clubId, classId)}/enrollments`,
      ),
    enabled: Boolean(clubId && classId),
  });
}
export function useEnrollStudentInBusinessClass(
  clubId: string,
  classId: string,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClassEnrollmentPayload) =>
      http.post<BusinessClassEnrollment>(
        `${detail(clubId, classId)}/enrollments`,
        payload,
      ),
    onSuccess: () => invalidate(client, clubId),
  });
}
export function useUpdateBusinessClassEnrollment(
  clubId: string,
  classId: string,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      enrollmentId,
      payload,
    }: {
      enrollmentId: string;
      payload: Partial<
        Pick<
          BusinessClassEnrollment,
          "status" | "paymentStatus" | "agreedPrice" | "remainingSessions"
        >
      >;
    }) =>
      http.patch<BusinessClassEnrollment>(
        `${detail(clubId, classId)}/enrollments/${enrollmentId}`,
        payload,
      ),
    onSuccess: () => invalidate(client, clubId),
  });
}
export function useTransferBusinessClassEnrollment(
  clubId: string,
  classId: string,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      enrollmentId,
      targetClassId,
    }: {
      enrollmentId: string;
      targetClassId: string;
    }) =>
      http.post<BusinessClassEnrollment>(
        `${detail(clubId, classId)}/enrollments/${enrollmentId}/transfer`,
        { targetClassId },
      ),
    onSuccess: () => invalidate(client, clubId),
  });
}
export function useBusinessClassAttendance(
  clubId: string,
  classId: string,
  sessionId: string,
) {
  return useQuery({
    queryKey: [...key(clubId), classId, "sessions", sessionId, "attendance"],
    queryFn: () =>
      http.get<{ items: BusinessClassAttendance[] }>(
        `${detail(clubId, classId)}/sessions/${sessionId}/attendance`,
      ),
    enabled: Boolean(clubId && classId && sessionId),
  });
}
export function useRecordBusinessClassAttendance(
  clubId: string,
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
        checkedOut?: boolean;
      }>,
    ) =>
      http.put<{ items: BusinessClassAttendance[] }>(
        `${detail(clubId, classId)}/sessions/${sessionId}/attendance`,
        { items },
      ),
    onSuccess: () => invalidate(client, clubId),
  });
}
