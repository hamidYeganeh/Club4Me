"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../http/client";

export type SupportTicket = {
  id: string;
  subject: string;
  category: "payment" | "reservation" | "account" | "club" | "other";
  preferredContact: "in_app" | "phone";
  status: "open" | "in_progress" | "waiting_for_user" | "resolved" | "closed";
  messages: Array<{
    id: string;
    authorType: "user" | "agent";
    body: string;
    createdAt: string;
  }>;
  updatedAt: string;
};

const key = ["support", "tickets"] as const;

export function useSupportTickets() {
  return useQuery({
    queryKey: key,
    queryFn: () => http.get<{ items: SupportTicket[] }>("/support/tickets"),
  });
}

export function useCreateSupportTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      subject: string;
      category: SupportTicket["category"];
      message: string;
      preferredContact: SupportTicket["preferredContact"];
    }) => http.post<SupportTicket>("/support/tickets", payload),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}

export function useReplySupportTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      message,
    }: {
      ticketId: string;
      message: string;
    }) =>
      http.post<SupportTicket>(`/support/tickets/${ticketId}/replies`, {
        message,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}

export function useAdminSupportTickets(status?: string) {
  return useQuery({
    queryKey: ["admin", ...key, status],
    queryFn: () =>
      http.get<{ items: SupportTicket[] }>(
        `/admin/support/tickets${status ? `?status=${encodeURIComponent(status)}` : ""}`,
      ),
  });
}

export function useUpdateSupportTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      ...payload
    }: {
      ticketId: string;
      status: SupportTicket["status"];
      reply?: string;
      assigneeId?: string | null;
    }) =>
      http.patch<SupportTicket>(`/admin/support/tickets/${ticketId}`, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", ...key] }),
  });
}
