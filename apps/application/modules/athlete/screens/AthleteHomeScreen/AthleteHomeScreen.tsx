"use client";

import { AthleteActivitySummarySection } from "@modules/athlete/sections/AthleteActivitySummarySection";
import { AthleteQuickActionsSection } from "@modules/athlete/sections/AthleteQuickActionsSection";
import { AthleteReminderSection } from "@modules/athlete/sections/AthleteReminderSection";
import { AthleteScreenHeaderSection } from "@modules/athlete/sections/AthleteScreenHeaderSection";
import { AthleteClubClassesSection } from "@modules/athlete/sections/AthleteClubClassesSection";
import { AthleteRecommendationsSection } from "@modules/athlete/sections/AthleteRecommendationsSection";
import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/button-link";

export function AthleteHomeScreen() {
  const t = useTranslations("nav");

  return (
    <main className="app-page gap-8">
      <AthleteScreenHeaderSection title={t("home")} />
      <AthleteQuickActionsSection />
      <ButtonLink href="/athlete/training" variant="secondary">برنامه و ثبت تمرین من</ButtonLink>
      <AthleteReminderSection />
      <AthleteActivitySummarySection />
      <AthleteClubClassesSection compact />
      <AthleteRecommendationsSection />
    </main>
  );
}
