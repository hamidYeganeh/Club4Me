"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getHttpClient, http } from "../../http/client";

type EntityBase = {
  id: string;
  clubId: string;
  createdAt: string;
  updatedAt: string;
};
export type ClubStudent = EntityBase & {
  firstName: string;
  lastName: string;
  phone: string;
  sport: string;
  membershipTitle: string;
  membershipEndsAt: string | null;
  status: "active" | "inactive";
  notes: string;
};
export type ClubCoachProfile = EntityBase & {
  firstName: string;
  lastName: string;
  phone: string;
  specialties: string[];
  employmentType: string;
  status: "active" | "inactive";
  notes: string;
};
export type ClubManualPayment = EntityBase & {
  studentId: string;
  type: "tuition" | "session" | "other";
  title: string;
  amount: number;
  currency: string;
  paidAt: string;
  method: "cash" | "card" | "transfer" | "other";
  notes: string;
  recordedBy: string;
};
export type ClubAttendanceRecord = EntityBase & {
  studentId: string;
  date: string;
  sessionTitle: string;
  status: "present" | "absent" | "excused";
  notes: string;
  recordedBy: string;
};
export type ClubBranch = EntityBase & {
  name: string;
  address: string;
  phone: string;
  timezone: string;
  status: "active" | "inactive";
};
export type BusinessDashboardSummary = {
  stats: {
    activeStudents: number;
    activeCoaches: number;
    activeClasses: number;
    branchCount: number;
    monthlyRevenue: number;
    attendanceRate: number;
  };
  revenueByMonth: Array<{ label: string; value: number }>;
  attendanceByDay: Array<{
    label: string;
    present: number;
    absent: number;
    excused: number;
  }>;
  paymentMix: { tuition: number; session: number; other: number };
};

export type CreateStudentPayload = Omit<ClubStudent, keyof EntityBase>;
export type CreateCoachPayload = Omit<ClubCoachProfile, keyof EntityBase>;
export type CreatePaymentPayload = Omit<
  ClubManualPayment,
  keyof EntityBase | "recordedBy"
>;
export type UpsertAttendancePayload = Omit<
  ClubAttendanceRecord,
  keyof EntityBase | "recordedBy"
>;
export type CreateBranchPayload = Omit<ClubBranch, keyof EntityBase>;

const root = (clubId: string) => `/business/clubs/${clubId}/operations`;
const endpoint = (clubId: string, resource: string) =>
  `${root(clubId)}/${resource}`;
const keys = {
  root: (clubId: string) => ["business", "operations", clubId] as const,
  list: (clubId: string, resource: string, params?: unknown) =>
    [...keys.root(clubId), resource, params] as const,
};
const useListQuery = <T>(
  clubId: string,
  resource: string,
  params?: Record<string, unknown>,
) =>
  useQuery({
    queryKey: keys.list(clubId, resource, params),
    queryFn: () => http.get<{ items: T[] }>(endpoint(clubId, resource), params),
    enabled: Boolean(clubId),
  });
const useCreateMutation = <TPayload, TResult>(
  clubId: string,
  resource: string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TPayload) =>
      http.post<TResult>(endpoint(clubId, resource), payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: keys.root(clubId) }),
  });
};

