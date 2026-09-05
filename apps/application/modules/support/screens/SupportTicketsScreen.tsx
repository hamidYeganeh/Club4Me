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

const fieldClass =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent";

export function SupportTicketsScreen() {
  const tickets = useSupportTickets();
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
    <main className="min-h-dvh pb-8">
      <SecondaryHeader title="پشتیبانی" showFilter={false} />
      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-5">
        <Button variant="primary" onPress={() => setOpen((value) => !value)}>
          ثبت تیکت جدید
        </Button>
        {open ? (
          <Card className="p-4">
            <form className="space-y-3" onSubmit={submit}>
              <input
                required
                name="subject"
                minLength={3}
                placeholder="موضوع"
                className={fieldClass}
              />
              <select name="category" className={fieldClass}>
                <option value="reservation">رزرو</option>
                <option value="payment">پرداخت</option>
                <option value="account">حساب کاربری</option>
                <option value="club">باشگاه</option>
                <option value="other">سایر</option>
              </select>
              <textarea
                required
                name="message"
                minLength={5}
                placeholder="شرح درخواست"
                className={`${fieldClass} min-h-28`}
              />
              <select name="preferredContact" className={fieldClass}>
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
        {tickets.isPending ? <TicketListSkeleton count={3} /> : null}
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
                  await reply.mutateAsync({
                    ticketId: ticket.id,
                    message: String(data.get("message")),
                  });
                  form.reset();
                }}
              >
                <input
                  required
                  name="message"
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
