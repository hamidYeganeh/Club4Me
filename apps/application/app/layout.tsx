import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@theme/provider";
import { NextIntlClientProvider } from "next-intl";
import { Monoton } from "next/font/google";
import { getLocale, getMessages, getTimeZone } from "next-intl/server";

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

import "./globals.css";

const monoton = Monoton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-monoton",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gym4Me",
  description: "Gym4Me member application",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#121212",
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const timeZone = await getTimeZone();

  return (
    <html
      lang={locale}
      dir="rtl"
      className={`dark h-full ${monoton.variable}`}
      suppressHydrationWarning
    >
      <body className="flex h-full flex-col overflow-x-hidden bg-background text-foreground font-sans antialiased">
        <ThemeProvider>
          <NextIntlClientProvider
            locale={locale}
            messages={messages}
            timeZone={timeZone}
          >
            <AppApiProvider>
              <ActiveLocationProvider>
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
                  <Observability />
                  <ProductTelemetry />
                  <SsgoiProvider>
                    <div className="app-scroll-root relative z-0 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-clip">
                      <SsgoiRouteBoundary>
                        <AppRouteGate>{children}</AppRouteGate>
                      </SsgoiRouteBoundary>
                    </div>
                    <MainBottomNavigation />
                  </SsgoiProvider>
                </div>
              </ActiveLocationProvider>
            </AppApiProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
