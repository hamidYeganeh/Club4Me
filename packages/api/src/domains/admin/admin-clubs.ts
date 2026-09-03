"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../http/client";
import type { BusinessClub } from "../business/business-clubs.dto";

export const adminClubsClient = {
  list: () => http.get<{ items: BusinessClub[] }>("/admin/clubs"),
  review: (
    clubId: string,
    payload: { status: "approved" | "rejected"; reason?: string },
  ) => http.patch<BusinessClub>(`/admin/clubs/${clubId}/review`, payload),
};

export function useAdminClubs() {
  return useQuery({
    queryKey: ["admin", "clubs"],
    queryFn: () => adminClubsClient.list(),
  });
}

export function useReviewClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clubId,
      status,
      reason,
    }: {
      clubId: string;
      status: "approved" | "rejected";
      reason?: string;
    }) => adminClubsClient.review(clubId, { status, reason }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "clubs"] });
    },
  });
}
