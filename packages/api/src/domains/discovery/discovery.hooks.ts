"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { discoveryClient } from "./discovery.client";
import type {
  CreateClassPayload,
  CreateClubPayload,
  CreateSlotPayload,
  ListClubsParams,
  PublicCatalogParams,
  ReserveSlotPayload,
} from "./discovery.dto";
import { discoveryQueries } from "./discovery.queries";
import { groupClub, trackSearchPerformed } from "../../tracking/tracking";

export function useClubs(params?: ListClubsParams) {
  return useQuery({
    queryKey: discoveryQueries.clubs.list(params),
    queryFn: () => discoveryClient.listClubs(params),
  });
}

export function useDiscoveryFeed() {
  return useQuery({
    queryKey: discoveryQueries.feed(),
    queryFn: () => discoveryClient.getFeed(),
  });
}

export function useCatalogClubs(params?: PublicCatalogParams) {
  return useQuery({
    queryKey: discoveryQueries.catalog.clubs(params),
    queryFn: () => discoveryClient.listCatalogClubs(params),
  });
}

export function useCatalogClub(identifier: string) {
  return useQuery({
    queryKey: discoveryQueries.catalog.club(identifier),
    queryFn: () => discoveryClient.getCatalogClub(identifier),
    enabled: Boolean(identifier),
  });
}

export function useCatalogCoaches(params?: PublicCatalogParams) {
  return useQuery({
    queryKey: discoveryQueries.catalog.coaches(params),
    queryFn: () => discoveryClient.listCatalogCoaches(params),
  });
}

export function useCatalogCoach(identifier: string) {
  return useQuery({
    queryKey: discoveryQueries.catalog.coach(identifier),
    queryFn: () => discoveryClient.getCatalogCoach(identifier),
    enabled: Boolean(identifier),
  });
}

export function useCatalogClasses(params?: PublicCatalogParams) {
  return useQuery({
    queryKey: discoveryQueries.catalog.classes(params),
    queryFn: () => discoveryClient.listCatalogClasses(params),
  });
}

export function useCatalogClass(identifier: string) {
  return useQuery({
    queryKey: discoveryQueries.catalog.class(identifier),
    queryFn: () => discoveryClient.getCatalogClass(identifier),
    enabled: Boolean(identifier),
  });
}

export function useCatalogSearch(
  params?: PublicCatalogParams & { kind?: string },
) {
  return useQuery({
    queryKey: discoveryQueries.catalog.search(params),
    queryFn: async () => {
      const result = await discoveryClient.searchCatalog(params);
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
    queryFn: () =>
      discoveryClient.listPublicResources(category, resource, params),
    enabled: enabled && Boolean(category && resource),
  });
}

export function useClub(clubId: string, enabled = true) {
  return useQuery({
    queryKey: discoveryQueries.clubs.detail(clubId),
    queryFn: () => discoveryClient.getClub(clubId),
    enabled: enabled && clubId.length > 0,
  });
}

export function useClubClasses(clubId: string, enabled = true) {
  return useQuery({
    queryKey: discoveryQueries.clubs.classes(clubId),
    queryFn: () => discoveryClient.listClasses(clubId),
    enabled: enabled && clubId.length > 0,
  });
}

export function useClubSlots(clubId: string, enabled = true) {
  return useQuery({
    queryKey: discoveryQueries.clubs.slots(clubId),
    queryFn: () => discoveryClient.listSlots(clubId),
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
