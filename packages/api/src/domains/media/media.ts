"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../http/client";

export type Media = {
  id: string;
  hash: string;
  url: string;
  mimeType: string;
  byteSize: number;
  status: "ready" | "blocked";
  createdAt: string;
};

export type MediaUpload = File | { url: string; mimeType?: string };

export const mediaEndpoints = {
  list: "/media",
};

export const mediaClient = {
  uploadPrivate: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http.post<Media>("/media/private/upload", form);
  },
  list: (ids?: string[]) =>
    http.get<{ items: Media[] }>(
      mediaEndpoints.list,
      ids?.length ? { ids: ids.join(",") } : undefined,
    ),
  upload: async (input: MediaUpload) => {
    if (typeof File !== "undefined" && input instanceof File) {
      const form = new FormData();
      form.append("file", input);
      return http.post<Media>(`${mediaEndpoints.list}/upload`, form);
    }
    const remote = input as { url: string; mimeType?: string };
    return http.post<Media>(mediaEndpoints.list, {
      url: remote.url,
      mimeType: remote.mimeType ?? "image/external",
    });
  },
};

export function useMedia(ids?: string[]) {
  return useQuery({
    queryKey: ids !== undefined ? ["media", { ids }] : ["media"],
    enabled: ids === undefined || ids.length > 0,
    queryFn: () => mediaClient.list(ids),
  });
}

export function useCreateMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mediaClient.upload,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useCreatePrivateMedia() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: mediaClient.uploadPrivate, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["media"] }) });
}
