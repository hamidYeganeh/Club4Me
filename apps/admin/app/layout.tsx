import type { Metadata } from "next";
import { ApiProvider } from "@api/provider";
import { ThemeProvider } from "@theme/provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTimeZone } from "next-intl/server";

import { AppToastProvider } from "@/components/toast-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Gym4Me Admin",
  description: "Gym4Me admin panel",
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
    <html lang={locale} dir="rtl" className="dark h-full" suppressHydrationWarning>
      <body className="flex h-full min-h-full flex-col bg-background text-foreground font-sans antialiased">
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
              <AppToastProvider />
              {children}
            </ApiProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
