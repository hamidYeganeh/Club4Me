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
  list: "/favorites",
  item: (entityType: FavoriteEntityType, entityId: string) =>
    `/favorites/${entityType}/${entityId}`,
};

const queries = { all: () => ["favorites"] as const };

export function useFavorites(enabled = true) {
  return useQuery({
    queryKey: queries.all(),
    queryFn: () => http.get<FavoritesResponse>(endpoints.list),
    enabled: enabled && Boolean(tokenStore.get()),
  });
}

export function useToggleFavorite(
  entityType: FavoriteEntityType,
  entityId: string,
) {
  const queryClient = useQueryClient();
  const favorites = useFavorites();
  const active = Boolean(
    favorites.data?.items.some(
      (item) => item.entityType === entityType && item.entityId === entityId,
    ),
  );
  const mutation = useMutation({
    mutationFn: async () => {
      if (active) {
        await http.delete<{ success: true }>(
          endpoints.item(entityType, entityId),
        );
      } else {
        await http.put<Favorite>(endpoints.item(entityType, entityId));
      }
    },
    onSuccess: async () => {
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
