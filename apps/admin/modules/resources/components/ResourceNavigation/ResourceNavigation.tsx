"use client";

import { resourceGroups, resourcePagePath } from "@api/resources";
import { Icon } from "@theme/icon";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ButtonLink } from "@/components/button-link";

export function ResourceNavigation() {
  const t = useTranslations("resourcesPage");
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const normalized = search.trim().toLocaleLowerCase("fa");
  const groups = useMemo(
    () =>
      resourceGroups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) =>
              !normalized ||
              item.label.toLocaleLowerCase("fa").includes(normalized),
          ),
        }))
        .filter((group) => group.items.length),
    [normalized],
  );

  return (
    <aside className="w-full shrink-0 border-b border-border bg-surface p-3 lg:h-full lg:w-72 lg:overflow-y-auto lg:border-b-0 lg:border-e">
      <ButtonLink
        href="/resources"
        variant="ghost"
        className="mb-3 w-full justify-start rounded-xl px-3"
      >
        <Icon name="database" />
        {t("title")}
      </ButtonLink>
      <label className="relative block">
        <span className="sr-only">{t("navSearch")}</span>
        <Icon
          name="magnifying-glass"
          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("navSearch")}
          className="h-10 w-full rounded-xl border border-border bg-surface-secondary px-3 pe-10 text-sm outline-none focus:border-accent"
        />
      </label>
      <nav aria-label={t("navigation")} className="mt-3 space-y-2">
        {groups.map((group) => {
          const activeGroup = pathname.startsWith(
            `/resources/${group.segment}/`,
          );
          return (
            <details
              key={group.id}
              open={activeGroup || Boolean(normalized)}
              className="group rounded-xl border border-border/70 bg-background/40"
            >
              <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold marker:hidden">
                {group.title}
                <span className="float-end text-xs text-muted">
                  {group.items.length}
                </span>
              </summary>
              <div className="space-y-1 border-t border-border/70 p-1.5">
                {group.items.map((item) => {
                  const href = resourcePagePath(group.segment, item.segment);
                  const active = pathname === href;
                  return (
                    <ButtonLink
                      key={item.key}
                      href={href}
                      variant="ghost"
                      className={`h-auto min-h-9 w-full justify-start rounded-lg px-2.5 py-2 text-sm ${active ? "bg-accent/15 text-accent" : "text-muted"}`}
                    >
                      {item.label}
                    </ButtonLink>
                  );
                })}
              </div>
            </details>
          );
        })}
      </nav>
    </aside>
  );
}
