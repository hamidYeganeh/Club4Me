"use client";

import { Card, Spinner } from "@heroui/react";
import { resourceGroups, resourcePagePath, useResources } from "@api/resources";
import Link from "next/link";
import { useTranslations } from "next-intl";

function ResourceCount({
  category,
  resource,
}: {
  category: string;
  resource: string;
}) {
  const query = useResources(category, resource, { page: 1, limit: 1 });
  if (query.isPending) return <Spinner size="sm" />;
  return (
    <span className="text-sm tabular-nums text-muted">
      {query.data?.total ?? "—"}
    </span>
  );
}

export function ResourcesDashboardScreen() {
  const t = useTranslations("resourcesPage");
  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("dashboardDescription")}</p>
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {resourceGroups.map((group) => (
          <Card
            key={group.id}
            className="items-stretch rounded-[1.5rem] border border-border"
            variant="transparent"
          >
            <Card.Header className="flex-row items-center justify-between">
              <div>
                <Card.Title>{group.title}</Card.Title>
                <Card.Description>
                  {t("groupCount", { count: group.items.length })}
                </Card.Description>
              </div>
              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                {group.priority}
              </span>
            </Card.Header>
            <Card.Content className="grid gap-1 sm:grid-cols-2">
              {group.items.map((item) => (
                <Link
                  key={item.key}
                  href={resourcePagePath(group.segment, item.segment)}
                  className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-surface-secondary"
                >
                  <span>{item.label}</span>
                  <ResourceCount
                    category={group.segment}
                    resource={item.segment}
                  />
                </Link>
              ))}
            </Card.Content>
          </Card>
        ))}
      </div>
    </main>
  );
}
