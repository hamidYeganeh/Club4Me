"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../http/client";

export type CoachProfile = {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  shortBio: string;
  bio: string;
  experienceYears: number;
  languages: string[];
  serviceModes: string[];
  contact: Record<string, unknown>;
  reviewStatus:
    "draft" | "pending_review" | "approved" | "rejected" | "suspended";
  visibility: "hidden" | "public";
  rejectionReason: string | null;
};

export type CoachClass = {
  id: string;
  title: string;
  slug: string;
  description: string;
  capacity: number;
  enrollmentCount: number;
  courseStartAt: string;
  courseEndAt: string;
  status:
    | "draft"
    | "published"
    | "registration_closed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "archived";
  clubApprovalStatus: string;
  updatedAt: string;
};

export type CoachOffering = {
  id: string;
  coachId: string;
  sportId: string;
  title: string;
  description: string;
  type: "private" | "semi_private" | "group" | "assessment";
  deliveryModes: Array<"club" | "online" | "home" | "outdoor">;
  durationMinutes: number;
  capacity: number;
  price: { amount: number; currency: string };
  pricingType: "per_session" | "package" | "per_month";
  venueClubIds: string[];
  cancellationPolicy: Record<string, unknown>;
  status: "draft" | "published" | "archived";
};

export type CreateCoachOfferingPayload = {
  sportId: string;
  title: string;
  description?: string;
  type: CoachOffering["type"];
  deliveryModes: CoachOffering["deliveryModes"];
  durationMinutes: number;
  capacity: number;
  price: CoachOffering["price"];
  pricingType?: CoachOffering["pricingType"];
  venueClubIds?: string[];
  requiredEquipmentText?: string;
  cancellationPolicy?: Record<string, unknown>;
};

export type CoachSession = {
  id: string;
  coachId: string;
  classId?: string;
  clubId?: string;
  offeringId?: string;
  offeringTitle?: string;
  sportId?: string;
  title: string;
  startAt: string;
  endAt: string;
  timezone: string;
  deliveryMode: "club" | "online" | "home" | "outdoor";
  venue: {
    clubId?: string;
    courtId?: string;
    address?: string;
    onlineUrl?: string;
  } | null;
  capacity: number;
  bookedCount: number;
  remainingCapacity?: number;
  price?: { amount: number; currency: string };
  cancellationPolicy?: Record<string, unknown>;
  status: string;
  managedBy?: "coach" | "club";
  source?: "coach" | "club";
};

export type CreateCoachSessionPayload = {
  offeringId: string;
  sportId: string;
  title: string;
  startAt: string;
  endAt: string;
  timezone?: string;
  deliveryMode: CoachSession["deliveryMode"];
  venue?: CoachSession["venue"];
  capacity: number;
  publicNotes?: string;
};

export type CoachBookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled_by_athlete"
  | "cancelled_by_coach"
  | "completed"
  | "no_show";

export type CoachBooking = {
  id: string;
  sessionId: string;
  offeringId: string;
  coachId: string;
  athleteId: string;
  sessionTitle: string;
  sessionStartsAt: string;
  sessionEndsAt: string;
  offeringTitle: string | null;
  deliveryMode: CoachSession["deliveryMode"];
  venue: CoachSession["venue"];
  status: CoachBookingStatus;
  priceSnapshot: { amount: number; currency: string };
  paymentStatus: "not_required" | "pending" | "paid" | "refunded" | "failed";
  refundPercent: number | null;
  refundAmount: number | null;
  bookedAt: string;
  cancelledAt?: string;
};

export type ClassEnrollmentStatus =
  "pending" | "active" | "rejected" | "cancelled" | "completed";

export type ClassEnrollment = {
  id: string;
  classId: string;
  coachId: string;
  athleteId: string;
  classTitle: string;
  classSlug: string;
  courseStartAt: string;
  courseEndAt: string;
  deliveryMode: CoachSession["deliveryMode"];
  venue: CoachSession["venue"];
  status: ClassEnrollmentStatus;
  priceSnapshot: { amount: number; currency: string };
  paymentStatus: "not_required" | "pending" | "paid" | "refunded" | "failed";
  refundPercent: number | null;
  refundAmount: number | null;
  registeredAt: string;
  cancelledAt?: string;
};

export type CoachEnrollment = Omit<
  ClassEnrollment,
  | "classTitle"
  | "classSlug"
  | "courseStartAt"
  | "courseEndAt"
  | "deliveryMode"
  | "venue"
