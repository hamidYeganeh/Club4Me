"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

import { defaultLocale, timeZone } from "./config";
import { faMessages } from "./locales/fa/messages";

type I18nProviderProps = {
  children: ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps) {
  return (
    <NextIntlClientProvider
      locale={defaultLocale}
      messages={faMessages}
      timeZone={timeZone}
    >
      {children}
    </NextIntlClientProvider>
  );
}
