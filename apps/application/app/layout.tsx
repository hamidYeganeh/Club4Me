import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@theme/provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTimeZone } from "next-intl/server";

import { AppApiProvider } from "@/components/app-api-provider";
import { CapacitorNative } from "@/components/capacitor-native";
import { KeyboardInsets } from "@/components/keyboard-insets";
import { MainBottomNavigation } from "@/components/main-bottom-navigation";
import { SplashScreen } from "@/components/splash-screen";
import { SsgoiProvider } from "@/components/ssgoi-provider";
import { SsgoiRouteBoundary } from "@/components/ssgoi-route-boundary";
import { AppToastProvider } from "@/components/toast-provider";
import { ActiveLocationProvider } from "@modules/locations/active-location";

import "./globals.css";

export const metadata: Metadata = {
  title: "Club4Me Application",
  description: "Club4Me member application",
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
    <html lang={locale} dir="rtl" className="h-full" suppressHydrationWarning>
      <body className="flex h-full flex-col bg-background text-foreground font-sans antialiased">
        <ThemeProvider>
          <NextIntlClientProvider
            locale={locale}
            messages={messages}
            timeZone={timeZone}
          >
            <AppApiProvider>
              <ActiveLocationProvider>
                <div className="flex h-full min-h-0 flex-1 flex-col">
                  <CapacitorNative />
                  <KeyboardInsets />
                  <SplashScreen />
                  <AppToastProvider />
                  <SsgoiProvider>
                    <div className="relative z-0 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-clip">
                      <SsgoiRouteBoundary>{children}</SsgoiRouteBoundary>
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