> & {
  athlete: {
    id: string;
    phone: string;
    firstName?: string;
    lastName?: string;
  } | null;
};

export type AttendanceStatus =
  "unrecorded" | "present" | "absent" | "late" | "excused";

export type CoachAttendanceItem = {
  id?: string;
  athleteId: string;
  sourceType: "enrollment" | "booking";
  sourceId: string;
  athlete: {
    id: string;
    phone: string;
    firstName?: string;
    lastName?: string;
  } | null;
  status: AttendanceStatus;
  note: string | null;
  checkedInAt: string | null;
};

export type CreateCoachClassPayload = {
  clubId?: string | null;
  title: string;
  description: string;
  sportId: string;
  coachAssignments: Array<{ coachId: string; role: "primary" | "assistant" }>;
  deliveryMode: "club" | "online" | "home" | "outdoor";
  capacity: number;
  courseStartAt: string;
  courseEndAt: string;
  price: { amount: number; currency: string };
  enrollmentMode: "automatic" | "requires_approval";
  galleryMediaIds: string[];
  tags: string[];
  prerequisites: string[];
  requiredEquipmentIds: string[];
  amenityIds: string[];
};

export type CoachSport = {
  id: string;
  coachId: string;
  sportId: string;
  specialtyIds: string[];
  experienceYears: number;
  certificateMediaIds: string[];
  achievements: string[];
};

const client = {
  profile: () => http.get<CoachProfile>("/coach/profile"),
  updateProfile: (payload: Partial<CoachProfile>) =>
    http.patch<CoachProfile>("/coach/profile", payload),
  submitProfile: () => http.post<CoachProfile>("/coach/profile/submit"),
  sports: () => http.get<{ items: CoachSport[] }>("/coach/sports"),
  replaceSports: (sportIds: string[]) =>
    http.put<{ items: CoachSport[] }>("/coach/sports", {
      items: sportIds.map((sportId) => ({
        sportId,
        specialtyIds: [],
        experienceYears: 0,
        certificateMediaIds: [],
        achievements: [],
        customAttributes: {},
      })),
    }),
  classes: () => http.get<{ items: CoachClass[] }>("/coach/classes"),
  createClass: (payload: CreateCoachClassPayload) =>
    http.post<CoachClass>("/coach/classes", payload),
  generateSchedule: (
    classId: string,
    payload: {
      timezone: string;
      daysOfWeek: number[];
      startMinute: number;
      durationMinutes: number;
      startDate: string;
      endDate: string;
      repeatEveryWeeks: number;
    },
  ) => http.post(`/coach/classes/${classId}/schedule`, payload),
  updateClassStatus: (classId: string, status: string) =>
    http.patch<CoachClass>(`/coach/classes/${classId}/status`, { status }),
  offerings: () => http.get<{ items: CoachOffering[] }>("/coach/services"),
  createOffering: (payload: CreateCoachOfferingPayload) =>
    http.post<CoachOffering>("/coach/services", {
      description: "",
      pricingType: "per_session",
      venueClubIds: [],
      requiredEquipmentText: "",
      cancellationPolicy: {
        title: "قانون لغو مربی",
        tiers: [
          { hoursBefore: 24, refundPercent: 80 },
          { hoursBefore: 0, refundPercent: 0 },
        ],
        ownerCancellationRefundPercent: 100,
      },
      ...payload,
    }),
  updateOfferingStatus: (
    offeringId: string,
    status: "published" | "archived",
  ) =>
    http.patch<CoachOffering>(`/coach/services/${offeringId}/status`, {
      status,
    }),
  calendar: () => http.get<{ items: CoachSession[] }>("/coach/calendar"),
  createSession: (payload: CreateCoachSessionPayload) =>
    http.post<CoachSession>("/coach/sessions", {
      timezone: "Asia/Tehran",
      ...payload,
    }),
  cancelSession: (sessionId: string, reason: string) =>
    http.post<CoachSession>(`/coach/sessions/${sessionId}/cancel`, { reason }),
  coachBookings: () => http.get<{ items: CoachBooking[] }>("/coach/bookings"),
  classEnrollments: (classId: string) =>
    http.get<{ items: CoachEnrollment[] }>(
      `/coach/classes/${classId}/enrollments`,
    ),
  updateEnrollmentStatus: (
    enrollmentId: string,
    status: ClassEnrollmentStatus,
  ) =>
    http.patch<CoachEnrollment>(`/coach/enrollments/${enrollmentId}/status`, {
      status,
    }),
  sessionAttendance: (sessionId: string) =>
    http.get<{
      session: { id: string; title: string; startAt: string; endAt: string };
      items: CoachAttendanceItem[];
    }>(`/coach/sessions/${sessionId}/attendance`),
  recordSessionAttendance: (
    sessionId: string,
    items: Array<{
      athleteId: string;
      status: Exclude<AttendanceStatus, "unrecorded">;
      note?: string;
    }>,
  ) =>
    http.put<{
      session: { id: string; title: string; startAt: string; endAt: string };
      items: CoachAttendanceItem[];
    }>(`/coach/sessions/${sessionId}/attendance`, { items }),
  updateBookingStatus: (
    bookingId: string,
    status: CoachBookingStatus,
    reason?: string,
  ) =>
    http.patch<CoachBooking>(`/coach/bookings/${bookingId}/status`, {
      status,
      reason,
    }),
  publicSessions: (slug: string) =>
    http.get<{ items: CoachSession[] }>(`/public/coaches/${slug}/sessions`),
  athleteBookings: () =>
    http.get<{ items: CoachBooking[] }>("/athlete/bookings"),
  athleteEnrollments: () =>
    http.get<{ items: ClassEnrollment[] }>("/athlete/enrollments"),
  enrollClass: (classId: string) =>
    http.post<ClassEnrollment>(`/athlete/classes/${classId}/enrollments`),
  cancelEnrollment: (enrollmentId: string) =>
    http.post<ClassEnrollment>(`/athlete/enrollments/${enrollmentId}/cancel`),
  approveMockEnrollmentPayment: (enrollmentId: string) =>
    http.patch<ClassEnrollment>(
      `/athlete/enrollments/${enrollmentId}/mock-payment/approve`,
    ),
  rejectMockEnrollmentPayment: (enrollmentId: string) =>
    http.patch<ClassEnrollment>(
      `/athlete/enrollments/${enrollmentId}/mock-payment/reject`,
    ),
  bookSession: (sessionId: string) =>
    http.post<CoachBooking>(`/athlete/sessions/${sessionId}/bookings`),
  cancelBooking: (bookingId: string, reason = "لغو توسط ورزشکار") =>
    http.post<CoachBooking>(`/athlete/bookings/${bookingId}/cancel`, {
      reason,
    }),
  approveMockPayment: (bookingId: string) =>
    http.patch<CoachBooking>(
      `/athlete/bookings/${bookingId}/mock-payment/approve`,
    ),
  rejectMockPayment: (bookingId: string) =>
    http.patch<CoachBooking>(
      `/athlete/bookings/${bookingId}/mock-payment/reject`,
    ),
};

