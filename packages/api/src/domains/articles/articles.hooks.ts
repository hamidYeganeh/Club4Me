"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { articlesClient } from "./articles.client";
import type {
  CreateArticleCategoryPayload,
  CreateArticlePayload,
  UpdateArticlePayload,
} from "./articles.dto";
import { articlesQueries } from "./articles.queries";

export function useArticles(enabled = true) {
  return useQuery({
    queryKey: articlesQueries.list(),
    queryFn: () => articlesClient.list(),
    enabled,
  });
}

export function useArticle(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: articlesQueries.detail(id ?? ""),
    queryFn: () => articlesClient.get(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useArticleCategories(enabled = true) {
  return useQuery({
    queryKey: articlesQueries.categories(),
    queryFn: () => articlesClient.listCategories(),
    enabled,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateArticlePayload) =>
      articlesClient.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: articlesQueries.all() });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: UpdateArticlePayload & { id: string }) =>
      articlesClient.update(id, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: articlesQueries.all() });
      await queryClient.invalidateQueries({
        queryKey: articlesQueries.detail(variables.id),
      });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesClient.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: articlesQueries.all() });
    },
  });
}

export function useCreateArticleCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateArticleCategoryPayload) =>
      articlesClient.createCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: articlesQueries.categories(),
      });
    },
  });
}
