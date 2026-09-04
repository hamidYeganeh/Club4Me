import type { Metadata } from "next";
import { ApiProvider } from "@api/provider";
import { ThemeProvider } from "@theme/provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTimeZone } from "next-intl/server";

import "./globals.css";

export const metadata: Metadata = {
  title: "جیم فور می | باشگاه شهری",
  description:
    "تمرین حضوری با مربی، برنامه شخصی، و کلاس‌های قدرتی، تناوبی، بوکس و یوگا.",
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
      <body
        id="top"
        className="flex min-h-full flex-col overflow-x-hidden bg-background font-sans text-foreground antialiased"
      >
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
            </ApiProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
