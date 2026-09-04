"use client";

import { useDeferredValue, useState } from "react";
import { Button, Card, Chip, Spinner, Table, toast } from "@heroui/react";
import { useAdminClasses, useDisableAdminClass } from "@api/admin";

const statuses = {
  draft: "پیش‌نویس",
  published: "منتشرشده",
  registration_closed: "ثبت‌نام بسته",
  in_progress: "در حال برگزاری",
  completed: "تمام‌شده",
  cancelled: "لغوشده",
  archived: "غیرفعال",
} as const;

export function ClassesScreen() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const deferredSearch = useDeferredValue(search);
  const classes = useAdminClasses(deferredSearch, status);
  const disable = useDisableAdminClass();

  const disableClass = async (classId: string) => {
    if (!window.confirm("نمایش عمومی این کلاس غیرفعال شود؟")) return;
    try {
      await disable.mutateAsync(classId);
      toast.success("کلاس غیرفعال شد");
    } catch {
      toast.danger("غیرفعال‌کردن کلاس ناموفق بود");
    }
  };

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <h1 className="text-2xl font-semibold">مدیریت کلاس‌ها</h1>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_14rem]">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="جست‌وجوی نام کلاس"
          className="h-11 rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-accent"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-11 rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-accent"
        >
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(statuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <Card
        variant="transparent"
        className="mt-4 overflow-hidden rounded-[1.75rem] border border-border bg-surface"
      >
        {classes.isPending ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : classes.isError ? (
          <div className="px-6 py-12 text-center text-muted">
            <p>دریافت کلاس‌ها ناموفق بود.</p>
            <Button
              className="mt-4"
              size="sm"
              variant="secondary"
              onPress={() => classes.refetch()}
            >
              تلاش دوباره
            </Button>
          </div>
        ) : !classes.data?.items.length ? (
          <p className="px-6 py-12 text-center text-muted">
            کلاسی با این مشخصات پیدا نشد.
          </p>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="مدیریت کلاس‌ها">
                <Table.Header>
                  <Table.Column isRowHeader>نام</Table.Column>
                  <Table.Column>ظرفیت</Table.Column>
                  <Table.Column>وضعیت</Table.Column>
                  <Table.Column>آخرین تغییر</Table.Column>
                  <Table.Column>عملیات</Table.Column>
                </Table.Header>
                <Table.Body>
                  {classes.data.items.map((item) => (
                    <Table.Row key={item.id} id={item.id}>
                      <Table.Cell className="font-medium">
                        {item.title}
                      </Table.Cell>
                      <Table.Cell className="tabular-nums">
                        {item.enrollmentCount.toLocaleString("fa-IR")} /{" "}
                        {item.capacity.toLocaleString("fa-IR")}
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          size="sm"
                          color={
                            item.status === "published"
                              ? "success"
                              : item.status === "archived" ||
                                  item.status === "cancelled"
                                ? "danger"
                                : "default"
                          }
                        >
                          {statuses[item.status]}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell className="text-muted tabular-nums">
                        {new Intl.DateTimeFormat("fa-IR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(item.updatedAt))}
                      </Table.Cell>
                      <Table.Cell>
                        {item.status === "archived" ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            isDisabled={disable.isPending}
                            onPress={() => void disableClass(item.id)}
                          >
                            غیرفعال‌کردن
                          </Button>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </Card>
    </main>
  );
}
