"use client";

import type { ReactNode } from "react";
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
          <p className="font-brand text-sm font-normal text-accent" dir="ltr">
            {t("appName")}
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">{subtitle}</p>
        </div>
        <p className="font-brand text-sm font-normal text-muted" dir="ltr">
          {t("appName")}
        </p>
      </aside>
      <section className="flex flex-1 flex-col items-center px-6 py-8 sm:justify-center sm:py-12">
        <div className="mb-8 flex w-full max-w-md items-center gap-3 lg:hidden">
          <Logo size={40} label={t("appName")} />
          <p className="font-brand text-sm font-normal text-foreground" dir="ltr">
            {t("appName")}
          </p>
        </div>
        <div className="flex w-full max-w-md flex-1 flex-col sm:flex-none">
          {children}
        </div>
      </section>
    </main>
  );
}
