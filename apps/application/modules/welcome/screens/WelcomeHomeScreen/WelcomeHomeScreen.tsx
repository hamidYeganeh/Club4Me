import { WelcomeCopySection } from "@modules/welcome/sections/WelcomeCopySection";
import { WelcomeHeroSection } from "@modules/welcome/sections/WelcomeHeroSection";
import { getTranslations } from "next-intl/server";

export async function WelcomeHomeScreen() {
  const t = await getTranslations("welcome");

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
