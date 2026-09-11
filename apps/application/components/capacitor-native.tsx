"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardResize, KeyboardStyle } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export function CapacitorNative() {
  const router = useRouter();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    void StatusBar.setOverlaysWebView({ overlay: true });
    void StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === "ios") {
      void Keyboard.setResizeMode({ mode: KeyboardResize.Native });
      void Keyboard.setStyle({ style: KeyboardStyle.Dark });
      void Keyboard.setScroll({ isDisabled: false });
    }
    void SplashScreen.hide();

    const listener = App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
        return;
      }

      void App.exitApp();
    });
    const urlListener = App.addListener("appUrlOpen", ({ url }) => {
      try {
        const parsed = new URL(url);
        const trusted =
          (parsed.protocol === "gym4me:" && parsed.hostname === "app") ||
          (parsed.protocol === "https:" && parsed.hostname === "gym4me.ir");
        if (trusted && parsed.pathname.startsWith("/")) {
          router.push(`${parsed.pathname}${parsed.search}`);
        }
      } catch {
        // Ignore malformed or untrusted deep links.
      }
    });

    return () => {
      void listener.then((handle) => handle.remove());
      void urlListener.then((handle) => handle.remove());
    };
  }, [router]);

  return null;
}