export function useCoachProfile() {
  return useQuery({ queryKey: ["coach", "profile"], queryFn: client.profile });
}

export function useUpdateCoachProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: client.updateProfile,
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["coach"] }),
  });
}

export function useSubmitCoachProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: client.submitProfile,
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["coach"] }),
  });
}

export function useCoachSports() {
  return useQuery({ queryKey: ["coach", "sports"], queryFn: client.sports });
}

export function useReplaceCoachSports() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: client.replaceSports,
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["coach"] }),
  });
}

export function useCoachClasses() {
  return useQuery({ queryKey: ["coach", "classes"], queryFn: client.classes });
}

export function useCreateCoachClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: client.createClass,
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["coach", "classes"] }),
  });
}

export function useGenerateCoachClassSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      classId,
      ...payload
    }: Parameters<typeof client.generateSchedule>[1] & { classId: string }) =>
      client.generateSchedule(classId, payload),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["coach", "classes"] }),
  });
}

export function useUpdateCoachClassStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, status }: { classId: string; status: string }) =>
      client.updateClassStatus(classId, status),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["coach", "classes"] }),
  });
}

export function useCoachOfferings() {
  return useQuery({
    queryKey: ["coach", "offerings"],
    queryFn: client.offerings,
  });
}

export function useCreateCoachOffering() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: client.createOffering,
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["coach", "offerings"] }),
  });
}

