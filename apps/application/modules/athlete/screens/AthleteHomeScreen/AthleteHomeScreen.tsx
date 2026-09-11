"use client";

import { AthleteCoachFeedback } from "@modules/training/TrainingFollowUps";
import { ManagedBanners } from "@/components/managed-banners";

import { AthleteActivitySummarySection } from "@modules/athlete/sections/AthleteActivitySummarySection";
import { AthleteQuickActionsSection } from "@modules/athlete/sections/AthleteQuickActionsSection";
import { AthleteReminderSection } from "@modules/athlete/sections/AthleteReminderSection";
import { AthleteScreenHeaderSection } from "@modules/athlete/sections/AthleteScreenHeaderSection";
import { AthleteClubClassesSection } from "@modules/athlete/sections/AthleteClubClassesSection";
import { AthleteRecommendationsSection } from "@modules/athlete/sections/AthleteRecommendationsSection";
import { useTranslations } from "next-intl";
import { AthleteToday } from "@modules/today/AthleteToday";

export function AthleteHomeScreen() {
  const t = useTranslations("nav");

  return (
    <main className="app-page gap-8">
      <AthleteScreenHeaderSection title={t("home")} />
      <AthleteToday />
      <AthleteQuickActionsSection />
      <AthleteCoachFeedback />
      <AthleteReminderSection widgetOnly />
      <AthleteRecommendationsSection />
      <AthleteClubClassesSection compact />
      <AthleteActivitySummarySection />
      <ManagedBanners placement="athlete-home" />
    </main>
  );
}
