import { AthleteRecommendationsSection } from "@modules/athlete/sections/AthleteRecommendationsSection";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
export default function Page() {
  return (
    <main className="app-page gap-5">
      <SecondaryHeader title="کلاس مناسب من" showFilter={false} />
      <AthleteRecommendationsSection expanded />
    </main>
  );
}
