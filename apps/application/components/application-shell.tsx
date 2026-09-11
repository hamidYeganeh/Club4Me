"use client";

import { Suspense, type ReactNode } from "react";
import { AppApiProvider } from "@/components/app-api-provider";
import { AppMotion } from "@/components/app-motion";
import { AppRouteGate } from "@/components/app-route-gate";
import { AppReleaseGate } from "@/components/app-release-gate";
import { AppPushNotifications } from "@/components/push-notifications";
import { NetworkStatus } from "@/components/network-status";
import { Observability } from "@/components/observability";
import { ProductTelemetry } from "@/components/product-telemetry";
import { CapacitorNative } from "@/components/capacitor-native";
import { KeyboardInsets } from "@/components/keyboard-insets";
import { MainBottomNavigation } from "@/components/main-bottom-navigation";
import { SplashScreen } from "@/components/splash-screen";
import { SsgoiProvider } from "@/components/ssgoi-provider";
import { SsgoiRouteBoundary } from "@/components/ssgoi-route-boundary";
import { AppToastProvider } from "@/components/toast-provider";
import { ActiveLocationProvider } from "@modules/locations/active-location";
import { OfflineStatus } from "@/components/offline-status";
import { AppInteractions } from "@/components/app-interactions";
import { AppMotionProvider } from "@/components/motion/motion-provider";

export function ApplicationShell({ children }: { children: ReactNode }) {
  return (
    <AppMotionProvider>
      <AppApiProvider>
        <ActiveLocationProvider>
          <AppInteractions />
          <div className="mx-auto flex h-full min-h-0 w-full max-w-xl flex-1 flex-col">
            <Suspense fallback={null}>
              <AppMotion />
            </Suspense>
            <CapacitorNative />
            <KeyboardInsets />
            <SplashScreen />
            <AppToastProvider />
            <AppReleaseGate />
            <AppPushNotifications />
            <NetworkStatus />
            <OfflineStatus />
            <Observability />
            <ProductTelemetry />
            <SsgoiProvider>
              <div className="app-scroll-root pb-[var(--keyboard-inset,0px)] relative z-0 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-clip [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <SsgoiRouteBoundary>
                  <AppRouteGate>{children}</AppRouteGate>
                </SsgoiRouteBoundary>
              </div>
              <MainBottomNavigation />
            </SsgoiProvider>
          </div>
        </ActiveLocationProvider>
      </AppApiProvider>
    </AppMotionProvider>
  );
}
