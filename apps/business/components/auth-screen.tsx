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
    <main className="business-auth mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="flex min-h-18 items-center gap-3 rounded-b-4xl bg-surface px-5 pt-[max(.75rem,env(safe-area-inset-top))] pb-3"><Logo size={34} label={t("appName")} /><span className="font-bold">{title}</span></header>
      <section className="business-auth-hero relative overflow-hidden rounded-3xl p-6 text-white"><div className="business-hero-scrim" aria-hidden><div className="business-blur-edge"><span style={{backdropFilter:"blur(8px)",height:"100%"}} /></div><div className="business-blur-edge is-top"><span style={{backdropFilter:"blur(4px)",height:"100%"}} /></div></div><div className="relative z-10"><p className="mb-3 inline-flex rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">پنل بیزینس</p><h1 className="text-2xl font-extrabold leading-10">{title}</h1><p className="mt-2 text-sm leading-7">{subtitle}</p></div></section>
      <section className="app-card min-w-0 p-5">{children}</section>
    </main>
  );
}
