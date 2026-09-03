"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resourcesClient } from "./resources.client";
import type {
  ResourceListParams,
  ResourceMutationContext,
  ResourceMutationPayload,
} from "./resources.dto";
import { resourcesQueries } from "./resources.queries";

export function useResources(
  category: string,
  resource: string,
  params: ResourceListParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: resourcesQueries.list(category, resource, params),
    queryFn: () => resourcesClient.list(category, resource, params),
    enabled: enabled && Boolean(category && resource),
  });
}
export function useResource(
  category: string,
  resource: string,
  id: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: resourcesQueries.detail(category, resource, id ?? ""),
    queryFn: () => resourcesClient.get(category, resource, id!),
    enabled: enabled && Boolean(category && resource && id),
  });
}
type CreateVariables = ResourceMutationContext & {
  payload: ResourceMutationPayload;
};
type UpdateVariables = CreateVariables & { id: string };
type DeleteVariables = ResourceMutationContext & { id: string };
export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ category, resource, payload }: CreateVariables) =>
      resourcesClient.create(category, resource, payload),
    onSuccess: async (_data, value) =>
      queryClient.invalidateQueries({
        queryKey: resourcesQueries.resource(value.category, value.resource),
      }),
  });
}
export function useUpdateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ category, resource, id, payload }: UpdateVariables) =>
      resourcesClient.update(category, resource, id, payload),
    onSuccess: async (_data, value) => {
      await queryClient.invalidateQueries({
        queryKey: resourcesQueries.resource(value.category, value.resource),
      });
      await queryClient.invalidateQueries({
        queryKey: resourcesQueries.detail(
          value.category,
          value.resource,
          value.id,
        ),
      });
    },
  });
}
export function useToggleResourceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      category,
      resource,
      id,
      isActive,
    }: DeleteVariables & { isActive: boolean }) =>
      resourcesClient.update(category, resource, id, { isActive }),
    onSuccess: async (_data, value) =>
      queryClient.invalidateQueries({
        queryKey: resourcesQueries.resource(value.category, value.resource),
      }),
  });
}
export function useDeleteResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ category, resource, id }: DeleteVariables) =>
      resourcesClient.remove(category, resource, id),
    onSuccess: async (_data, value) => {
      await queryClient.invalidateQueries({
        queryKey: resourcesQueries.resource(value.category, value.resource),
      });
      queryClient.removeQueries({
        queryKey: resourcesQueries.detail(
          value.category,
          value.resource,
          value.id,
        ),
      });
    },
  });
}

export function useSeedResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ category, resource }: ResourceMutationContext) =>
      resourcesClient.seed(category, resource),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: resourcesQueries.all() }),
        queryClient.invalidateQueries({ queryKey: ["articles"] }),
      ]);
    },
  });
}
