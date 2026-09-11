"use client";

import { useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useAccountMe } from "@api/account";
import {
  configureTelemetryContext,
  identifyUser,
  setTelemetryConsent,
  telemetryConsent,
} from "@api/tracking";
import { useAccountPrivacy, useUpdateAccountConsent } from "@api/account";
import { Button } from "@heroui/react";
import { usePathname } from "next/navigation";

export function ProductTelemetry() {
  const pathname = usePathname();
  const account = useAccountMe();
  const identified = useRef("");
  const privacy = useAccountPrivacy();
  const consentMutation = useUpdateAccountConsent();
  const [choice, setChoice] = useState<boolean | null>(() =>
    telemetryConsent(),
  );

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

  useEffect(() => {
    if (!account.data || !privacy.data) return;
    const server = privacy.data.items.find(
      (item) => item.purpose === "analytics",
    );
    if (server) {
      setTelemetryConsent(server.granted);
    } else if (choice !== null && !consentMutation.isPending) {
      void consentMutation.mutateAsync({
        purpose: "analytics",
        granted: choice,
        version: privacy.data.policyVersion,
      });
    }
  }, [account.data, choice, consentMutation, privacy.data]);

  const decide = (granted: boolean) => {
    setTelemetryConsent(granted);
    setChoice(granted);
    if (account.data && privacy.data)
      void consentMutation.mutateAsync({
        purpose: "analytics",
        granted,
        version: privacy.data.policyVersion,
      });
  };
  // Ask on overview screens, without covering forms or checkout actions.
  const effectiveChoice =
    privacy.data?.items.find((item) => item.purpose === "analytics")?.granted ??
    choice;
  if (
    effectiveChoice !== null ||
    !["/athlete", "/coach", "/discovery"].includes(pathname)
  )
    return null;
  return (
    <aside
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[80] mx-auto max-w-xl rounded-2xl border border-border bg-surface/95 p-4 shadow-xl backdrop-blur"
      aria-label="رضایت تحلیل محصول"
    >
      <p className="text-sm leading-6">
        برای بهبود جست‌وجو و رزرو، رویدادهای محدود و بدون متن جست‌وجو یا موقعیت
        دقیق را تا ۱۸۰ روز نگه داریم؟
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="primary" onPress={() => decide(true)}>
          موافقم
        </Button>
        <Button size="sm" variant="secondary" onPress={() => decide(false)}>
          فعلاً نه
        </Button>
      </div>
    </aside>
  );
}
