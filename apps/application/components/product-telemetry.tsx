"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useAccountMe } from "@api/account";
import {
  configureTelemetryContext,
  trackAppOpened,
  identifyUser,
  setTelemetryConsent,
  telemetryConsent,
} from "@api/tracking";
import { useAccountPrivacy } from "@api/account";
import { usePathname } from "next/navigation";

function subscribeConsent(listener: () => void) {
  window.addEventListener("telemetry-consent-changed", listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener("telemetry-consent-changed", listener);
    window.removeEventListener("storage", listener);
  };
}
export function ProductTelemetry() {
  const pathname = usePathname();
  const account = useAccountMe();
  const identified = useRef("");
  const lastScreen = useRef("");
  const privacy = useAccountPrivacy();
  const choice = useSyncExternalStore(
    subscribeConsent,
    telemetryConsent,
    () => null,
  );
  const accountId = account.data?.id;

  useEffect(() => {
    let active = true;
    void (async () => {
      const isNative = Capacitor.isNativePlatform();
      const appVersion = isNative
        ? (await App.getInfo()).version
        : (process.env.NEXT_PUBLIC_APP_RELEASE ?? "development");
      if (!active) return;
      configureTelemetryContext({
        platform: isNative ? "android" : "web",
        appVersion,
      });
    })().catch(() =>
      configureTelemetryContext({ platform: "web", appVersion: "unknown" }),
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const user = account.data;
    const consent = privacy.data?.items.find(
      (item) => item.purpose === "analytics",
    );
    if (
      !user ||
      choice !== true ||
      !consent?.granted ||
      consent.version !== privacy.data?.policyVersion
    ) {
      identified.current = "";
      return;
    }
    const key = `${user.id}:${user.updatedAt}`;
    if (identified.current === key) return;
    identified.current = key;
    identifyUser({
      created_at: user.createdAt,
      locale: "fa-IR",
      platform: Capacitor.isNativePlatform() ? "android" : "web",
    });
  }, [account.data, choice, privacy.data]);

  useEffect(() => {
    if (!accountId || !privacy.data) return;
    const server = privacy.data.items.find(
      (item) => item.purpose === "analytics",
    );
    if (server?.version === privacy.data.policyVersion) {
      setTelemetryConsent(server.granted);
    } else {
      setTelemetryConsent(false);
    }
  }, [accountId, privacy.data]);

  useEffect(() => {
    if (choice !== true) {
      lastScreen.current = "";
      return;
    }
    if (lastScreen.current === pathname) return;
    lastScreen.current = pathname;
    const segment = pathname.split("/")[1];
    const screen = [
      "discovery",
      "athlete",
      "coach",
      "reservations",
      "profile",
    ].includes(segment ?? "")
      ? (segment as
          "discovery" | "athlete" | "coach" | "reservations" | "profile")
      : "other";
    trackAppOpened({ screen });
  }, [pathname, choice]);

  return null;
}
