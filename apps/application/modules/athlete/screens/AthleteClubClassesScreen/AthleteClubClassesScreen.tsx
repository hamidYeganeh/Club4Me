import { AthleteScreenHeaderSection } from "@modules/athlete/sections/AthleteScreenHeaderSection";
import { AthleteClubClassesSection } from "@modules/athlete/sections/AthleteClubClassesSection";

export function AthleteClubClassesScreen() {
  return (
    <main className="app-page gap-6">
      <AthleteScreenHeaderSection title="کلاس‌های من" />
      <AthleteClubClassesSection />
    </main>
  );
}
