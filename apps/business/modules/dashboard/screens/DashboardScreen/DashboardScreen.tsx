import { DashboardAsideSection } from "@modules/dashboard/sections/DashboardAsideSection";
import { DashboardWorkspaceSection } from "@modules/dashboard/sections/DashboardWorkspaceSection";
import { getTranslations } from "next-intl/server";

export async function DashboardScreen() {
  const t = await getTranslations();

  return (
    <main className="flex flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row lg:p-6">
      <DashboardWorkspaceSection
        workouts={t("businessDashboard.workouts")}
        metrics={t("businessDashboard.metrics")}
        nutrition={t("businessDashboard.nutrition")}
        coaches={t("businessDashboard.coaches")}
        featuredTitle={t("businessDashboard.featuredTitle")}
        featuredSubtitle={t("businessDashboard.featuredSubtitle")}
        occupancyTitle={t("businessDashboard.occupancyTitle")}
        occupancyValue={t("businessDashboard.occupancyValue")}
        checkinsTitle={t("businessDashboard.checkinsTitle")}
        checkinsValue={t("businessDashboard.checkinsValue")}
        scoreTitle={t("businessDashboard.scoreTitle")}
        scoreValue={t("businessDashboard.scoreValue")}
        scoreUnit={t("businessDashboard.scoreUnit")}
        downtrend={t("businessDashboard.downtrend")}
        present={t("businessDashboard.present")}
        prediction={t("businessDashboard.prediction")}
        aiMessages={t("businessDashboard.aiMessages")}
        aiName={t("businessDashboard.aiName")}
        mixTitle={t("businessDashboard.mixTitle")}
        mixValue={t("businessDashboard.mixValue")}
        mixUnit={t("businessDashboard.mixUnit")}
        mixStrength={t("businessDashboard.mixStrength")}
        mixCardio={t("businessDashboard.mixCardio")}
        mixRecovery={t("businessDashboard.mixRecovery")}
        ranges={[
          { id: "1d", label: t("panel.range1d") },
          { id: "1w", label: t("panel.range1w") },
          { id: "1m", label: t("panel.range1m") },
          { id: "1y", label: t("panel.range1y") },
          { id: "all", label: t("panel.rangeAll") },
        ]}
      />
      <DashboardAsideSection
        greeting={t("businessDashboard.greeting")}
        name={t("businessDashboard.profileName")}
        goProTitle={t("businessDashboard.goProTitle")}
        goProOne={t("businessDashboard.goProOne")}
        goProTwo={t("businessDashboard.goProTwo")}
        goProThree={t("businessDashboard.goProThree")}
        calendarTitle={t("businessDashboard.calendarTitle")}
        completed={t("businessDashboard.completed")}
        skipped={t("businessDashboard.skipped")}
        challenge={t("businessDashboard.challenge")}
      />
    </main>
  );
}
