"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Button, Card, Chip, Input, Spinner, Table } from "@heroui/react";
import { type AdminAuditLog, useAdminAuditLogs } from "@api/admin";
import { EntityDetailsModal } from "@ui/entity-details-modal";

const methodLabels: Record<string, string> = {
  POST: "ایجاد",
  PUT: "جایگزینی",
  PATCH: "ویرایش",
  DELETE: "حذف",
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));

function eventLabel(item: AdminAuditLog) {
  const target = item.path
    .replace(/^\/api\/v1\/admin\/?/, "")
    .replaceAll("/", " / ");
  return `${methodLabels[item.method] ?? item.method} ${target || "پنل ادمین"}`;
}

export function ActivityLogScreen() {
  const logs = useAdminAuditLogs(500);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");
  const [selected, setSelected] = useState<AdminAuditLog | null>(null);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const items = useMemo(
    () =>
      (logs.data?.items ?? []).filter((item) => {
        if (method && item.method !== method) return false;
        if (!deferredSearch) return true;
        return [
          item.action,
          item.path,
          item.actorId,
          JSON.stringify(item.metadata),
        ]
          .join(" ")
          .toLowerCase()
          .includes(deferredSearch);
      }),
    [deferredSearch, logs.data?.items, method],
  );

  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-7xl">
        <div>
          <h1 className="text-2xl font-semibold">رویدادهای مدیریتی</h1>
          <p className="mt-1 text-sm text-muted">
            تاریخچه عملیات ادمین با زمان، نتیجه، عامل و اطلاعات مرتبط
          </p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_13rem]">
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جست‌وجو در مسیر، شناسه و اطلاعات رویداد"
            aria-label="جست‌وجوی رویدادها"
            className="h-11 rounded-xl"
            variant="secondary"
          />
          <label className="sr-only" htmlFor="activity-method">
            نوع عملیات
          </label>
          <select
            id="activity-method"
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          >
            <option value="">همه عملیات</option>
            <option value="POST">ایجاد</option>
            <option value="PATCH">ویرایش</option>
            <option value="PUT">جایگزینی</option>
            <option value="DELETE">حذف</option>
          </select>
        </div>
        <Card
          variant="transparent"
          className="mt-4 overflow-hidden rounded-[1.75rem] border border-border bg-surface"
        >
          {logs.isPending ? (
            <div className="flex justify-center py-16">
              <Spinner aria-label="در حال دریافت رویدادها" />
            </div>
          ) : logs.isError ? (
            <div className="px-6 py-12 text-center">
              <p className="text-muted">دریافت رویدادها انجام نشد.</p>
              <Button
                className="mt-4"
                size="sm"
                variant="secondary"
                onPress={() => logs.refetch()}
              >
                تلاش دوباره
              </Button>
            </div>
          ) : items.length === 0 ? (
            <p className="px-6 py-12 text-center text-muted">
              رویدادی با این فیلتر پیدا نشد.
            </p>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="رویدادهای مدیریتی">
                  <Table.Header>
                    <Table.Column isRowHeader>رویداد</Table.Column>
                    <Table.Column>زمان</Table.Column>
                    <Table.Column>نتیجه</Table.Column>
                    <Table.Column>عامل</Table.Column>
                    <Table.Column>جزئیات</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {items.map((item) => (
                      <Table.Row key={item.id} id={item.id}>
                        <Table.Cell>
                          <p className="font-medium">{eventLabel(item)}</p>
                          <p
                            className="mt-1 max-w-md truncate text-xs text-muted"
                            dir="ltr"
                          >
                            {item.path}
                          </p>
                        </Table.Cell>
                        <Table.Cell className="whitespace-nowrap tabular-nums">
                          {formatDateTime(item.createdAt)}
                        </Table.Cell>
                        <Table.Cell>
                          <Chip
                            size="sm"
                            color={item.statusCode < 400 ? "success" : "danger"}
                          >
                            {item.statusCode.toLocaleString("fa-IR")}
                          </Chip>
                        </Table.Cell>
                        <Table.Cell className="max-w-40 truncate" dir="ltr">
                          {item.actorId}
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size="sm"
                            variant="secondary"
                            onPress={() => setSelected(item)}
                          >
                            مشاهده جزئیات
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </Card>
      </div>
      <EntityDetailsModal
        isOpen={Boolean(selected)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelected(null);
        }}
        title={selected ? eventLabel(selected) : "جزئیات رویداد"}
        description="اطلاعات کامل ثبت‌شده برای پیگیری و حسابرسی این عملیات"
        sections={
          selected
            ? [
                {
                  title: "عملیات",
                  items: [
                    { label: "متد", value: selected.method, dir: "ltr" },
                    {
                      label: "کد نتیجه",
                      value: selected.statusCode.toLocaleString("fa-IR"),
                    },
                    {
                      label: "زمان دقیق",
                      value: formatDateTime(selected.createdAt),
                    },
                    {
                      label: "عنوان ثبت‌شده",
                      value: selected.action,
                      dir: "ltr",
                    },
                    {
                      label: "مسیر درخواست",
                      value: selected.path,
                      dir: "ltr",
                      wide: true,
                    },
                  ],
                },
                {
                  title: "عامل",
                  items: [
                    {
                      label: "شناسه ادمین",
                      value: selected.actorId,
                      dir: "ltr",
                    },
                    { label: "IP", value: selected.ip, dir: "ltr" },
                  ],
                },
                {
                  title: "اطلاعات مرتبط",
                  items: [
                    {
                      label: "پارامترها و متادیتا",
                      value: (
                        <pre
                          className="overflow-x-auto whitespace-pre-wrap text-xs leading-6"
                          dir="ltr"
                        >
                          {JSON.stringify(selected.metadata, null, 2)}
                        </pre>
                      ),
                      wide: true,
                    },
                  ],
                },
              ]
            : []
        }
      />
    </main>
  );
}
