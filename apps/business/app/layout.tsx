import type { Metadata, Viewport } from "next";
import { ApiProvider } from "@api/provider";
import { ThemeProvider } from "@theme/provider";
import { NextIntlClientProvider } from "next-intl";
import localFont from "next/font/local";
import { getLocale, getMessages, getTimeZone } from "next-intl/server";

import { AppToastProvider } from "@/components/toast-provider";
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
    template: "%s | Gym4Me Business",
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "Gym4Me",
    "Gym4Me Business",
    "جیم فور می",
    "پنل باشگاه",
    "مدیریت باشگاه",
    "مدیریت کلاس ورزشی",
    "رزرو باشگاه",
  ],
  authors: [{ name: "Gym4Me", url: "https://gym4me.ir" }],
  creator: "Gym4Me",
  publisher: "Gym4Me",
  category: "business",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
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
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
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
      <body className="flex h-full min-h-full flex-col bg-background text-foreground font-sans antialiased">
        <ThemeProvider>
          <NextIntlClientProvider
            locale={locale}
            messages={messages}
            timeZone={timeZone}
          >
            <ApiProvider
              baseURL={
                process.env.NEXT_PUBLIC_API_URL ??
                "https://api.gym4me.ir/api/v1"
              }
              refreshEndpoint="/business/auth/refresh"
            >
              <AppToastProvider />
              {children}
            </ApiProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
