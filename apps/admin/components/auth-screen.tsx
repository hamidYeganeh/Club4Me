"use client";

import type { ReactNode } from "react";
import { Typography } from "@heroui/react";
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
    <main className="grid min-h-full flex-1 bg-background lg:grid-cols-[minmax(20rem,42%)_1fr]">
      <aside className="relative hidden overflow-hidden border-e border-border bg-surface-secondary lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14">
        <Logo size={72} label={t("appName")} />
        <div className="max-w-sm">
          <Typography
            type="body-sm"
            weight="normal"
            dir="ltr"
            className="font-brand text-accent"
          >
            {t("appName")}
          </Typography>
          <Typography type="h1" className="mt-4">{title}</Typography>
          <Typography type="body" color="muted" className="mt-4">{subtitle}</Typography>
        </div>
        <Typography
          type="body-sm"
          weight="normal"
          color="muted"
          dir="ltr"
          className="font-brand"
        >
          {t("appName")}
        </Typography>
      </aside>
      <section className="flex flex-1 flex-col items-center px-6 py-8 sm:justify-center sm:py-12">
        <div className="mb-8 flex w-full max-w-md items-center gap-3 lg:hidden">
          <Logo size={40} label={t("appName")} />
          <Typography
            type="body-sm"
            weight="normal"
            dir="ltr"
            className="font-brand"
          >
            {t("appName")}
          </Typography>
        </div>
        <div className="flex w-full max-w-md flex-1 flex-col sm:flex-none">
          {children}
        </div>
      </section>
    </main>
  );
}
