"use client";

import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Button } from "@heroui/react";
import {
  appReleasesClient,
  type AppPlatform,
  type CurrentAppRelease,
} from "@api";
import { openExternalUrl } from "@/lib/native-browser";

const SEEN_PREFIX = "gym4me:release-seen";
const DISMISSED_PREFIX = "gym4me:release-dismissed";

export function AppReleaseGate() {
  const [release, setRelease] = useState<CurrentAppRelease | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let active = true;
    const check = async () => {
      const platform = Capacitor.getPlatform();
      if (platform !== "android" && platform !== "ios") return;

      try {
        const info = await App.getInfo();
        const current = await appReleasesClient.current(platform, info.version);
        if (active) {
          if (current.configured) {
            localStorage.setItem(
              "gym4me:feature-flags",
              JSON.stringify(current.featureFlags),
            );
            window.dispatchEvent(new Event("gym4me:feature-flags-changed"));
          }
          setRelease(current);
        }
      } catch {
        // Version checks must never make the app unusable when the API is down.
      }
    };

    void check();
    const listener = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) void check();
    });

    return () => {
      active = false;
      void listener.then((handle) => handle.remove());
    };
  }, []);

  if (!release?.configured || !shouldShow(release)) return null;

  const required = release.updateMode === "required";
  const maintenance = release.maintenanceEnabled;
  const isNewVersion = release.updateMode === "none";

  const close = () => {
    if (required) return;
    localStorage.setItem(storageKey(release, isNewVersion), "1");
    setRelease(null);
  };

  return (
    <div
      className="fixed inset-y-0 inset-x-0 z-[1000] mx-auto flex w-full max-w-xl items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-release-title"
    >
      <section className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-surface shadow-2xl">
        <div className="h-1.5 bg-accent" />
        <div className="p-6 sm:p-7">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-2xl">
            {maintenance ? "⚙" : required ? "↑" : "✦"}
          </div>
          <p className="text-xs font-semibold tracking-wide text-accent">
            {maintenance
              ? "سرویس موقتاً در دسترس نیست"
              : required
                ? "برای ادامه، به‌روزرسانی لازم است"
                : isNewVersion
                  ? `نسخه ${release.latestVersion}`
                  : "نسخه جدید آماده است"}
          </p>
          <h2
            id="app-release-title"
            className="mt-2 text-2xl font-bold leading-9"
          >
            {maintenance ? release.maintenanceTitle : release.title}
          </h2>

          {maintenance ? (
            <p className="mt-5 text-sm leading-7 text-muted">
              {release.maintenanceMessage}
            </p>
          ) : release.releaseNotes.length > 0 ? (
            <ul className="mt-5 space-y-3">
              {release.releaseNotes.map((note, index) => (
                <li
                  key={`${index}-${note}`}
                  className="flex items-start gap-3 text-sm leading-7 text-muted"
                >
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {required && !maintenance ? (
            <p className="mt-5 rounded-2xl bg-danger/10 px-4 py-3 text-sm leading-6 text-danger">
              نسخه فعلی دیگر پشتیبانی نمی‌شود. اطلاعات شما محفوظ است و بعد از
              به‌روزرسانی می‌توانید ادامه دهید.
            </p>
          ) : null}

          <div className="mt-7 flex gap-3">
            {maintenance ? (
              <Button
                variant="primary"
                className="w-full"
                onPress={() => window.location.reload()}
              >
                تلاش دوباره
              </Button>
            ) : isNewVersion ? (
              <Button variant="primary" className="w-full" onPress={close}>
                متوجه شدم
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  className="flex-1"
                  onPress={() => void openExternalUrl(release.storeUrl)}
                >
                  به‌روزرسانی اپ
                </Button>
                {!required ? (
                  <Button variant="secondary" onPress={close}>
                    بعداً
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function shouldShow(release: Extract<CurrentAppRelease, { configured: true }>) {
  if (release.maintenanceEnabled) return true;
  if (release.updateMode === "required") return true;
  if (release.updateMode === "optional") {
    return !localStorage.getItem(storageKey(release, false));
  }
  if (release.currentVersion !== release.latestVersion) return false;
  return !localStorage.getItem(storageKey(release, true));
}

function storageKey(
  release: { platform: AppPlatform; latestVersion: string },
  seen: boolean,
) {
  return `${seen ? SEEN_PREFIX : DISMISSED_PREFIX}:${release.platform}:${release.latestVersion}`;
}
