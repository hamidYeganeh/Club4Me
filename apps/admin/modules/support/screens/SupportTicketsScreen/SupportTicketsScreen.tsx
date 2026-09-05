"use client";

import { useAdminSupportTickets, useUpdateSupportTicket } from "@api";
import { Button, Card, Chip, Spinner, Table, toast } from "@heroui/react";
import { useState } from "react";

const statusLabel = {
  open: "باز",
  in_progress: "در حال پیگیری",
  waiting_for_user: "منتظر کاربر",
  resolved: "حل‌شده",
  closed: "بسته",
} as const;

export function SupportTicketsScreen() {
  const [status, setStatus] = useState("open");
  const tickets = useAdminSupportTickets(status || undefined);
  const update = useUpdateSupportTicket();

  const act = async (
    ticketId: string,
    next: "in_progress" | "waiting_for_user" | "resolved" | "closed",
  ) => {
    const reply = window.prompt("پاسخ کارشناس (اختیاری)")?.trim() || undefined;
    try {
      await update.mutateAsync({ ticketId, status: next, reply });
      toast.success("تیکت به‌روزرسانی و به کاربر اطلاع داده شد");
    } catch {
      toast.danger("به‌روزرسانی تیکت ناموفق بود");
    }
  };

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">تیکت‌های پشتیبانی</h1>
          <p className="mt-1 text-sm text-muted">
            پاسخ درون‌برنامه‌ای یا پیگیری تلفنی
          </p>
        </div>
        <select
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="فیلتر وضعیت تیکت"
        >
          <option value="">همه</option>
          {Object.entries(statusLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <Card className="mt-5 rounded-[1.75rem] border border-border bg-surface p-2">
        {tickets.isPending ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : !tickets.data?.items.length ? (
          <p className="p-12 text-center text-muted">تیکتی وجود ندارد.</p>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="تیکت‌های پشتیبانی">
                <Table.Header>
                  <Table.Column isRowHeader>موضوع</Table.Column>
                  <Table.Column>دسته</Table.Column>
                  <Table.Column>آخرین پیام</Table.Column>
                  <Table.Column>تماس</Table.Column>
                  <Table.Column>وضعیت</Table.Column>
                  <Table.Column>عملیات</Table.Column>
                </Table.Header>
                <Table.Body>
                  {tickets.data.items.map((item) => (
                    <Table.Row key={item.id} id={item.id}>
                      <Table.Cell>{item.subject}</Table.Cell>
                      <Table.Cell>{item.category}</Table.Cell>
                      <Table.Cell className="max-w-xs whitespace-normal">
                        {item.messages.at(-1)?.body ?? "—"}
                      </Table.Cell>
                      <Table.Cell>
                        {item.preferredContact === "phone"
                          ? "تماس تلفنی"
                          : "داخل اپ"}
                      </Table.Cell>
                      <Table.Cell>
                        <Chip size="sm">{statusLabel[item.status]}</Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onPress={() => void act(item.id, "in_progress")}
                          >
                            پیگیری
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onPress={() =>
                              void act(item.id, "waiting_for_user")
                            }
                          >
                            منتظر کاربر
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={() => void act(item.id, "resolved")}
                          >
                            حل شد
                          </Button>
                        </div>
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
