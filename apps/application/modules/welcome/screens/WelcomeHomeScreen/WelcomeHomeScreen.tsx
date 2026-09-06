"use client";

import { WelcomeCopySection } from "@modules/welcome/sections/WelcomeCopySection";
import { WelcomeHeroSection } from "@modules/welcome/sections/WelcomeHeroSection";
import { useTranslations } from "next-intl";

export function WelcomeHomeScreen() {
  const t = useTranslations("welcome");

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <WelcomeHeroSection alt={t("heroAlt")} />
      <WelcomeCopySection
        title={t("title")}
        subtitle={t("subtitle")}
        getStarted={t("getStarted")}
        alreadyHaveAccount={t("alreadyHaveAccount")}
        signIn={t("signIn")}
      />
    </main>
  );
}
