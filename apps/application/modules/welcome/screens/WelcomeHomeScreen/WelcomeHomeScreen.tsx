"use client";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";

import { WelcomeCopySection } from "@modules/welcome/sections/WelcomeCopySection";
import { WelcomeHeroSection } from "@modules/welcome/sections/WelcomeHeroSection";
import { useTranslations } from "next-intl";

export function WelcomeHomeScreen() {
  const t = useTranslations("welcome");

  return (
    <main className="app-page gap-5">
      <SecondaryHeader title="به کلاب‌فورمی خوش آمدید" showFilter={false} showBack={false} />
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
