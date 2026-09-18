"use client";

import type { ReactNode } from "react";
import { Icon } from "@theme/icon";
import { Logo } from "@theme/logo";
import { useTranslations } from "next-intl";

type AuthScreenProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
};

export function AuthScreen({ children, title, subtitle }: AuthScreenProps) {
  const t = useTranslations("common");

  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      <div className="grid flex-1 lg:grid-cols-2" dir="ltr">
        <aside
          className="relative isolate flex min-h-64 flex-col overflow-hidden bg-[#171d3e] text-white sm:min-h-80 lg:min-h-[calc(100dvh-5rem)]"
          dir="rtl"
        >
          <div
            className="absolute inset-0 -z-20 bg-cover bg-center"
            style={{ backgroundImage: "url('/auth/night-lake.jpg')" }}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#10182c]/55 via-[#171432]/20 to-[#0b1023]/70" />
          <div
            className="flex items-center gap-3 px-7 pt-7 sm:px-12 sm:pt-10 lg:px-16"
            dir="ltr"
          >
            <Logo size={38} label={t("appName")} className="text-white" />
            <span className="text-xl font-bold tracking-tight">
              {t("appName")}
            </span>
          </div>
          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-8 py-9 text-center lg:pb-28">
            <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-[#8d83e6] to-[#d989d3] shadow-[0_12px_38px_rgba(19,13,57,.25)] lg:mb-9 lg:size-20">
              <Icon name="sparkle-1" size={34} />
            </div>
            <h1 className="text-3xl font-light leading-[1.6] sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-8 text-white/85 sm:text-base lg:mt-6">
              {subtitle}
            </p>
          </div>
        </aside>
        <section
          className="flex min-w-0 flex-col px-6 py-8 sm:px-12 lg:px-14 lg:py-12"
          dir="rtl"
        >
          <div className="flex justify-end">
            <span className="rounded-full border border-border px-5 py-2 text-sm font-semibold ">
              پنل مدیریت
            </span>
          </div>
          <div className="mx-auto flex w-full max-w-[30rem] flex-1 flex-col justify-center py-10 lg:py-16">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
