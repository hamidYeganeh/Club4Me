"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  Table,
  TextArea,
  toast,
} from "@heroui/react";
import {
  type ContentReport,
  useAdminReports,
  useResolveReport,
} from "@api/admin";
import { EntityDetailsModal } from "@ui/entity-details-modal";
import { NotificationDeliverySection } from "./NotificationDeliverySection";

const targetLabels = { club: "باشگاه", coach: "مربی", class: "کلاس" } as const;

export function ReportsScreen() {
  const [status, setStatus] = useState("pending");
  const [selected, setSelected] = useState<ContentReport | null>(null);
  const [decision, setDecision] = useState<{
    item: ContentReport;
    status: "resolved" | "rejected" | "closed";
  } | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [formError, setFormError] = useState("");
  const reports = useAdminReports(status);
  const resolve = useResolveReport();

  const decide = async () => {
    if (!decision || resolve.isPending) return;
    const note = resolutionNote.trim();
    if (note.length < 3) {
      setFormError("یادداشت نتیجه بررسی باید حداقل ۳ نویسه باشد.");
      return;
    }
    try {
      await resolve.mutateAsync({
        reportId: decision.item.id,
        status: decision.status,
        resolutionNote: note,
      });
      toast.success("وضعیت گزارش به‌روزرسانی شد");
      setDecision(null);
      setResolutionNote("");
      setFormError("");
    } catch {
      toast.danger("ثبت نتیجه گزارش ناموفق بود");
    }
  };

  const openDecision = (
    item: ContentReport,
    next: "resolved" | "rejected" | "closed",
  ) => {
    setDecision({ item, status: next });
    setResolutionNote("");
    setFormError("");
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
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={() => setSelected(item)}
                          >
                            جزئیات
                          </Button>
                          {item.status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onPress={() => openDecision(item, "resolved")}
                              >
                                اصلاح شد
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onPress={() => openDecision(item, "rejected")}
                              >
                                رد
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onPress={() => openDecision(item, "closed")}
                              >
                                بستن
                              </Button>
                            </>
                          ) : null}
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
      <NotificationDeliverySection />
      <EntityDetailsModal
        isOpen={Boolean(selected)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelected(null);
        }}
        title={
          selected
            ? `گزارش ${targetLabels[selected.targetType]}`
            : "جزئیات گزارش"
        }
        description="اطلاعات گزارش، موضوع مرتبط و نتیجه بررسی ادمین"
        sections={
          selected
            ? [
                {
                  title: "گزارش",
                  items: [
                    { label: "شناسه گزارش", value: selected.id, dir: "ltr" },
                    {
                      label: "شناسه گزارش‌دهنده",
                      value: selected.reporterId,
                      dir: "ltr",
                    },
                    {
                      label: "نوع موضوع",
                      value: targetLabels[selected.targetType],
                    },
                    {
                      label: "شناسه موضوع",
                      value: selected.targetId,
                      dir: "ltr",
                    },
                    { label: "دلیل", value: selected.reason, wide: true },
                    { label: "توضیحات", value: selected.details, wide: true },
                  ],
                },
                {
                  title: "نتیجه بررسی",
                  items: [
                    { label: "وضعیت", value: selected.status },
                    {
                      label: "یادداشت نتیجه",
                      value: selected.resolutionNote,
                      wide: true,
                    },
                    {
                      label: "زمان ثبت",
                      value: new Intl.DateTimeFormat("fa-IR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(selected.createdAt)),
                    },
                    {
                      label: "آخرین تغییر",
                      value: new Intl.DateTimeFormat("fa-IR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(selected.updatedAt)),
                    },
                  ],
                },
              ]
            : []
        }
      />
      <Modal.Backdrop
        isOpen={Boolean(decision)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDecision(null);
        }}
        variant="blur"
      >
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>ثبت نتیجه بررسی گزارش</Modal.Heading>
              <p className="mt-1 text-sm leading-6 text-muted">
                نتیجه و دلیل تصمیم در سابقه گزارش نگه‌داری می‌شود.
              </p>
            </Modal.Header>
            <Modal.Body>
              <form
                id="report-decision-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void decide();
                }}
              >
                <Label
                  htmlFor="report-resolution-note"
                  className="text-sm font-medium"
                >
                  یادداشت نتیجه بررسی
                </Label>
                <TextArea
                  id="report-resolution-note"
                  required
                  minLength={3}
                  maxLength={1000}
                  value={resolutionNote}
                  onChange={(event) => {
                    setResolutionNote(event.target.value);
                    if (formError) setFormError("");
                  }}
                  rows={4}
                  className="mt-2 rounded-xl border border-border bg-surface-secondary px-3 py-2 text-sm"
                  aria-describedby={
                    formError ? "report-resolution-error" : undefined
                  }
                />
                {formError ? (
                  <p
                    id="report-resolution-error"
                    role="alert"
                    className="mt-2 text-sm text-danger"
                  >
                    {formError}
                  </p>
                ) : null}
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={() => setDecision(null)}>
                انصراف
              </Button>
              <Button
                type="submit"
                form="report-decision-form"
                isPending={resolve.isPending}
              >
                ثبت نتیجه
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </main>
  );
}
