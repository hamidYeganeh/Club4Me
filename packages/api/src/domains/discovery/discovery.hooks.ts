"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { discoveryClient } from "./discovery.client";
import type {
  CreateClassPayload,
  CreateClubPayload,
  CreateSlotPayload,
  ListClubsParams,
  ReserveSlotPayload,
} from "./discovery.dto";
import { discoveryQueries } from "./discovery.queries";

export function useClubs(params?: ListClubsParams) {
  return useQuery({
    queryKey: discoveryQueries.clubs.list(params),
    queryFn: () => discoveryClient.listClubs(params),
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
    onSuccess: async () => {
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
