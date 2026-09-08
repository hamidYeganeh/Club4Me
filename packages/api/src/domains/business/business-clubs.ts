"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { http } from "../../http/client";
import { resourceApiPath } from "../resources/resources.registry";
import { mediaClient, useCreateMedia, useMedia } from "../media";
import type {
  BusinessClub,
  BusinessCatalogResponse,
  BusinessMedia,
  BusinessTag,
  BusinessTagsResponse,
  CreateBusinessClubPayload,
  ListBusinessClubsResponse,
  UpdateBusinessClubPayload,
} from "./business-clubs.dto";

export const businessClubEndpoints = {
  list: "/business/clubs",
  detail: (clubId: string) => `/business/clubs/${clubId}` as const,
  submit: (clubId: string) => `/business/clubs/${clubId}/submit` as const,
  activation: (clubId: string) => `/business/clubs/${clubId}/activation` as const,
  catalog: (category: string, resource: string) =>
    resourceApiPath(category, resource),
  media: "/media",
  tags: "/business/tags",
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
  activation: (clubId: string) => http.get<{ clubId: string; ready: boolean; completed: number; total: number; items: Array<{ id: string; label: string; complete: boolean }>; publicPreviewUrl: string }>(businessClubEndpoints.activation(clubId)),
  catalog: (
    category: string,
    resource: string,
    params?: Record<string, unknown>,
  ) =>
    http.get<BusinessCatalogResponse>(
      businessClubEndpoints.catalog(category, resource),
      { ...params, action: "options" },
    ),
  listMedia: () => mediaClient.list() as Promise<{ items: BusinessMedia[] }>,
  createMedia: (payload: { url: string; mimeType: string }) =>
    mediaClient.upload(payload) as Promise<BusinessMedia>,
  listTags: (params?: Record<string, unknown>) =>
    http.get<BusinessTagsResponse>(businessClubEndpoints.tags, params),
  createTag: (payload: { name: string }) =>
    http.post<BusinessTag>(businessClubEndpoints.tags, payload),
};

export const businessClubQueries = {
  all: () => ["business", "clubs"] as const,
  list: () => [...businessClubQueries.all(), "list"] as const,
  detail: (clubId: string) =>
    [...businessClubQueries.all(), "detail", clubId] as const,
  tags: () => [...businessClubQueries.all(), "tags"] as const,
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

export function useBusinessClubActivation(clubId: string) {
  return useQuery({ queryKey: [...businessClubQueries.detail(clubId), "activation"], queryFn: () => businessClubsClient.activation(clubId), enabled: Boolean(clubId) });
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

const CATALOG_PAGE_SIZE = 50;

export function useInfiniteBusinessCatalog(
  category: string,
  resource: string,
  params?: Omit<Record<string, unknown>, "page" | "limit">,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: ["business", "catalog", "infinite", category, resource, params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      businessClubsClient.catalog(category, resource, {
        ...params,
        page: pageParam,
        limit: CATALOG_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: enabled && Boolean(category && resource),
  });
}

export function useBusinessMedia() {
  return useMedia();
}

export function useCreateBusinessMedia() {
  return useCreateMedia();
}

export function useBusinessTags() {
  return useQuery({
    queryKey: businessClubQueries.tags(),
    queryFn: () => businessClubsClient.listTags({ limit: 100 }),
  });
}

export function useCreateBusinessTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) =>
      businessClubsClient.createTag(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: businessClubQueries.tags(),
      });
    },
  });
}
