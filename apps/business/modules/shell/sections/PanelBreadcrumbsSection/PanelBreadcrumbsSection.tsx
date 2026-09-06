"use client";

import { Breadcrumbs } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, type ComponentProps } from "react";

type Crumb = {
  href?: string;
  label: string;
};

function segmentLabel(
  segment: string,
  previous: string | undefined,
  t: ReturnType<typeof useTranslations>,
): string {
  const known: Record<string, string> = {
    clubs: t("panel.clubs"),
    students: t("panel.students"),
    coaches: t("panel.coaches"),
    classes: t("panel.classes"),
    payments: t("panel.payments"),
    memberships: t("panel.memberships"),
    reviews: t("panel.reviews"),
    data: t("panel.data"),
    attendance: t("panel.attendance"),
    branches: t("panel.branches"),
    coach: t("panel.coach"),
    settings: t("panel.settings"),
    new: t("panel.new"),
    edit: t("panel.edit"),
    reservations: t("panel.reservations"),
  };

  if (known[segment]) return known[segment];
  if (previous === "clubs" || previous === "classes") {
    return t("panel.details");
  }
  return decodeURIComponent(segment);
}

function buildCrumbs(
  pathname: string,
  t: ReturnType<typeof useTranslations>,
): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return [{ label: t("panel.dashboard") }];
  }

  const crumbs: Crumb[] = [{ href: "/", label: t("panel.dashboard") }];
  let href = "";

  parts.forEach((part, index) => {
    href += `/${part}`;
    const isLast = index === parts.length - 1;
    crumbs.push({
      href: isLast ? undefined : href,
      label: segmentLabel(part, parts[index - 1], t),
    });
  });

  return crumbs;
}

export function PanelBreadcrumbsSection() {
  const pathname = usePathname();
  const t = useTranslations();
  const crumbs = useMemo(() => buildCrumbs(pathname, t), [pathname, t]);

  if (pathname === "/") return null;

  return (
    <div className="border-b border-border/60 px-4 py-2.5 lg:px-6">
      <Breadcrumbs aria-label={t("panel.breadcrumbs")}>
        {crumbs.map((crumb) =>
          crumb.href ? (
            <Breadcrumbs.Item
              key={`${crumb.href}-${crumb.label}`}
              href={crumb.href}
              render={(props) => {
                const linkProps = props as ComponentProps<typeof Link>;
                return <Link {...linkProps} href={crumb.href!} />;
              }}
            >
              {crumb.label}
            </Breadcrumbs.Item>
          ) : (
            <Breadcrumbs.Item key={`current-${crumb.label}`}>
              {crumb.label}
            </Breadcrumbs.Item>
          ),
        )}
      </Breadcrumbs>
    </div>
  );
}
