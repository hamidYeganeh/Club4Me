"use client";

import { useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useAccountMe } from "@api/account";
import { configureTelemetryContext, identifyUser } from "@api/tracking";

export function ProductTelemetry() {
  const account = useAccountMe();
  const identified = useRef("");

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
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const user = account.data;
    if (!user) return;
    const key = `${user.id}:${user.updatedAt}`;
    if (identified.current === key) return;
    identified.current = key;
    identifyUser({
      created_at: user.createdAt,
      locale: "fa-IR",
      platform: Capacitor.isNativePlatform() ? "android" : "web",
    });
  }, [account.data]);

  return null;
}
