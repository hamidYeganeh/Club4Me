import { LandingFooterSection } from "@modules/landing/sections/LandingFooterSection";
import { LandingHeaderSection } from "@modules/landing/sections/LandingHeaderSection";
import { LandingHeroSection } from "@modules/landing/sections/LandingHeroSection";
import { LandingJoinSection } from "@modules/landing/sections/LandingJoinSection";
import { LandingPathSection } from "@modules/landing/sections/LandingPathSection";
import { LandingProgramsSection } from "@modules/landing/sections/LandingProgramsSection";
import { LandingQuoteSection } from "@modules/landing/sections/LandingQuoteSection";
import { LandingStatsSection } from "@modules/landing/sections/LandingStatsSection";
import { LandingTrainersSection } from "@modules/landing/sections/LandingTrainersSection";
import { getTranslations } from "next-intl/server";

export async function LandingHomeScreen() {
  const t = await getTranslations();

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground"
      >
        {t("nav.skipToContent")}
      </a>
      <LandingHeaderSection />
      <main id="content" className="flex-1">
        <LandingHeroSection />
        <LandingStatsSection />
        <LandingProgramsSection />
        <LandingTrainersSection />
        <LandingPathSection />
        <LandingQuoteSection />
        <LandingJoinSection />
      </main>
      <LandingFooterSection />
    </>
  );
}
