"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Label,
  ListBox,
  Select,
  Spinner,
  Table,
  toast,
} from "@heroui/react";
import { useAdminReports, useResolveReport } from "@api/admin";

const targetLabels = { club: "باشگاه", coach: "مربی", class: "کلاس" } as const;

export function ReportsScreen() {
  const [status, setStatus] = useState("pending");
  const reports = useAdminReports(status);
  const resolve = useResolveReport();

  const decide = async (
    reportId: string,
    next: "resolved" | "rejected" | "closed",
  ) => {
    const resolutionNote =
      window.prompt("یادداشت نتیجه بررسی (اختیاری)")?.trim() ?? "";
    try {
      await resolve.mutateAsync({ reportId, status: next, resolutionNote });
      toast.success("وضعیت گزارش به‌روزرسانی شد");
    } catch {
      toast.danger("ثبت نتیجه گزارش ناموفق بود");
    }
  };

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">گزارش‌های کاربران</h1>
        <Select
          value={status}
          placeholder="همه گزارش‌ها"
          onChange={(next) => {
            if (typeof next === "string") setStatus(next);
          }}
        >
          <Label className="sr-only">وضعیت</Label>
          <Select.Trigger className="h-11 rounded-xl border border-border bg-surface px-4 text-sm">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="" textValue="همه گزارش‌ها">
                همه گزارش‌ها
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="pending" textValue="در انتظار بررسی">
                در انتظار بررسی
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="resolved" textValue="اصلاح‌شده">
                اصلاح‌شده
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="rejected" textValue="ردشده">
                ردشده
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="closed" textValue="بسته‌شده">
                بسته‌شده
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
      <Card
        variant="transparent"
        className="mt-5 overflow-hidden rounded-[1.75rem] border border-border bg-surface"
      >
        {reports.isPending ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : reports.isError ? (
          <div className="p-12 text-center">
            <Button variant="secondary" onPress={() => reports.refetch()}>
              تلاش دوباره
            </Button>
          </div>
        ) : !reports.data?.items.length ? (
          <p className="p-12 text-center text-muted">گزارشی وجود ندارد.</p>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="گزارش‌های کاربران">
                <Table.Header>
                  <Table.Column isRowHeader>موضوع</Table.Column>
                  <Table.Column>دلیل</Table.Column>
                  <Table.Column>توضیحات</Table.Column>
                  <Table.Column>وضعیت</Table.Column>
                  <Table.Column>عملیات</Table.Column>
                </Table.Header>
                <Table.Body>
                  {reports.data.items.map((item) => (
                    <Table.Row key={item.id} id={item.id}>
                      <Table.Cell>{targetLabels[item.targetType]}</Table.Cell>
                      <Table.Cell>{item.reason}</Table.Cell>
                      <Table.Cell className="max-w-xs whitespace-normal text-muted">
                        {item.details || "—"}
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          size="sm"
                          color={
                            item.status === "pending"
                              ? "warning"
                              : item.status === "resolved"
                                ? "success"
                                : "default"
                          }
                        >
                          {item.status}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        {item.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onPress={() => void decide(item.id, "resolved")}
                            >
                              اصلاح شد
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onPress={() => void decide(item.id, "rejected")}
                            >
                              رد
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onPress={() => void decide(item.id, "closed")}
                            >
                              بستن
                            </Button>
                          </div>
                        ) : (
                          "—"
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
