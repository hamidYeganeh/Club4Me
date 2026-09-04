"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../http/client";

export type ContentReport = {
  id: string;
  reporterId: string;
  targetType: "club" | "coach" | "class";
  targetId: string;
  reason: string;
  details: string;
  status: "pending" | "resolved" | "rejected" | "closed";
  resolutionNote: string;
  createdAt: string;
  updatedAt: string;
};

export function useCreateReport() {
  return useMutation({
    mutationFn: (payload: {
      targetType: ContentReport["targetType"];
      targetId: string;
      reason: string;
      details?: string;
    }) =>
      http.post<ContentReport>("/reports", {
        ...payload,
        details: payload.details ?? "",
      }),
  });
}

export function useAdminReports(status = "") {
  return useQuery({
    queryKey: ["admin", "reports", status],
    queryFn: () =>
      http.get<{ items: ContentReport[] }>("/admin/reports", {
        status: status || undefined,
      }),
  });
}

export function useResolveReport() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      status,
      resolutionNote = "",
    }: {
      reportId: string;
      status: "resolved" | "rejected" | "closed";
      resolutionNote?: string;
    }) =>
      http.patch<ContentReport>(`/admin/reports/${reportId}`, {
        status,
        resolutionNote,
      }),
    onSuccess: async () =>
      client.invalidateQueries({ queryKey: ["admin", "reports"] }),
  });
}
