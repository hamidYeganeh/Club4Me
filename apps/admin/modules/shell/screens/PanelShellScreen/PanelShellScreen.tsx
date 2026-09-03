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
          addHref="/"
          addLabel={t("panel.add")}
          avatarSrc="https://picsum.photos/seed/club4me-admin/160/160"
          avatarAlt={t("adminDashboard.profileName")}
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
              href: "/articles",
              icon: "book-open",
              label: t("panel.articles"),
            },
            {
              href: "/resources",
              icon: "database",
              label: t("panel.resources"),
            },
            {
              href: "/role-requests",
              icon: "clipboard",
              label: t("panel.roleRequests"),
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
