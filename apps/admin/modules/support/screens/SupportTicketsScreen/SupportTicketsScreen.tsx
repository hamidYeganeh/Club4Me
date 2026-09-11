"use client";

import { FormSelect, FormOption } from "@repo/ui/form-select";
import {
  type SupportTicket,
  useAdminContactLeads,
  useAdminServiceReviews,
  useAdminSupportTickets,
  useModerateServiceReview,
  useSupportOrderContext,
  useUpdateContactLead,
  useUpdateSupportTicket,
} from "@api";
import {
  Button,
  Card,
  Chip,
  Label,
  Modal,
  Spinner,
  Table,
  TextArea,
  toast,
} from "@heroui/react";
import { EntityDetailsModal } from "@ui/entity-details-modal";
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
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [action, setAction] = useState<{
    item: SupportTicket;
    status: "in_progress" | "waiting_for_user" | "resolved" | "closed";
  } | null>(null);
  const [reply, setReply] = useState("");
  const [formError, setFormError] = useState("");
  const tickets = useAdminSupportTickets(status || undefined);
  const update = useUpdateSupportTicket();
  const leads = useAdminContactLeads();
  const updateLead = useUpdateContactLead();
  const reviews = useAdminServiceReviews();
  const moderateReview = useModerateServiceReview();

  const act = async () => {
    if (!action || update.isPending) return;
    const cleanReply = reply.trim();
    if (cleanReply.length < 2) {
      setFormError("پاسخ کارشناس باید حداقل ۲ نویسه باشد.");
      return;
    }
    try {
      await update.mutateAsync({
        ticketId: action.item.id,
        status: action.status,
        reply: cleanReply,
      });
      toast.success("تیکت به‌روزرسانی و به کاربر اطلاع داده شد");
      setAction(null);
      setReply("");
      setFormError("");
    } catch {
      toast.danger("به‌روزرسانی تیکت ناموفق بود");
    }
  };

  const openAction = (
    item: SupportTicket,
    next: "in_progress" | "waiting_for_user" | "resolved" | "closed",
  ) => {
    setAction({ item, status: next });
    setReply("");
    setFormError("");
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
        <FormSelect
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm"
          value={status}
          onChange={(event) => setStatus(event)}
          aria-label="فیلتر وضعیت تیکت"
        >
          <FormOption value="">همه</FormOption>
          {Object.entries(statusLabel).map(([value, label]) => (
            <FormOption key={value} value={value}>
              {label}
            </FormOption>
          ))}
        </FormSelect>
      </div>
      <Card className="mt-5 rounded-[1.75rem] border border-border bg-surface p-2">
        {tickets.isPending ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : tickets.isError ? (
          <div className="px-6 py-12 text-center">
            <p className="text-muted">دریافت تیکت‌ها ناموفق بود.</p>
            <Button
              className="mt-4"
              size="sm"
              variant="secondary"
              onPress={() => tickets.refetch()}
            >
              تلاش دوباره
            </Button>
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
                            variant="ghost"
                            onPress={() => setSelected(item)}
                          >
                            جزئیات
                          </Button>
                          {item.status !== "closed" ? (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onPress={() => openAction(item, "in_progress")}
                              >
                                پیگیری
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onPress={() =>
                                  openAction(item, "waiting_for_user")
                                }
                              >
                                منتظر کاربر
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onPress={() => openAction(item, "resolved")}
                              >
                                حل شد
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onPress={() => openAction(item, "closed")}
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
      <section className="mt-8">
        <h2 className="text-xl font-semibold">درخواست‌های فرم سایت</h2>
        <p className="mt-1 text-sm text-muted">
          سرنخ‌های ثبت‌شده همراه با رضایت تماس
        </p>
        <Card className="mt-4 rounded-[1.75rem] border border-border bg-surface p-4">
          {leads.isPending ? (
            <Spinner />
          ) : !leads.data?.items.length ? (
            <p className="py-6 text-center text-muted">
              درخواستی ثبت نشده است.
            </p>
          ) : (
            <div className="grid gap-3">
              {leads.data.items.map((lead) => (
                <div
                  key={lead._id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {lead.name} ·{" "}
                      <a className="text-accent" href={`mailto:${lead.email}`}>
                        {lead.email}
                      </a>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                      {lead.note || "بدون توضیح"}
                    </p>
                  </div>
                  <FormSelect
                    aria-label={`وضعیت درخواست ${lead.name}`}
                    className="h-10 rounded-xl border border-border bg-surface px-3 text-sm"
                    value={lead.status}
                    disabled={updateLead.isPending}
                    onChange={(event) =>
                      updateLead.mutate({
                        id: lead._id,
                        status: event as typeof lead.status,
                      })
                    }
                  >
                    <FormOption value="new">جدید</FormOption>
                    <FormOption value="contacted">تماس گرفته شد</FormOption>
                    <FormOption value="closed">بسته</FormOption>
                  </FormSelect>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">نظرات مربی و کلاس</h2>
        <p className="mt-1 text-sm text-muted">
          بازبینی نظرات دارای حضور تأییدشده
        </p>
        <Card className="mt-4 rounded-[1.75rem] border border-border bg-surface p-4">
          {reviews.isPending ? (
            <Spinner />
          ) : !reviews.data?.items.length ? (
            <p className="py-6 text-center text-muted">نظری ثبت نشده است.</p>
          ) : (
            <div className="grid gap-3">
              {reviews.data.items.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-border p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {review.targetType === "coach" ? "مربی" : "کلاس"} ·{" "}
                        {review.rating.toLocaleString("fa-IR")} از ۵
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                        {review.body || "بدون متن"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        isDisabled={review.status === "published"}
                        onPress={() =>
                          moderateReview.mutate({
                            reviewId: review.id,
                            status: "published",
                          })
                        }
                      >
                        انتشار
                      </Button>
                      <Button
                        size="sm"
                        variant="danger-soft"
                        isDisabled={review.status === "hidden"}
                        onPress={() =>
                          moderateReview.mutate({
                            reviewId: review.id,
                            status: "hidden",
                            reason: "moderated_by_admin",
                          })
                        }
                      >
                        پنهان‌سازی
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
      <EntityDetailsModal
        isOpen={Boolean(selected)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelected(null);
        }}
        title={selected?.subject ?? "جزئیات تیکت"}
        description="مشخصات درخواست و تاریخچه کامل گفت‌وگو"
        sections={
          selected
            ? [
                {
                  title: "درخواست",
                  items: [
                    { label: "شناسه تیکت", value: selected.id, dir: "ltr" },
                    {
                      label: "شناسه درخواست‌دهنده",
                      value: selected.requesterId,
                      dir: "ltr",
                    },
                    { label: "دسته", value: selected.category },
                    {
                      label: "روش تماس",
                      value:
                        selected.preferredContact === "phone"
                          ? "تماس تلفنی"
                          : "داخل اپ",
                    },
                    { label: "وضعیت", value: statusLabel[selected.status] },
                    {
                      label: "کارشناس مسئول",
                      value: selected.assigneeId,
                      dir: "ltr",
                    },
                  ],
                },
                ...(selected.referenceId
                  ? [
                      {
                        title: "سفارش مرتبط",
                        items: [
                          {
                            label: "وضعیت سفارش و پرداخت",
                            value: (
                              <SupportOrderDetails ticketId={selected.id} />
                            ),
                          },
                        ],
                      },
                    ]
                  : []),
                {
                  title: "گفت‌وگو",
                  items: [
                    {
                      label: "همه پیام‌ها",
                      value: (
                        <ol className="space-y-3">
                          {selected.messages.map((message) => (
                            <li
                              key={message.id}
                              className="rounded-lg bg-surface p-3"
                            >
                              <div className="flex flex-wrap justify-between gap-2 text-xs text-muted">
                                <span>
                                  {message.authorType === "agent"
                                    ? "کارشناس"
                                    : "کاربر"}
                                </span>
                                <time dateTime={message.createdAt}>
                                  {new Intl.DateTimeFormat("fa-IR", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  }).format(new Date(message.createdAt))}
                                </time>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap">
                                {message.body}
                              </p>
                            </li>
                          ))}
                        </ol>
                      ),
                      wide: true,
                    },
                  ],
                },
                {
                  title: "زمان‌ها",
                  items: [
                    {
                      label: "ایجاد",
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
                    {
                      label: "حل‌شدن",
                      value: selected.resolvedAt
                        ? new Intl.DateTimeFormat("fa-IR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(selected.resolvedAt))
                        : null,
                    },
                  ],
                },
              ]
            : []
        }
      />
      <Modal.Backdrop
        isOpen={Boolean(action)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setAction(null);
        }}
        variant="blur"
      >
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>پاسخ و تغییر وضعیت تیکت</Modal.Heading>
              <p className="mt-1 text-sm leading-6 text-muted">
                پاسخ برای کاربر ارسال می‌شود و در تاریخچه تیکت باقی می‌ماند.
              </p>
            </Modal.Header>
            <Modal.Body>
              <form
                id="support-action-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void act();
                }}
              >
                <Label htmlFor="support-reply" className="text-sm font-medium">
                  پاسخ کارشناس
                </Label>
                <TextArea
                  id="support-reply"
                  required
                  minLength={2}
                  maxLength={5000}
                  value={reply}
                  onChange={(event) => {
                    setReply(event.target.value);
                    if (formError) setFormError("");
                  }}
                  rows={5}
                  className="mt-2 rounded-xl border border-border bg-surface-secondary px-3 py-2 text-sm"
                  aria-describedby={
                    formError ? "support-reply-error" : undefined
                  }
                />
                {formError ? (
                  <p
                    id="support-reply-error"
                    role="alert"
                    className="mt-2 text-sm text-danger"
                  >
                    {formError}
                  </p>
                ) : null}
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={() => setAction(null)}>
                انصراف
              </Button>
              <Button
                type="submit"
                form="support-action-form"
                isPending={update.isPending}
              >
                ثبت و ارسال پاسخ
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </main>
  );
}

function SupportOrderDetails({ ticketId }: { ticketId: string }) {
  const context = useSupportOrderContext(ticketId);
  if (context.isPending) return <p>در حال دریافت سفارش…</p>;
  if (context.isError)
    return (
      <div>
        <p role="alert">دریافت سفارش انجام نشد یا سفارش دیگر در دسترس نیست.</p>
        <Button size="sm" onPress={() => void context.refetch()}>
          تلاش دوباره
        </Button>
      </div>
    );
  const order = context.data?.order;
  if (!order) return <p>این تیکت سفارش مرتبط ندارد.</p>;
  const date = (value: string | null) =>
    value
      ? new Date(value).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })
      : "—";
  const state = (value: string | null) =>
    value
      ? ({
          pending: "در انتظار",
          paid: "پرداخت‌شده",
          failed: "ناموفق",
          refunded: "بازپرداخت‌شده",
          partially_refunded: "بازپرداخت جزئی",
          reserved: "رزروشده",
          confirmed: "تأییدشده",
          cancelled: "لغوشده",
          active: "فعال",
          completed: "تمام‌شده",
          not_required: "بدون نیاز به پرداخت",
        }[value] ?? value)
      : "—";
  return (
    <div className="space-y-3">
      <p className="font-bold">{order.title}</p>
      <p dir="ltr" className="break-all font-mono text-xs">
        {order.id}
      </p>
      <p>
        وضعیت: {state(order.status)} · پرداخت: {state(order.paymentStatus)}
      </p>
      <p>
        مبلغ سفارش:{" "}
        {order.amount == null
          ? "—"
          : `${order.amount.toLocaleString("fa-IR")} ${order.currency === "IRR" ? "ریال" : order.currency}`}
      </p>
      <p>ثبت سفارش: {date(order.createdAt)}</p>
      {order.cancelledAt ? <p>لغو: {date(order.cancelledAt)}</p> : null}
      <h3 className="font-bold">سوابق سامانه پرداخت مشترک</h3>
      {!context.data?.payments.length ? (
        <p>تراکنشی در سامانه مشترک برای این سفارش ثبت نشده است.</p>
      ) : (
        context.data.payments.map((payment) => (
          <div
            key={payment.id}
            className="space-y-1 rounded-xl border border-border p-3"
          >
            <p>
              {state(payment.status)} · {payment.amount.toLocaleString("fa-IR")}{" "}
              ریال
            </p>
            <p>
              شناسه پرداخت: <span dir="ltr">{payment.id}</span>
            </p>
            <p>ایجاد: {date(payment.createdAt)}</p>
            {payment.paidAt ? <p>ثبت پرداخت: {date(payment.paidAt)}</p> : null}
            {payment.failedAt ? <p>ناموفق: {date(payment.failedAt)}</p> : null}
            {payment.refundedAmount > 0 ? (
              <p>
                بازپرداخت ثبت‌شده:{" "}
                {payment.refundedAmount.toLocaleString("fa-IR")} ریال
              </p>
            ) : null}
            {payment.providerReference ? (
              <p>
                شناسه پیگیری: <span dir="ltr">{payment.providerReference}</span>
              </p>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}
