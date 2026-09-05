import { PanelFrame } from "@ui/panel-frame";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { PanelHeaderSection } from "@modules/shell/sections/PanelHeaderSection";
import { PanelRailSection } from "@modules/shell/sections/PanelRailSection";

type PanelShellScreenProps = {
  children: ReactNode;
};

export async function PanelShellScreen({ children }: PanelShellScreenProps) {
  const t = await getTranslations();

  return (
    <PanelFrame
      rail={
        <PanelRailSection
          addHref="/clubs/new"
          addLabel={t("panel.add")}
          avatarSrc="https://picsum.photos/seed/gym4me-business/160/160"
          avatarAlt={t("businessDashboard.profileName")}
          badge="2"
          items={[
            {
              href: "/",
              icon: "grid-four",
              label: t("panel.dashboard"),
              exact: true,
            },
            {
              href: "/clubs",
              icon: "building-2",
              label: t("panel.clubs"),
            },
            {
              href: "/students",
              icon: "users-two",
              label: t("panel.students"),
            },
            {
              href: "/coaches",
              icon: "user",
              label: t("panel.coaches"),
            },
            {
              href: "/classes",
              icon: "calendar-1",
              label: t("panel.classes"),
            },
            {
              href: "/payments",
              icon: "wallet",
              label: t("panel.payments"),
            },
            {
              href: "/memberships",
              icon: "ticket",
              label: "بسته‌ها و عضویت",
            },
            {
              href: "/reviews",
              icon: "star-full",
              label: "نظرهای باشگاه",
            },
            {
              href: "/data",
              icon: "database",
              label: "ورود و خروج داده",
            },
            {
              href: "/attendance",
              icon: "calendar-check",
              label: t("panel.attendance"),
            },
            {
              href: "/branches",
              icon: "building-1",
              label: t("panel.branches"),
            },
            {
              href: "/coach",
              icon: "chat",
              label: t("panel.coach"),
            },
            {
              href: "/settings",
              icon: "gear-1",
              label: t("panel.settings"),
            },
          ]}
        />
      }
      header={
        <PanelHeaderSection
          searchPlaceholder={t("panel.searchPlaceholder")}
          chatLabel={t("panel.chatAi")}
          chatHref="/coach"
          settingsHref="/settings"
          settingsLabel={t("panel.settings")}
        />
      }
    >
      {children}
    </PanelFrame>
  );
}
