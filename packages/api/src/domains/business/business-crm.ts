"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../http/client";

export type CrmCampaign = {
  id: string;
  clubId: string;
  title: string;
  body: string;
  kind: "push" | "news";
  scheduledAt: string;
  audience: "all_students" | "selected_students";
  studentIds: string[];
  status:
    "pending" | "approved" | "processing" | "sent" | "published" | "rejected";
  sentAt: string | null;
  createdAt: string;
};

export type CreateCrmCampaign = Pick<
  CrmCampaign,
  "title" | "body" | "kind" | "scheduledAt" | "audience" | "studentIds"
>;
export type CrmAudienceFilter = {
  kind:
    | "all"
    | "membership_expiring"
    | "inactive"
    | "reservation_date"
    | "discount_unused";
  days?: number;
  date?: string;
  discountId?: string;
};
export type AudiencePreview = {
  items: Array<{ id: string; firstName: string; lastName: string }>;
  total: number;
};

export function useBusinessCrmCampaigns(clubId: string) {
  return useQuery({
    queryKey: ["business", clubId, "crm-campaigns"],
    queryFn: () =>
      http.get<{ items: CrmCampaign[] }>(
        `/business/clubs/${clubId}/crm-campaigns`,
      ),
    enabled: Boolean(clubId),
  });
}

export function useCreateBusinessCrmCampaign(clubId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCrmCampaign) =>
      http.post<CrmCampaign>(
        `/business/clubs/${clubId}/crm-campaigns`,
        payload,
      ),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: ["business", clubId, "crm-campaigns"],
      }),
  });
}
export function useUpdateBusinessCrmCampaign(clubId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateCrmCampaign }) =>
      http.patch<CrmCampaign>(
        `/business/clubs/${clubId}/crm-campaigns/${id}`,
        payload,
      ),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: ["business", clubId, "crm-campaigns"],
      }),
  });
}
export function useCrmAudiencePreview(clubId: string) {
  return useMutation({
    mutationFn: (filter: CrmAudienceFilter) =>
      http.post<AudiencePreview>(
        `/business/clubs/${clubId}/crm-campaigns/audience-preview`,
        filter,
      ),
  });
}
