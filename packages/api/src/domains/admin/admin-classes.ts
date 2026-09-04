"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../http/client";
import type { CoachClass } from "../coaching";

export function useAdminClasses(query = "", status = "") {
  return useQuery({
    queryKey: ["admin", "classes", query, status],
    queryFn: () =>
      http.get<{ items: CoachClass[] }>("/admin/classes", {
        q: query || undefined,
        status: status || undefined,
      }),
  });
}

export function useDisableAdminClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) =>
      http.patch<CoachClass>(`/admin/classes/${classId}/disable`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "classes"] });
    },
  });
}
