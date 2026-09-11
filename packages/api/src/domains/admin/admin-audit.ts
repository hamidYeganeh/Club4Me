"use client";

import { useQuery } from "@tanstack/react-query";

import { http } from "../../http/client";

export type AdminAuditLog = {
  id: string;
  actorId: string;
  actor?: {id: string; firstName?: string; lastName?: string; phone?: string} | null;
  action: string;
  method: string;
  path: string;
  statusCode: number;
  metadata: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
};

export function useAdminAuditLogs(limit = 200) {
  return useQuery({
    queryKey: ["admin", "audit-logs", limit],
    queryFn: () =>
      http.get<{ items: AdminAuditLog[] }>("/admin/audit-logs", { limit }),
  });
}
