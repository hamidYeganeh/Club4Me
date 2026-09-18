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

  const items: import("@repo/ui/panel-navigation").PanelNavItem[] = [
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
      href: "/discovery",
      icon: "sparkle-1",
      label: "چیدمان دیسکاوری",
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
      href: "/users",
      icon: "users-three",
      label: "کاربران",
    },
    {
      href: "/reports",
      icon: "flag-1",
      label: "گزارش‌ها",
    },
    {
      href: "/crm",
      icon: "chat",
      label: "تأیید پیام‌ها",
    },
    {
      href: "/finance",
      icon: "wallet",
      label: "مالی و تسویه",
    },
    {
      href: "/analytics",
      icon: "chart-bar-1",
      label: "قیف و بازگشت",
    },
    {
      href: "/activity",
      icon: "shield-check",
      label: "رویدادهای مدیریتی",
    },
    {
      href: "/support",
      icon: "chat",
      label: "تیکت‌های پشتیبانی",
    },
    {
      href: "/coach",
      icon: "chat",
      label: "مدیریت مربیان",
    },
    {
      href: "/classes",
      icon: "calendar-1",
      label: "کلاس‌ها",
    },
    {
      href: "/app-releases",
      icon: "mobile",
      label: "انتشار نسخه اپ",
    },
    {
      href: "/settings",
      icon: "gear-1",
      label: t("panel.settings"),
    },
  ];

  return (
    <PanelFrame
      className="admin-panel"
      rail={
        <PanelRailSection
          avatarAlt={t("adminDashboard.profileName")}
          items={items}
        />
      }
      header={
        <PanelHeaderSection
          items={items}
          searchPlaceholder={t("panel.searchPlaceholder")}
          settingsHref="/settings"
          settingsLabel={t("panel.settings")}
        />
      }
    >
      {children}
    </PanelFrame>
  );
}
