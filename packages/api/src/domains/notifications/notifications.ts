"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../http/client";
import { trackNotificationPreferenceChanged } from "../../tracking/tracking";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationDeliveryState =
  "pending" | "processing" | "accepted" | "skipped" | "failed";
export type NotificationDeliveryReport = {
  counts: Record<
    "pushDelivery" | "smsDelivery",
    Array<{ _id: NotificationDeliveryState; count: number }>
  >;
  failed: Array<{
    id: string;
    type: string;
    createdAt: string;
    pushDelivery: { state: NotificationDeliveryState; attempts: number } | null;
    smsDelivery: { state: NotificationDeliveryState; attempts: number } | null;
  }>;
};

export function useNotificationDeliveryReport() {
  return useQuery({
    queryKey: ["admin-notification-delivery"],
    queryFn: () =>
      http.get<NotificationDeliveryReport>("/notifications/delivery-report"),
    refetchInterval: 30_000,
  });
}

export function useRetryNotificationDelivery() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      http.post<{ queued: true }>(`/notifications/${id}/retry`, {}),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["admin-notification-delivery"] }),
  });
}

export type NotificationPreferences = {
  bookingUpdates: boolean;
  reminders: boolean;
  discovery: boolean;
  marketing: boolean;
};

export type RegisterPushDevicePayload = {
  token: string;
  deviceId: string;
  platform: "android";
  appVersion: string;
  locale: string;
};

export const notificationsClient = {
  registerDevice: (payload: RegisterPushDevicePayload) =>
    http.post<{ success: true }>("/notifications/devices", payload),
  unregisterDevice: (deviceId: string) =>
    http.delete<{ success: true }>("/notifications/devices", { deviceId }),
  preferences: () =>
    http.get<NotificationPreferences>("/notifications/preferences"),
  updatePreferences: (payload: Partial<NotificationPreferences>) =>
    http.patch<NotificationPreferences>("/notifications/preferences", payload),
};

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => http.get<{ items: AppNotification[] }>("/notifications"),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      http.patch<{ success: true }>(
        `/notifications/${notificationId}/read`,
        {},
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useNotificationPreferences(enabled = true) {
  return useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: notificationsClient.preferences,
    // Revalidate restored offline preferences when opening settings.
    staleTime: 0,
    refetchOnMount: "always",
    enabled,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<NotificationPreferences>) =>
      notificationsClient.updatePreferences(payload),
    onSuccess: (data, payload) => {
      queryClient.setQueryData(["notifications", "preferences"], data);
      for (const [key, isEnabled] of Object.entries(payload)) {
        if (typeof isEnabled !== "boolean") continue;
        trackNotificationPreferenceChanged({
          preference_name: toTelemetryPreference(key),
          is_enabled: isEnabled,
        });
      }
    },
  });
}

function toTelemetryPreference(
  key: string,
): "booking_updates" | "reminders" | "discovery" | "marketing" {
  if (key === "bookingUpdates") return "booking_updates";
  if (key === "reminders") return "reminders";
  if (key === "discovery") return "discovery";
  return "marketing";
}
