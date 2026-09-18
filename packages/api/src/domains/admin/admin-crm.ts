"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../http/client";
import type { CrmCampaign } from "../business/business-crm";

export function useAdminCrmCampaigns() {
  return useQuery({
    queryKey: ["admin", "crm-campaigns"],
    queryFn: () => http.get<{ items: CrmCampaign[] }>("/admin/crm-campaigns"),
  });
}

export function useReviewCrmCampaign() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      http.patch<CrmCampaign>(`/admin/crm-campaigns/${id}/review`, {
        approved,
      }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["admin", "crm-campaigns"] }),
  });
}
