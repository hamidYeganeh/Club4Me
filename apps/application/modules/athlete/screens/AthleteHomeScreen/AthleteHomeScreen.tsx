import { AthletePlaceholderFeedSection } from "@modules/athlete/sections/AthletePlaceholderFeedSection";
import { AthleteScreenHeaderSection } from "@modules/athlete/sections/AthleteScreenHeaderSection";
import { getTranslations } from "next-intl/server";

export async function AthleteHomeScreen() {
  const t = await getTranslations("nav");

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <AthleteScreenHeaderSection title={t("home")} />
      <AthletePlaceholderFeedSection />
    </main>
  );
}
