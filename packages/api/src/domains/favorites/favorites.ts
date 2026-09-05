"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../http/client";
import { tokenStore } from "../../http/token-store";
import { trackFavoriteAdded } from "../../tracking/tracking";
import type {
  Favorite,
  FavoriteEntityType,
  FavoritesResponse,
} from "./favorites.dto";

const endpoints = {
  list: "/saves",
  item: (entityType: FavoriteEntityType, entityId: string) =>
    `/saves/${entityType}/${entityId}`,
};

export const savesClient = {
  list: () => http.get<FavoritesResponse>(endpoints.list),
  save: (entityType: FavoriteEntityType, entityId: string) =>
    http.put<Favorite>(endpoints.item(entityType, entityId)),
  remove: (entityType: FavoriteEntityType, entityId: string) =>
    http.delete<{ success: true }>(endpoints.item(entityType, entityId)),
};

const queries = { all: () => ["favorites"] as const };

export function useSavedItems(enabled = true) {
  return useQuery({
    queryKey: queries.all(),
    queryFn: savesClient.list,
    enabled: enabled && Boolean(tokenStore.get()),
  });
}

export function useToggleSave(
  entityType: FavoriteEntityType,
  entityId: string,
) {
  const queryClient = useQueryClient();
  const favorites = useSavedItems();
  const active = Boolean(
    favorites.data?.items.some(
      (item) => item.entityType === entityType && item.entityId === entityId,
    ),
  );
  const mutation = useMutation({
    mutationFn: async () => {
      if (active) {
        await savesClient.remove(entityType, entityId);
      } else {
        return savesClient.save(entityType, entityId);
      }
    },
    onSuccess: async (savedItem) => {
      queryClient.setQueryData<FavoritesResponse>(queries.all(), (previous) => {
        if (!previous) return previous;
        const items = previous.items.filter(
          (item) =>
            item.entityType !== entityType || item.entityId !== entityId,
        );
        return { items: savedItem ? [savedItem, ...items] : items };
      });
      if (!active) {
        trackFavoriteAdded({
          favorite_type: entityType,
          favorite_id: entityId,
          ...(entityType === "club" ? { club_id: entityId } : {}),
        });
      }
      await queryClient.invalidateQueries({ queryKey: queries.all() });
    },
  });
  return { active, isLoading: favorites.isLoading, mutation };
}

// Compatibility exports for older consumers.
export const useFavorites = useSavedItems;
export const useToggleFavorite = useToggleSave;
