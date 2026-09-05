import { DashboardAsideSection } from "@modules/dashboard/sections/DashboardAsideSection";
import { DashboardWorkspaceSection } from "@modules/dashboard/sections/DashboardWorkspaceSection";
import { getTranslations } from "next-intl/server";

export async function DashboardScreen() {
  const t = await getTranslations();

  return (
    <main className="flex flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row lg:p-6">
      <DashboardWorkspaceSection
        scoreTitle="کاربران پلتفرم"
        activityTitle="وضعیت باشگاه‌ها"
        seeAll={t("panel.seeAll")}
        suggestionLabel="باشگاه‌های در انتظار بررسی"
        hoursTitle="کل باشگاه‌ها"
        checkinsTitle="کلاس‌های فعال"
        bookingsTitle="عملیات مدیریتی اخیر"
      />
      <DashboardAsideSection
        upcomingTitle={t("adminDashboard.upcomingTitle")}
        addLabel={t("adminDashboard.addClub")}
      />
    </main>
  );
}
