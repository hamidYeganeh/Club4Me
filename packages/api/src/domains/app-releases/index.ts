"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../http/client";

export type AppPlatform = "android" | "ios";
export type AppUpdateMode = "none" | "optional" | "required";

export type AppRelease = {
  id: string;
  platform: AppPlatform;
  latestVersion: string;
  minimumSupportedVersion: string;
  title: string;
  releaseNotes: string[];
  storeUrl: string;
  active: boolean;
  maintenanceEnabled: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  featureFlags: Record<string, boolean>;
  publishedAt: string;
  updatedAt: string;
};

export type SaveAppRelease = Pick<
  AppRelease,
  | "latestVersion"
  | "minimumSupportedVersion"
  | "title"
  | "releaseNotes"
  | "storeUrl"
  | "active"
  | "maintenanceEnabled"
  | "maintenanceTitle"
  | "maintenanceMessage"
  | "featureFlags"
>;

export type CurrentAppRelease =
  | { configured: false; platform: AppPlatform }
  | (AppRelease & {
      configured: true;
      currentVersion: string;
      updateMode: AppUpdateMode;
    });

export const appReleasesClient = {
  current: (platform: AppPlatform, version: string) =>
    http.get<CurrentAppRelease>("/app-releases/current", {
      platform,
      version,
    }),
  listAdmin: () => http.get<{ items: AppRelease[] }>("/admin/app-releases"),
  saveAdmin: (platform: AppPlatform, payload: SaveAppRelease) =>
    http.put<AppRelease>(`/admin/app-releases/${platform}`, payload),
};

const adminKey = ["admin", "app-releases"] as const;

export function useAdminAppReleases() {
  return useQuery({
    queryKey: adminKey,
    queryFn: appReleasesClient.listAdmin,
  });
}

export function useSaveAdminAppRelease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      platform,
      payload,
    }: {
      platform: AppPlatform;
      payload: SaveAppRelease;
    }) => appReleasesClient.saveAdmin(platform, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKey }),
  });
}
