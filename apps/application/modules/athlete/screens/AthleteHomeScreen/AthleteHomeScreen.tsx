import { AthleteActivitySummarySection } from "@modules/athlete/sections/AthleteActivitySummarySection";
import { AthleteQuickActionsSection } from "@modules/athlete/sections/AthleteQuickActionsSection";
import { AthleteReminderSection } from "@modules/athlete/sections/AthleteReminderSection";
import { AthleteScreenHeaderSection } from "@modules/athlete/sections/AthleteScreenHeaderSection";
import { AthleteClubClassesSection } from "@modules/athlete/sections/AthleteClubClassesSection";
import { AthleteRecommendationsSection } from "@modules/athlete/sections/AthleteRecommendationsSection";
import { getTranslations } from "next-intl/server";

export async function AthleteHomeScreen() {
  const t = await getTranslations("nav");

  return (
    <main className="app-page gap-6">
      <AthleteScreenHeaderSection title={t("home")} />
      <AthleteQuickActionsSection />
      <AthleteReminderSection />
      <AthleteActivitySummarySection />
      <AthleteClubClassesSection compact />
      <AthleteRecommendationsSection />
    </main>
  );
}
