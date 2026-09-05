"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../http/client";

export type AdminUser = {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  status: "active" | "suspended";
  createdAt: string;
  updatedAt: string;
};

const client = {
  list: (q?: string) =>
    http.get<{ items: AdminUser[] }>("/admin/users", q ? { q } : undefined),
  updateStatus: (userId: string, status: AdminUser["status"]) =>
    http.patch<AdminUser>(`/admin/users/${userId}/status`, { status }),
};

export function useAdminUsers(q?: string) {
  return useQuery({
    queryKey: ["admin", "users", q],
    queryFn: () => client.list(q),
  });
}

export function useUpdateAdminUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      status,
    }: {
      userId: string;
      status: AdminUser["status"];
    }) => client.updateStatus(userId, status),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
