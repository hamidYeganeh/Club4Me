import { DashboardAsideSection } from "@modules/dashboard/sections/DashboardAsideSection";
import { DashboardWorkspaceSection } from "@modules/dashboard/sections/DashboardWorkspaceSection";
import { getTranslations } from "next-intl/server";

export async function DashboardScreen() {
  const t = await getTranslations();

  return (
    <main className="flex flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row lg:p-6">
      <DashboardWorkspaceSection
        scoreTitle={t("adminDashboard.scoreTitle")}
        scoreValue={t("adminDashboard.scoreValue")}
        scoreUnit={t("adminDashboard.scoreUnit")}
        activityTitle={t("adminDashboard.activityTitle")}
        seeAll={t("panel.seeAll")}
        suggestionValue={t("adminDashboard.suggestionValue")}
        suggestionLabel={t("adminDashboard.suggestionLabel")}
        hoursTitle={t("adminDashboard.hoursTitle")}
        hoursValue={t("adminDashboard.hoursValue")}
        checkinsTitle={t("adminDashboard.checkinsTitle")}
        checkinsValue={t("adminDashboard.checkinsValue")}
        bookingsTitle={t("adminDashboard.bookingsTitle")}
        bookingsValue={t("adminDashboard.bookingsValue")}
        strength={t("adminDashboard.strength")}
        hiit={t("adminDashboard.hiit")}
        boxing={t("adminDashboard.boxing")}
        ranges={[
          { id: "1d", label: t("panel.range1d") },
          { id: "1w", label: t("panel.range1w") },
          { id: "1m", label: t("panel.range1m") },
          { id: "1y", label: t("panel.range1y") },
          { id: "all", label: t("panel.rangeAll") },
        ]}
      />
      <DashboardAsideSection
        name={t("adminDashboard.profileName")}
        role={t("adminDashboard.profileRole")}
        location={t("adminDashboard.profileLocation")}
        age={t("adminDashboard.profileAge")}
        clubs={t("adminDashboard.profileClubs")}
        upcomingTitle={t("adminDashboard.upcomingTitle")}
        addLabel={t("adminDashboard.addClub")}
        items={[
          {
            title: t("adminDashboard.lowerBody"),
            meta: `${t("adminDashboard.kcal", { count: 120 })} · ${t("adminDashboard.minutes", { count: 30 })}`,
            icon: "kettlebell",
          },
          {
            title: t("adminDashboard.absCore"),
            meta: `${t("adminDashboard.kcal", { count: 95 })} · ${t("adminDashboard.minutes", { count: 25 })}`,
            icon: "heart",
          },
          {
            title: t("adminDashboard.upperBody"),
            meta: `${t("adminDashboard.kcal", { count: 140 })} · ${t("adminDashboard.minutes", { count: 35 })}`,
            icon: "boxing",
          },
          {
            title: t("adminDashboard.gluteCalf"),
            meta: `${t("adminDashboard.kcal", { count: 110 })} · ${t("adminDashboard.minutes", { count: 28 })}`,
            icon: "weight",
          },
        ]}
      />
    </main>
  );
}
