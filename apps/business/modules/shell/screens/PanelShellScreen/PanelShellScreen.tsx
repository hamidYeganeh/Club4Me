import { PanelFrame } from "@ui/panel-frame";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { PanelBreadcrumbsSection } from "@modules/shell/sections/PanelBreadcrumbsSection";
import { PanelHeaderSection } from "@modules/shell/sections/PanelHeaderSection";
import { PanelRailSection } from "@modules/shell/sections/PanelRailSection";
import type { PanelRailItem } from "@modules/shell/sections/PanelRailSection/PanelRailSection.types";

type PanelShellScreenProps = {
  children: ReactNode;
};

export async function PanelShellScreen({ children }: PanelShellScreenProps) {
  const t = await getTranslations();

  const items: PanelRailItem[] = [
    {
      href: "/",
      icon: "house-1",
      label: t("panel.dashboard"),
      exact: true,
    },
    {
      href: "/clubs",
      icon: "grid-four",
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
      label: t("panel.memberships"),
    },
    {
      href: "/reviews",
      icon: "star-full",
      label: t("panel.reviews"),
    },
    {
      href: "/attendance",
      icon: "chart-bar-1",
      label: t("panel.attendance"),
    },
    {
      href: "/branches",
      icon: "building-1",
      label: t("panel.branches"),
    },
    {
      href: "/data",
      icon: "database",
      label: t("panel.data"),
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
  ];

  return (
    <PanelFrame
      className="business-panel"
      rail={
        <PanelRailSection
          addHref="/clubs/new"
          addLabel={t("panel.add")}
          avatarSrc="https://picsum.photos/seed/gym4me-business/160/160"
          avatarAlt={t("businessDashboard.profileName")}
          badge="2"
          items={items}
        />
      }
      header={
        <PanelHeaderSection
          searchPlaceholder={t("panel.searchPlaceholder")}
          settingsHref="/settings"
          settingsLabel={t("panel.settings")}
          notificationsLabel={t("panel.notifications")}
          menuLabel={t("panel.menu")}
          openMenuLabel={t("nav.openMenu")}
          closeMenuLabel={t("nav.closeMenu")}
          addHref="/clubs/new"
          addLabel={t("panel.add")}
          items={items}
        />
      }
    >
      <PanelBreadcrumbsSection />
      {children}
    </PanelFrame>
  );
}
