import { SettingsContentSection } from "@modules/settings/sections/SettingsContentSection";
import { getTranslations } from "next-intl/server";

export async function SettingsScreen() {
  const t = await getTranslations();

  return (
    <SettingsContentSection
      proLabel={t("settingsPage.memberPro")}
      personalTitle={t("settingsPage.personalTitle")}
      personalHint={t("settingsPage.personalHint")}
      fullName={t("settingsPage.fullName")}
      phoneLabel={t("settingsPage.phone")}
      accountType={t("settingsPage.accountType")}
    />
  );
}