export function useClubStudents(clubId: string) {
  return useListQuery<ClubStudent>(clubId, "students");
}
export function useCreateClubStudent(clubId: string) {
  return useCreateMutation<CreateStudentPayload, ClubStudent>(
    clubId,
    "students",
  );
}
export function useUpdateClubStudent(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateStudentPayload>;
    }) =>
      http.patch<ClubStudent>(`${endpoint(clubId, "students")}/${id}`, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: keys.root(clubId) }),
  });
}
export function useClubCoachProfiles(clubId: string) {
  return useListQuery<ClubCoachProfile>(clubId, "coaches");
}
export function useCreateClubCoach(clubId: string) {
  return useCreateMutation<CreateCoachPayload, ClubCoachProfile>(
    clubId,
    "coaches",
  );
}
export function useUpdateClubCoach(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateCoachPayload>;
    }) =>
      http.patch<ClubCoachProfile>(
        `${endpoint(clubId, "coaches")}/${id}`,
        payload,
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: keys.root(clubId) }),
  });
}
export function useClubPayments(clubId: string) {
  return useListQuery<ClubManualPayment>(clubId, "payments");
}
export function useCreateClubPayment(clubId: string) {
  return useCreateMutation<CreatePaymentPayload, ClubManualPayment>(
    clubId,
    "payments",
  );
}
export function useClubAttendance(clubId: string, date?: string) {
  return useListQuery<ClubAttendanceRecord>(
    clubId,
    "attendance",
    date ? { date } : undefined,
  );
}
export function useUpsertClubAttendance(clubId: string) {
  return useCreateMutation<UpsertAttendancePayload, ClubAttendanceRecord>(
    clubId,
    "attendance",
  );
}
export function useClubBranches(clubId: string) {
  return useListQuery<ClubBranch>(clubId, "branches");
}
export function useCreateClubBranch(clubId: string) {
  return useCreateMutation<CreateBranchPayload, ClubBranch>(clubId, "branches");
}
export function useUpdateClubBranch(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateBranchPayload>;
    }) =>
      http.patch<ClubBranch>(`${endpoint(clubId, "branches")}/${id}`, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: keys.root(clubId) }),
  });
}
export function useBusinessDashboardSummary(clubId: string) {
  return useQuery({
    queryKey: keys.list(clubId, "summary"),
    queryFn: () =>
      http.get<BusinessDashboardSummary>(endpoint(clubId, "summary")),
    enabled: Boolean(clubId),
  });
}

export type OperationsDataKind =
  "students" | "coaches" | "classes" | "payments" | "attendance";
export type OperationsImportResult = {
  dryRun: boolean;
  total: number;
  valid: number;
  imported: number;
  errors: Array<{ row: number; message: string }>;
};
export type OperationsExportJob = {
  id: string;
  clubId: string;
  kind: OperationsDataKind;
  format: "csv" | "xlsx";
  status: "queued" | "processing" | "ready" | "failed" | "expired";
  filename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  error: string;
  downloadPath: string | null;
  expiresAt: string | null;
  createdAt: string;
  completedAt: string | null;
};

export function useExportBusinessOperations(clubId: string) {
  return useMutation({
    mutationFn: async ({
      kind,
      format,
    }: {
      kind: OperationsDataKind;
      format: "csv" | "xlsx";
    }) => {
      let job = await http.post<OperationsExportJob>(
        endpoint(clubId, "exports"),
        { kind, format },
      );
      for (let attempt = 0; attempt < 90; attempt += 1) {
        if (job.status === "failed")
          throw new Error(job.error || "Export failed");
        if (job.status === "expired") throw new Error("Export expired");
        if (job.status === "ready" && job.downloadPath && job.filename) {
          const response = await getHttpClient().get<Blob>(job.downloadPath, {
            responseType: "blob",
          });
          return {
            filename: job.filename,
            mimeType: job.mimeType ?? "application/octet-stream",
            blob: response.data,
          };
        }
        await delay(1000);
        job = await http.get<OperationsExportJob>(
          `${endpoint(clubId, "exports")}/${job.id}`,
        );
      }
      throw new Error("Export timed out");
    },
  });
}

export function useImportBusinessOperations(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      kind: "students" | "payments";
      templateVersion: 1;
      format: "csv" | "xlsx";
      dryRun: boolean;
      rows?: Array<Record<string, string | number | null>>;
      contentBase64?: string;
    }) =>
      http.post<OperationsImportResult>(endpoint(clubId, "import"), payload),
    onSuccess: (_result, variables) => {
      if (!variables.dryRun)
        return queryClient.invalidateQueries({ queryKey: keys.root(clubId) });
    },
  });
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}
