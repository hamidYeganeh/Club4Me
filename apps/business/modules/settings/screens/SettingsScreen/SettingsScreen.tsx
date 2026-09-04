import { SettingsContentSection } from "@modules/settings/sections/SettingsContentSection";
import { getTranslations } from "next-intl/server";

export async function SettingsScreen() {
  const t = await getTranslations();

  return (
    <SettingsContentSection
      name={t("settingsPage.businessName")}
      email={t("settingsPage.businessEmail")}
      phone={t("settingsPage.phoneValue")}
      proLabel={t("settingsPage.memberPro")}
      shareLabel={t("settingsPage.share")}
      viewProfileLabel={t("settingsPage.viewProfile")}
      personalTitle={t("settingsPage.personalTitle")}
      personalHint={t("settingsPage.personalHint")}
      fullName={t("settingsPage.fullName")}
      emailLabel={t("settingsPage.email")}
      phoneLabel={t("settingsPage.phone")}
      accountType={t("settingsPage.accountType")}
      regular={t("settingsPage.regular")}
      changeAvatar={t("settingsPage.changeAvatar")}
      paymentsTitle={t("settingsPage.paymentsTitle")}
      paymentsHint={t("settingsPage.paymentsHint")}
      autoPayout={t("settingsPage.autoPayout")}
    />
  );
}
