"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { discoveryClient } from "./discovery.client";
import type {
  CreateClassPayload,
  CreateClubPayload,
  CreateSlotPayload,
  ListClubsParams,
  PublicCatalogParams,
  PublicCatalogSearchParams,
  ReserveSlotPayload,
} from "./discovery.dto";
import { discoveryQueries } from "./discovery.queries";
import { groupClub, trackSearchPerformed } from "../../tracking/tracking";

export function useClubs(params?: ListClubsParams) {
  return useQuery({
    queryKey: discoveryQueries.clubs.list(params),
    queryFn: ({ signal }) => discoveryClient.listClubs(params, signal),
  });
}

export function useInfiniteClubs(
  params?: Omit<ListClubsParams, "page" | "limit">,
) {
  return useInfiniteQuery({
    queryKey: [...discoveryQueries.clubs.all(), "infinite", params],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      discoveryClient.listClubs(
        { ...params, page: pageParam, limit: 20 },
        signal,
      ),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce(
        (total, page) => total + page.items.length,
        0,
      );
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}

export function useDiscoveryFeed() {
  return useQuery({
    queryKey: discoveryQueries.feed(),
    queryFn: ({ signal }) => discoveryClient.getFeed(signal),
  });
}

export function useCoachSections() {
  return useQuery({
    queryKey: discoveryQueries.coachSections(),
    queryFn: ({ signal }) => discoveryClient.getCoachSections(signal),
  });
}

export function useCoaches(params?: PublicCatalogParams) {
  return useQuery({
    queryKey: discoveryQueries.coaches(params),
    queryFn: ({ signal }) => discoveryClient.listCoaches(params, signal),
  });
}

export function useCatalogClubs(params?: PublicCatalogParams, enabled = true) {
  return useQuery({
    queryKey: discoveryQueries.catalog.clubs(params),
    queryFn: ({ signal }) => discoveryClient.listCatalogClubs(params, signal),
    enabled,
  });
}

export function useCatalogClub(identifier: string) {
  return useQuery({
    queryKey: discoveryQueries.catalog.club(identifier),
    queryFn: ({ signal }) => discoveryClient.getCatalogClub(identifier, signal),
    enabled: Boolean(identifier),
  });
}

export function useCatalogCoaches(params?: PublicCatalogParams) {
  return useQuery({
    queryKey: discoveryQueries.catalog.coaches(params),
    queryFn: ({ signal }) => discoveryClient.listCatalogCoaches(params, signal),
  });
}

export function useCatalogCoach(identifier: string) {
  return useQuery({
    queryKey: discoveryQueries.catalog.coach(identifier),
    queryFn: ({ signal }) =>
      discoveryClient.getCatalogCoach(identifier, signal),
    enabled: Boolean(identifier),
  });
}

export function useCatalogClasses(
  params?: PublicCatalogParams,
  enabled = true,
) {
  return useQuery({
    enabled,
    queryKey: discoveryQueries.catalog.classes(params),
    queryFn: ({ signal }) => discoveryClient.listCatalogClasses(params, signal),
  });
}

export function useCatalogClass(identifier: string) {
  return useQuery({
    queryKey: discoveryQueries.catalog.class(identifier),
    queryFn: ({ signal }) =>
      discoveryClient.getCatalogClass(identifier, signal),
    enabled: Boolean(identifier),
  });
}

export function useCatalogArticles(params?: PublicCatalogParams) {
  return useQuery({
    queryKey: discoveryQueries.catalog.articles(params),
    queryFn: ({ signal }) =>
      discoveryClient.listCatalogArticles(params, signal),
  });
}

export function useCatalogArticle(slug: string) {
  return useQuery({
    queryKey: discoveryQueries.catalog.article(slug),
    queryFn: ({ signal }) => discoveryClient.getCatalogArticle(slug, signal),
    enabled: Boolean(slug),
  });
}

export function useCatalogSearch(
  params?: PublicCatalogSearchParams,
  enabled = true,
) {
  return useQuery({
    queryKey: discoveryQueries.catalog.search(params),
    queryFn: async ({ signal }) => {
      const result = await discoveryClient.searchCatalog(params, signal);
      if (params?.q?.trim()) {
        const kind = params.kind;
        trackSearchPerformed({
          result_type:
            kind === "club" || kind === "coach" || kind === "class"
              ? kind
              : "all",
          has_location_filter: Boolean(
            params.cityId ||
            params.cityRegionId ||
            params.latitude ||
            params.longitude,
          ),
          result_count: result.total,
        });
      }
      return result;
    },
    enabled,
    gcTime: 30_000,
  });
}

export function useCatalogClubTypes(enabled = true) {
  return useQuery({
    queryKey: discoveryQueries.catalog.clubTypes(),
    queryFn: ({ signal }) => discoveryClient.listCatalogClubTypes(signal),
    enabled,
  });
}

export function usePublicCatalogResource(
  category: string,
  resource: string,
  params?: Record<string, unknown>,
  enabled = true,
) {
  return useQuery({
    queryKey: discoveryQueries.catalog.resource(category, resource, params),
    queryFn: ({ signal }) =>
      discoveryClient.listPublicResources(category, resource, params, signal),
    enabled: enabled && Boolean(category && resource),
  });
}

export function useClub(clubId: string, enabled = true) {
  return useQuery({
    queryKey: discoveryQueries.clubs.detail(clubId),
    queryFn: ({ signal }) => discoveryClient.getClub(clubId, signal),
    enabled: enabled && clubId.length > 0,
  });
}

export function useClubClasses(clubId: string, enabled = true) {
  return useQuery({
    queryKey: discoveryQueries.clubs.classes(clubId),
    queryFn: ({ signal }) => discoveryClient.listClasses(clubId, signal),
    enabled: enabled && clubId.length > 0,
  });
}

export function useClubSlots(clubId: string, enabled = true) {
  return useQuery({
    queryKey: discoveryQueries.clubs.slots(clubId),
    queryFn: ({ signal }) => discoveryClient.listSlots(clubId, signal),
    enabled: enabled && clubId.length > 0,
  });
}

export function useCreateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClubPayload) =>
      discoveryClient.createClub(payload),
    onSuccess: async (club) => {
      groupClub(club.id, {
        status: "active",
        created_at: club.createdAt,
      });
      await queryClient.invalidateQueries({
        queryKey: discoveryQueries.clubs.all(),
      });
    },
  });
}

export function useCreateClass(clubId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClassPayload) =>
      discoveryClient.createClass(clubId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: discoveryQueries.clubs.classes(clubId),
      });
    },
  });
}

export function useCreateSlot(clubId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSlotPayload) =>
      discoveryClient.createSlot(clubId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: discoveryQueries.clubs.slots(clubId),
      });
    },
  });
}

export function useReserveSlot(clubId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReserveSlotPayload) =>
      discoveryClient.reserveSlot(clubId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: discoveryQueries.clubs.slots(clubId),
      });
    },
  });
}

export function useInfinitePublicCatalogResource(
  category: string,
  resource: string,
  params?: Record<string, unknown>,
) {
  return useInfiniteQuery({
    queryKey: [
      ...discoveryQueries.catalog.resource(category, resource, params),
      "infinite",
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      discoveryClient.listPublicResources(
        category,
        resource,
        { ...params, page: pageParam },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}
