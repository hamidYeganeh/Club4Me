"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../http/client";

export type AdminCoach = {
  id: string;
  userId: string;
  displayName: string;
  slug: string;
  shortBio: string;
  serviceModes: string[];
  reviewStatus: "draft" | "pending_review" | "approved" | "rejected";
  visibility: "hidden" | "public";
  rejectionReason: string | null;
  updatedAt: string;
};

const client = {
  list: () => http.get<{ items: AdminCoach[] }>("/admin/coaches"),
  review: (
    coachId: string,
    payload: { status: "approved" | "rejected"; reason?: string },
  ) => http.patch<AdminCoach>(`/admin/coaches/${coachId}/review`, payload),
};

export function useAdminCoaches() {
  return useQuery({
    queryKey: ["admin", "coaches"],
    queryFn: client.list,
  });
}

export function useReviewCoach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      coachId,
      status,
      reason,
    }: {
      coachId: string;
      status: "approved" | "rejected";
      reason?: string;
    }) => client.review(coachId, { status, reason }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "coaches"] });
    },
  });
}
