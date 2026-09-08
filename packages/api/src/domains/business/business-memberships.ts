"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../http/client";

export type ClubMembership = {
  id: string;
  clubId: string;
  userId: string;
  coachId?: string;
  phone?: string | null;
  name?: string;
  clubName?: string;
  role: "owner" | "manager" | "receptionist" | "finance" | "coach";
  permissions: string[];
  status: "invited" | "accepted" | "rejected" | "suspended";
  invitedBy: string;
  acceptedAt: string | null;
  createdAt: string;
};

export function useBusinessClubMemberships(clubId: string) {
  return useQuery({
    queryKey: ["business", "clubs", clubId, "memberships"],
    queryFn: () =>
      http.get<{ items: ClubMembership[] }>(
        `/business/clubs/${clubId}/memberships`,
      ),
    enabled: Boolean(clubId),
  });
}

export function useInviteBusinessClubMember(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      userId?: string;
      phone?: string;
      role: Exclude<ClubMembership["role"], "owner">;
      permissions: string[];
    }) =>
      http.post<ClubMembership>(
        `/business/clubs/${clubId}/memberships`,
        payload,
      ),
    onSuccess: async () =>
      queryClient.invalidateQueries({
        queryKey: ["business", "clubs", clubId, "memberships"],
      }),
  });
}

export function useDecideClubMembership() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      membershipId,
      decision,
    }: {
      membershipId: string;
      decision: "accept" | "reject";
    }) =>
      http.patch<ClubMembership>(
        `/club-memberships/${membershipId}/${decision}`,
      ),
    onSuccess: (member, input) => {
      client.setQueryData<ClubMembership>(
        ["club-invitation", input.membershipId],
        (previous) => ({ ...previous, ...member }),
      );
    },
  });
}

export function useRevokeBusinessClubMember(clubId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      http.patch<ClubMembership>(
        `/business/clubs/${clubId}/memberships/${id}/revoke`,
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["business", "clubs"] }),
  });
}
export function useClubInvitation(id: string) {
  return useQuery({
    queryKey: ["club-invitation", id],
    queryFn: () => http.get<ClubMembership>(`/club-memberships/${id}`),
    enabled: Boolean(id),
  });
}
