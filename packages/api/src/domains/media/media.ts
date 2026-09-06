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
    const payload =
      typeof File !== "undefined" && input instanceof File
        ? {
            url: await readAsDataUrl(input),
            mimeType: input.type || "image/jpeg",
          }
        : {
            url: (input as { url: string }).url,
            mimeType:
              (input as { mimeType?: string }).mimeType ?? "image/external",
          };
    return http.post<Media>(mediaEndpoints.list, payload);
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

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Unable to read media"));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Unable to read media"));
    reader.readAsDataURL(file);
  });
}
