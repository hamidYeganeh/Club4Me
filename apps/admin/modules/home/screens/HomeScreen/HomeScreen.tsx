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
      meta={`${t("apps.admin")} · ${t("home.formattedDate")}: ${format.dateTime(now, {
        dateStyle: "full",
        timeStyle: "short",
      })}`}
      ctaLabel={t("home.getStarted")}
    />
  );
}
