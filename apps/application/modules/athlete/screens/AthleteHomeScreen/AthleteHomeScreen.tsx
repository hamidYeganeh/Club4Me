import { AthletePlaceholderFeedSection } from "@modules/athlete/sections/AthletePlaceholderFeedSection";
import { AthleteReminderSection } from "@modules/athlete/sections/AthleteReminderSection";
import { AthleteScreenHeaderSection } from "@modules/athlete/sections/AthleteScreenHeaderSection";
import { getTranslations } from "next-intl/server";

export async function AthleteHomeScreen() {
  const t = await getTranslations("nav");

  return (
    <main className="app-page gap-6">
      <AthleteScreenHeaderSection title={t("home")} />
      <AthleteReminderSection />
      <AthletePlaceholderFeedSection />
    </main>
  );
}
