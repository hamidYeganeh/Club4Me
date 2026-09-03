import { CoachThreadSection } from "@modules/coach/sections/CoachThreadSection";
import { getTranslations } from "next-intl/server";

export async function CoachScreen() {
  const t = await getTranslations();

  return (
    <CoachThreadSection
      name={t("businessDashboard.profileName")}
      tokensLeft={t("businessDashboard.tokensLeft")}
      title={t("coachPage.title")}
      main={t("coachPage.main")}
      settings={t("coachPage.settings")}
      subscription={t("coachPage.subscription")}
      canvas={t("coachPage.canvas")}
      metrics={t("coachPage.metrics")}
      appointment={t("coachPage.appointment")}
      recent={t("coachPage.recent")}
      chats={[
        t("coachPage.chatFit"),
        t("coachPage.chatStress"),
        t("coachPage.chatMuscle"),
      ]}
      aiReply={t("coachPage.aiReply")}
      userReply={t("coachPage.userReply")}
      linkTitle={t("coachPage.linkTitle")}
      linkBody={t("coachPage.linkBody")}
      placeholder={t("coachPage.placeholder")}
      send={t("coachPage.send")}
      attach={t("coachPage.attach")}
      voice={t("coachPage.voice")}
    />
  );
}
