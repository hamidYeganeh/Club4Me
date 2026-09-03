import type { Metadata, Viewport } from "next";
import { ApiProvider } from "@api/provider";
import { ThemeProvider } from "@theme/provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTimeZone } from "next-intl/server";

import { MainBottomNavigation } from "@/components/main-bottom-navigation";

import "./globals.css";

export const metadata: Metadata = {
  title: "Club4Me Application",
  description: "Club4Me member application",
};

export const viewport: Viewport = {
  viewportFit: "cover",
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
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans antialiased">
        <ThemeProvider>
          <NextIntlClientProvider
            locale={locale}
            messages={messages}
            timeZone={timeZone}
          >
            <ApiProvider
              baseURL={
                process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7088/api/v1"
              }
            >
              {children}
              <MainBottomNavigation />
            </ApiProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
