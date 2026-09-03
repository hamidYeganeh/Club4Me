import { HomeHeroSection } from "@modules/home/sections/HomeHeroSection";
import { getFormatter, getTranslations } from "next-intl/server";

export async function HomeScreen() {
  const t = await getTranslations();
  const format = await getFormatter();
  const now = new Date();

  return (
    <HomeHeroSection
      title={t("home.title", { appName: t("common.appName") })}
      description={t("home.description")}
      meta={`${t("apps.business")} · ${t("home.currentTime")}: ${format.dateTime(now, {
        dateStyle: "full",
        timeStyle: "medium",
      })}`}
      ctaLabel={t("home.getStarted")}
    />
  );
}
