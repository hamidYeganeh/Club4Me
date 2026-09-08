import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@theme/provider";
import { NextIntlClientProvider } from "next-intl";
import localFont from "next/font/local";
import { getLocale, getMessages, getTimeZone } from "next-intl/server";

import { ApplicationShell } from "@/components/application-shell";
import {
  siteDescription,
  siteName,
  siteTitle,
  siteUrl,
} from "@/lib/site-metadata";

import "./globals.css";

const monoton = localFont({
  src: "../../../packages/theme/fonts/Monoton-Regular.ttf",
  weight: "400",
  variable: "--font-monoton",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: siteTitle,
    template: "%s | Gym4Me",
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "Gym4Me",
    "جیم فور می",
    "باشگاه ورزشی",
    "مربی ورزشی",
    "کلاس ورزشی",
    "رزرو آنلاین باشگاه",
    "تناسب اندام",
  ],
  authors: [{ name: siteName, url: "https://gym4me.ir" }],
  creator: siteName,
  publisher: siteName,
  category: "fitness",
  classification: "Fitness discovery and booking application",
  manifest: "/manifest.webmanifest",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteName,
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName,
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
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
            <ApplicationShell>{children}</ApplicationShell>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
