import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo";
import { ApiProvider } from "@api/provider";
import { ThemeProvider } from "@theme/provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTimeZone } from "next-intl/server";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Gym4Me | رزرو، برنامه تمرین و پیشرفت",
    template: "%s | Gym4Me",
  },
  description:
    "باشگاه و مربی پیدا کنید، جلسه رزرو کنید و برنامه تمرین، پیشرفت و اعتبار عضویت خود را در جیم فور می دنبال کنید.",
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
      className="dark h-full"
      suppressHydrationWarning
    >
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
                process.env.NEXT_PUBLIC_API_URL ??
                "https://api.gym4me.ir/api/v1"
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