export function useUpdateCoachOfferingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      offeringId,
      status,
    }: {
      offeringId: string;
      status: "published" | "archived";
    }) => client.updateOfferingStatus(offeringId, status),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["coach", "offerings"] }),
  });
}

export function useCoachCalendar() {
  return useQuery({
    queryKey: ["coach", "calendar"],
    queryFn: client.calendar,
  });
}

export function useCreateCoachSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: client.createSession,
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["coach", "calendar"] }),
  });
}

export function useCancelCoachSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      reason,
    }: {
      sessionId: string;
      reason: string;
    }) => client.cancelSession(sessionId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["coach", "calendar"] });
      await queryClient.invalidateQueries({ queryKey: ["coach", "bookings"] });
    },
  });
}

export function useCoachBookings() {
  return useQuery({
    queryKey: ["coach", "bookings"],
    queryFn: client.coachBookings,
  });
}

export function useCoachClassEnrollments(classId: string) {
  return useQuery({
    queryKey: ["coach", "classes", classId, "enrollments"],
    queryFn: () => client.classEnrollments(classId),
    enabled: Boolean(classId),
  });
}

export function useUpdateClassEnrollmentStatus(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      enrollmentId,
      status,
    }: {
      enrollmentId: string;
      status: ClassEnrollmentStatus;
    }) => client.updateEnrollmentStatus(enrollmentId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["coach", "classes", classId, "enrollments"],
      });
      await queryClient.invalidateQueries({ queryKey: ["coach", "classes"] });
    },
  });
}

export function useCoachSessionAttendance(sessionId: string) {
  return useQuery({
    queryKey: ["coach", "sessions", sessionId, "attendance"],
    queryFn: () => client.sessionAttendance(sessionId),
    enabled: Boolean(sessionId),
  });
}

export function useRecordCoachSessionAttendance(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      items: Array<{
        athleteId: string;
        status: Exclude<AttendanceStatus, "unrecorded">;
        note?: string;
      }>,
    ) => client.recordSessionAttendance(sessionId, items),
    onSuccess: async () =>
      queryClient.invalidateQueries({
        queryKey: ["coach", "sessions", sessionId, "attendance"],
      }),
  });
}

export function useUpdateCoachBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      status,
      reason,
    }: {
      bookingId: string;
      status: CoachBookingStatus;
      reason?: string;
    }) => client.updateBookingStatus(bookingId, status, reason),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["coach", "bookings"] }),
  });
}

export function usePublicCoachSessions(slug: string) {
  return useQuery({
    queryKey: ["public", "coaches", slug, "sessions"],
    queryFn: () => client.publicSessions(slug),
    enabled: Boolean(slug),
  });
}

export function useMyCoachBookings() {
  return useQuery({
    queryKey: ["athlete", "coach-bookings"],
    queryFn: client.athleteBookings,
  });
}

export function useMyClassEnrollments() {
  return useQuery({
    queryKey: ["athlete", "class-enrollments"],
    queryFn: client.athleteEnrollments,
  });
}

export function useEnrollClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: client.enrollClass,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["athlete", "class-enrollments"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["discovery", "catalog"],
      });
    },
  });
}

export function useCancelClassEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: client.cancelEnrollment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["athlete", "class-enrollments"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["discovery", "catalog"],
      });
    },
  });
}

export function useResolveMockClassPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      enrollmentId,
      result,
    }: {
      enrollmentId: string;
      result: "approve" | "reject";
    }) =>
      result === "approve"
        ? client.approveMockEnrollmentPayment(enrollmentId)
        : client.rejectMockEnrollmentPayment(enrollmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["athlete", "class-enrollments"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["discovery", "catalog"],
      });
    },
  });
}

export function useBookCoachSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: client.bookSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["public", "coaches"] });
      await queryClient.invalidateQueries({
        queryKey: ["athlete", "coach-bookings"],
      });
    },
  });
}

export function useCancelCoachBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => client.cancelBooking(bookingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["athlete", "coach-bookings"],
      });
      await queryClient.invalidateQueries({ queryKey: ["public", "coaches"] });
    },
  });
}

export function useResolveMockCoachPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      result,
    }: {
      bookingId: string;
      result: "approve" | "reject";
    }) =>
      result === "approve"
        ? client.approveMockPayment(bookingId)
        : client.rejectMockPayment(bookingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["athlete", "coach-bookings"],
      });
      await queryClient.invalidateQueries({ queryKey: ["public", "coaches"] });
    },
  });
}
