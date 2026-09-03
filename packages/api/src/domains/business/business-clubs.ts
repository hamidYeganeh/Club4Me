"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../http/client";
import type {
  BusinessClub,
  BusinessCatalogResponse,
  BusinessMedia,
  CreateBusinessClubPayload,
  ListBusinessClubsResponse,
  UpdateBusinessClubPayload,
} from "./business-clubs.dto";

export const businessClubEndpoints = {
  list: "/business/clubs",
  detail: (clubId: string) => `/business/clubs/${clubId}` as const,
  submit: (clubId: string) => `/business/clubs/${clubId}/submit` as const,
  catalog: (category: string, resource: string) =>
    `/business/catalog/${category}/${resource}` as const,
  media: "/business/media",
};

export const businessClubsClient = {
  list: () => http.get<ListBusinessClubsResponse>(businessClubEndpoints.list),
  get: (clubId: string) =>
    http.get<BusinessClub>(businessClubEndpoints.detail(clubId)),
  create: (payload: CreateBusinessClubPayload) =>
    http.post<BusinessClub>(businessClubEndpoints.list, payload),
  update: (clubId: string, payload: UpdateBusinessClubPayload) =>
    http.patch<BusinessClub>(businessClubEndpoints.detail(clubId), payload),
  submit: (clubId: string) =>
    http.post<BusinessClub>(businessClubEndpoints.submit(clubId)),
  catalog: (
    category: string,
    resource: string,
    params?: Record<string, unknown>,
  ) =>
    http.get<BusinessCatalogResponse>(
      businessClubEndpoints.catalog(category, resource),
      params,
    ),
  listMedia: () =>
    http.get<{ items: BusinessMedia[] }>(businessClubEndpoints.media),
  createMedia: (payload: { url: string; mimeType: string }) =>
    http.post<BusinessMedia>(businessClubEndpoints.media, payload),
};

export const businessClubQueries = {
  all: () => ["business", "clubs"] as const,
  list: () => [...businessClubQueries.all(), "list"] as const,
  detail: (clubId: string) =>
    [...businessClubQueries.all(), "detail", clubId] as const,
};

export function useBusinessClubs() {
  return useQuery({
    queryKey: businessClubQueries.list(),
    queryFn: () => businessClubsClient.list(),
  });
}

export function useBusinessClub(clubId: string, enabled = true) {
  return useQuery({
    queryKey: businessClubQueries.detail(clubId),
    queryFn: () => businessClubsClient.get(clubId),
    enabled: enabled && Boolean(clubId),
  });
}

export function useCreateBusinessClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBusinessClubPayload) =>
      businessClubsClient.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: businessClubQueries.list(),
      });
    },
  });
}

export function useUpdateBusinessClub(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBusinessClubPayload) =>
      businessClubsClient.update(clubId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: businessClubQueries.list() }),
        queryClient.invalidateQueries({
          queryKey: businessClubQueries.detail(clubId),
        }),
      ]);
    },
  });
}

export function useSubmitBusinessClub(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => businessClubsClient.submit(clubId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: businessClubQueries.list() }),
        queryClient.invalidateQueries({
          queryKey: businessClubQueries.detail(clubId),
        }),
      ]);
    },
  });
}

export function useBusinessCatalog(
  category: string,
  resource: string,
  params?: Record<string, unknown>,
  enabled = true,
) {
  return useQuery({
    queryKey: ["business", "catalog", category, resource, params],
    queryFn: () => businessClubsClient.catalog(category, resource, params),
    enabled: enabled && Boolean(category && resource),
  });
}

export function useBusinessMedia() {
  return useQuery({
    queryKey: ["business", "media"],
    queryFn: () => businessClubsClient.listMedia(),
  });
}

export function useCreateBusinessMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { url: string; mimeType: string }) =>
      businessClubsClient.createMedia(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["business", "media"] });
    },
  });
}
