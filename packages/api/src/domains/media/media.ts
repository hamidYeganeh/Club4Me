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
  list: () => http.get<{ items: Media[] }>(mediaEndpoints.list),
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

export function useMedia() {
  return useQuery({
    queryKey: ["media"],
    queryFn: mediaClient.list,
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
