"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { PushNotifications } from "@capacitor/push-notifications";
import { notificationsClient, tokenStore } from "@api";

const DEVICE_ID_KEY = "gym4me.push.deviceId";
const PUSH_ENABLED_KEY = "gym4me.push.enabled";

export async function setupPushNotifications() {
  if (!isAndroid()) return () => undefined;

  await PushNotifications.createChannel({
    id: "gym4me_transactional",
    name: "رزروها و یادآوری‌ها",
    description: "تغییرات رزرو، زمان کلاس و پیام‌های ضروری",
    importance: 4,
    visibility: 1,
    vibration: true,
  });

  const registration = await PushNotifications.addListener(
    "registration",
    async ({ value: token }) => {
      if (!tokenStore.get()) return;
      const info = await App.getInfo();
      await notificationsClient.registerDevice({
        token,
        deviceId: await getDeviceId(),
        platform: "android",
        appVersion: info.version,
        locale: navigator.language || "fa-IR",
      });
    },
  );
  const registrationError = await PushNotifications.addListener(
    "registrationError",
    (error) => console.error("Push registration failed", error),
  );
  const action = await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    ({ notification }) => {
      const href = notification.data?.href;
      if (typeof href === "string" && isSafeInternalPath(href)) {
        window.location.assign(href);
      }
    },
  );

  const enabled = await Preferences.get({ key: PUSH_ENABLED_KEY });
  const permission = await PushNotifications.checkPermissions();
  if (enabled.value === "true" && permission.receive === "granted") {
    await PushNotifications.register();
  }

  return () => {
    void registration.remove();
    void registrationError.remove();
    void action.remove();
  };
}

export async function enablePushNotifications() {
  if (!isAndroid()) return "unsupported" as const;
  let permission = await PushNotifications.checkPermissions();
  if (permission.receive === "prompt") {
    permission = await PushNotifications.requestPermissions();
  }
  if (permission.receive !== "granted") return "denied" as const;
  await Preferences.set({ key: PUSH_ENABLED_KEY, value: "true" });
  await PushNotifications.register();
  return "enabled" as const;
}

export async function disablePushNotifications() {
  if (!isAndroid()) return;
  await Preferences.set({ key: PUSH_ENABLED_KEY, value: "false" });
  if (tokenStore.get()) {
    await notificationsClient.unregisterDevice(await getDeviceId());
  }
}

export async function getPushNotificationState() {
  if (!isAndroid()) return "unsupported" as const;
  const [preference, permission] = await Promise.all([
    Preferences.get({ key: PUSH_ENABLED_KEY }),
    PushNotifications.checkPermissions(),
  ]);
  if (permission.receive === "denied") return "denied" as const;
  return preference.value === "true"
    ? ("enabled" as const)
    : ("disabled" as const);
}

async function getDeviceId() {
  const current = await Preferences.get({ key: DEVICE_ID_KEY });
  if (current.value) return current.value;
  const id = crypto.randomUUID();
  await Preferences.set({ key: DEVICE_ID_KEY, value: id });
  return id;
}

function isAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

function isSafeInternalPath(href: string) {
  return (
    href.startsWith("/") && !href.startsWith("//") && !href.includes("://")
  );
}
