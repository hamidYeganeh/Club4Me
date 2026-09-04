"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../http/client";

export type DiscoverySectionType = "banners" | "clubs" | "coaches" | "articles";
export type DiscoverySectionSort = "manual" | "newest" | "rating" | "name";
export type DiscoverySectionAppearance = {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  showHeader: boolean;
  showViewAll: boolean;
  headerAlignment: "start" | "center";
  viewAllVariant: "link" | "solid" | "outline";
};

export type DiscoverySectionConfiguration = {
  id: string;
  key: string;
  type: DiscoverySectionType;
  title: string;
  subtitle: string;
  layout: string;
  viewAllLabel: string;
  viewAllUrl: string;
  appearance: DiscoverySectionAppearance;
  enabled: boolean;
  position: number;
  selection: {
    mode: "manual" | "query";
    itemIds: string[];
    limit: number;
    sort: DiscoverySectionSort;
    filters: Record<string, string[]>;
  };
  banners: Array<{
    title: string;
    subtitle: string;
    imageUrl: string;
    actionLabel: string;
    actionUrl: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type SaveDiscoverySection = Omit<
  DiscoverySectionConfiguration,
  "id" | "position" | "createdAt" | "updatedAt"
>;

const base = "/admin/discovery/sections";
export const adminDiscoveryClient = {
  list: () => http.get<{ items: DiscoverySectionConfiguration[] }>(base),
  create: (payload: SaveDiscoverySection) =>
    http.post<DiscoverySectionConfiguration>(base, payload),
  update: (id: string, payload: Partial<SaveDiscoverySection>) =>
    http.patch<DiscoverySectionConfiguration>(`${base}/${id}`, payload),
  remove: (id: string) => http.delete<{ success: true }>(`${base}/${id}`),
  reorder: (sectionIds: string[]) =>
    http.patch<{ items: DiscoverySectionConfiguration[] }>(`${base}/reorder`, {
      sectionIds,
    }),
  options: (type: DiscoverySectionType) =>
    http.get<{ items: Array<{ id: string; label: string; status: string }> }>(
      `${base}/options/${type}`,
    ),
};

const key = ["admin", "discovery"] as const;
export function useAdminDiscoverySections() {
  return useQuery({ queryKey: key, queryFn: adminDiscoveryClient.list });
}
export function useDiscoveryOptions(
  type: DiscoverySectionType,
  enabled = true,
) {
  return useQuery({
    queryKey: [...key, "options", type],
    queryFn: () => adminDiscoveryClient.options(type),
    enabled,
  });
}
export function useSaveDiscoverySection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id?: string;
      payload: SaveDiscoverySection;
    }) =>
      id
        ? adminDiscoveryClient.update(id, payload)
        : adminDiscoveryClient.create(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
export function useDeleteDiscoverySection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: adminDiscoveryClient.remove,
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
export function useReorderDiscoverySections() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: adminDiscoveryClient.reorder,
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
