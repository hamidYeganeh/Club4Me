"use client";

import {
  useCreateSupportTicket,
  useReplySupportTicket,
  useSupportTickets,
  type SupportTicket,
} from "@api";
import { Button, Card, toast } from "@heroui/react";
import { FormEvent, useState } from "react";

import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { TicketListSkeleton } from "@/components/loading-skeletons";
import { RequestFailureState } from "@/components/request-failure-state";
import { getQueryFailure } from "@/lib/request-failure";

const fieldClass =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent";

export function SupportTicketsScreen() {
  const tickets = useSupportTickets();
  const failure = getQueryFailure(tickets.error, tickets.fetchStatus);
  const create = useCreateSupportTicket();
  const reply = useReplySupportTicket();
  const [open, setOpen] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await create.mutateAsync({
        subject: String(data.get("subject")),
        category: String(data.get("category")) as SupportTicket["category"],
        message: String(data.get("message")),
        preferredContact: String(
          data.get("preferredContact"),
        ) as SupportTicket["preferredContact"],
      });
      form.reset();
      setOpen(false);
      toast.success("تیکت ثبت شد");
    } catch {
      toast.danger("ثبت تیکت انجام نشد");
    }
  };

  return (
    <main className="app-page">
      <SecondaryHeader
        title="پشتیبانی"
        showFilter={false}
        backHref="/athlete/settings"
      />
      <div className="space-y-5 pt-5">
        <Button variant="primary" onPress={() => setOpen((value) => !value)}>
          ثبت تیکت جدید
        </Button>
        {open ? (
          <Card className="p-4">
            <form className="space-y-3" onSubmit={submit}>
              <input
                required
                name="subject"
                aria-label="موضوع"
                minLength={3}
                placeholder="موضوع"
                className={fieldClass}
              />
              <select
                name="category"
                aria-label="دسته‌بندی درخواست"
                className={fieldClass}
              >
                <option value="reservation">رزرو</option>
                <option value="payment">پرداخت</option>
                <option value="account">حساب کاربری</option>
                <option value="club">باشگاه</option>
                <option value="other">سایر</option>
              </select>
              <textarea
                required
                name="message"
                aria-label="شرح درخواست"
                minLength={5}
                placeholder="شرح درخواست"
                className={`${fieldClass} min-h-28`}
              />
              <select
                name="preferredContact"
                aria-label="روش دریافت پاسخ"
                className={fieldClass}
              >
                <option value="in_app">پاسخ داخل اپ</option>
                <option value="phone">تماس تلفنی</option>
              </select>
              <Button
                type="submit"
                variant="primary"
                isPending={create.isPending}
              >
                ارسال
              </Button>
            </form>
          </Card>
        ) : null}
        {tickets.isPending && !failure ? (
          <TicketListSkeleton count={3} />
        ) : null}
        {failure ? (
          <RequestFailureState
            error={failure}
            onRetry={() => void tickets.refetch()}
          />
        ) : null}
        {!tickets.isPending && !failure && !tickets.data?.items.length ? (
          <div className="rounded-3xl bg-surface-secondary p-8 text-center">
            <h2 className="font-bold">هنوز درخواستی ثبت نکرده‌اید</h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              برای پیگیری رزرو، پرداخت یا حساب خود، درخواست جدیدی ثبت کنید.
            </p>
          </div>
        ) : null}
        {tickets.data?.items.map((ticket) => (
          <Card key={ticket.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{ticket.subject}</h2>
              <span className="text-xs text-muted">
                {statusLabel[ticket.status]}
              </span>
            </div>
            <div className="space-y-2">
              {ticket.messages.map((message) => (
                <p
                  key={message.id}
                  className={
                    message.authorType === "agent"
                      ? "rounded-xl bg-accent/10 p-3 text-sm"
                      : "rounded-xl bg-default/50 p-3 text-sm"
                  }
                >
                  {message.body}
                </p>
              ))}
            </div>
            {ticket.status !== "closed" ? (
              <form
                className="flex gap-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const data = new FormData(form);
                  try {
                    await reply.mutateAsync({
                      ticketId: ticket.id,
                      message: String(data.get("message")),
                    });
                    form.reset();
                  } catch {
                    toast.danger("ارسال پاسخ انجام نشد؛ دوباره تلاش کنید");
                  }
                }}
              >
                <input
                  required
                  name="message"
                  aria-label="پاسخ شما"
                  placeholder="پاسخ شما"
                  className={fieldClass}
                />
                <Button type="submit" isPending={reply.isPending}>
                  ارسال
                </Button>
              </form>
            ) : null}
          </Card>
        ))}
      </div>
    </main>
  );
}

const statusLabel: Record<SupportTicket["status"], string> = {
  open: "باز",
  in_progress: "در حال بررسی",
  waiting_for_user: "منتظر پاسخ شما",
  resolved: "حل‌شده",
  closed: "بسته",
};
