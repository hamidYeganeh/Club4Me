"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tokenStore } from "../../http/token-store";
import { locationsClient } from "./locations.client";
import type { UpdateUserLocationPayload } from "./locations.dto";
import { locationsQueries } from "./locations.queries";

export function useUserLocations(enabled = true) {
  return useQuery({
    queryKey: locationsQueries.list(),
    queryFn: locationsClient.list,
    enabled: enabled && Boolean(tokenStore.get()),
  });
}

function useRefreshLocations() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: locationsQueries.all() });
}

export function useCreateUserLocation() {
  const refresh = useRefreshLocations();
  return useMutation({
    mutationFn: locationsClient.create,
    onSuccess: refresh,
  });
}

export function useUpdateUserLocation() {
  const refresh = useRefreshLocations();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: UpdateUserLocationPayload & { id: string }) =>
      locationsClient.update(id, payload),
    onSuccess: refresh,
  });
}

export function useDeleteUserLocation() {
  const refresh = useRefreshLocations();
  return useMutation({
    mutationFn: locationsClient.remove,
    onSuccess: refresh,
  });
}

export function useSetDefaultUserLocation() {
  const refresh = useRefreshLocations();
  return useMutation({
    mutationFn: locationsClient.setDefault,
    onSuccess: refresh,
  });
}
