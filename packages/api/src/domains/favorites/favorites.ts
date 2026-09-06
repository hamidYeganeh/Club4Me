"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../http/client";
import { tokenStore } from "../../http/token-store";
import { trackFavoriteAdded } from "../../tracking/tracking";
import { useOffline } from "../../offline/provider";
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
  const offline = useOffline();
  return useQuery({
    queryKey: queries.all(),
    queryFn: async () => {
      const data = await savesClient.list();
      return offline?.overlayFavorites(data) ?? data;
    },
    enabled: enabled && Boolean(tokenStore.get()),
  });
}

export function useToggleSave(
  entityType: FavoriteEntityType,
  entityId: string,
) {
  const queryClient = useQueryClient();
  const offline = useOffline();
  const favorites = useSavedItems();
  const active = Boolean(
    favorites.data?.items.some(
      (item) => item.entityType === entityType && item.entityId === entityId,
    ),
  );
  const mutation = useMutation({
    networkMode: "always",
    mutationFn: async () => {
      if (offline?.saveFavorite) {
        const createdAt = new Date().toISOString();
        await offline.saveFavorite({
          entityType,
          entityId,
          saved: !active,
          createdAt,
        });
        return active
          ? undefined
          : {
              id: `offline:${entityType}:${entityId}`,
              entityType,
              entityId,
              createdAt,
            };
      }
      if (active) {
        await savesClient.remove(entityType, entityId);
      } else {
        return savesClient.save(entityType, entityId);
      }
    },
    onSuccess: async (savedItem) => {
      queryClient.setQueryData<FavoritesResponse>(queries.all(), (previous) => {
        const items = (previous?.items ?? []).filter(
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
      if (!offline?.saveFavorite)
        await queryClient.invalidateQueries({ queryKey: queries.all() });
    },
  });
  return { active, isLoading: favorites.isLoading, mutation };
}

// Compatibility exports for older consumers.
export const useFavorites = useSavedItems;
export const useToggleFavorite = useToggleSave;
