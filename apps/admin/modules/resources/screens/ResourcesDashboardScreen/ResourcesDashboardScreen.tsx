"use client";

import { Input as HeroInput } from "@heroui/react";
import { Card, Spinner } from "@heroui/react";
import {
  resourceGroups,
  resourcePagePath,
  resourceApiPath,
  useResources,
  useSeedAllResources,
} from "@api/resources";
import { useState } from "react";
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
  const [search, setSearch] = useState("");
  const seed = useSeedAllResources();
  const groups = resourceGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        `${group.title} ${item.label} ${resourceApiPath(group.segment, item.segment)}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    }))
    .filter((group) => group.items.length);
  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("dashboardDescription")}</p>
      </div>
      <div className="mt-4 space-y-3">
        <HeroInput
          aria-label="جست‌وجوی فهرست‌های پایه"
          placeholder="جست‌وجوی عنوان یا مسیر API"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-xl border border-border bg-surface p-3"
        />
        <button
          type="button"
          disabled={seed.isPending}
          onClick={() => {
            if (
              window.confirm(
                "داده‌های اولیه ایران به همه فهرست‌ها اضافه شوند؟ گزینه‌های موجود حفظ می‌شوند.",
              )
            )
              seed.mutate();
          }}
          className="rounded-xl bg-accent px-4 py-2 text-accent-foreground disabled:opacity-50"
        >
          {seed.isPending ? "در حال بارگذاری…" : "افزودن داده‌های اولیه ایران"}
        </button>
        <p className="text-xs text-muted">
          گزینه‌های موجود حفظ می‌شوند؛ داده تکراری و مقاله نمونه ساخته نمی‌شود.
        </p>
        {seed.isError && (
          <p role="alert" className="text-sm text-danger">
            بارگذاری کامل نشد؛ می‌توانید دوباره تلاش کنید.
          </p>
        )}
        {seed.isSuccess && (
          <p role="status" className="text-sm">
            {seed.data.created} گزینه اضافه شد؛ {seed.data.existing} گزینه از
            قبل موجود بود.
          </p>
        )}
        {!groups.length && (
          <p className="text-sm text-muted">فهرستی پیدا نشد.</p>
        )}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {groups.map((group) => (
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
                  <span>
                    {item.label}
                    <span
                      dir="ltr"
                      className="mt-1 block break-all text-xs text-muted"
                    >
                      /api/v1{resourceApiPath(group.segment, item.segment)}
                    </span>
                  </span>
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
