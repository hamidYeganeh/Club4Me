import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../http/client";
export type SavedSearch = {
  id: string;
  title: string;
  alerts: boolean;
  filters: Record<string, string>;
  checkedAt: string;
};
const key = ["discovery", "saved-searches"] as const;
export function useSavedSearches(enabled: boolean) {
  return useQuery({
    queryKey: key,
    queryFn: () =>
      http.get<{ items: SavedSearch[] }>("/discovery/saved-searches"),
    enabled,
  });
}
export function useSaveSearch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Pick<SavedSearch, "title" | "alerts" | "filters">) =>
      http.post("/discovery/saved-searches", body),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
export function useRemoveSavedSearch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.delete(`/discovery/saved-searches/${id}`),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
