"use client";
import Link from "@/components/app-link";
import { AppPageIntro } from "@/components/app-page-intro";

import {
  useCreateSupportTicket,
  useReplySupportTicket,
  useSupportTickets,
  type SupportTicket,
  type SupportReferenceType,
} from "@api";
import { Button, Card, toast } from "@heroui/react";
import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo } from "react";

import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { TicketListSkeleton } from "@/components/loading-skeletons";
import { RequestFailureState } from "@/components/request-failure-state";
import { getQueryFailure } from "@/lib/request-failure";

const fieldClass =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent";

export function SupportTicketsScreen({
  view = "list",
  ticketId,
  role = "athlete",
}: {
  view?: "list" | "new" | "detail";
  ticketId?: string;
  role?: "athlete" | "coach";
}) {
  const params = useSearchParams();
  const base = `/${role}/support`;
  const router = useRouter();
  const type = params.get("referenceType") as SupportReferenceType | null;
  const id = params.get("referenceId");
  const reference = useMemo(
    () =>
      type &&
      [
        "reservation",
        "coach_booking",
        "class_enrollment",
        "business_class_enrollment",
        "payment",
        "benefit_purchase",
      ].includes(type) &&
      /^[a-f0-9]{24}$/i.test(id ?? "")
        ? { referenceType: type, referenceId: id! }
        : undefined,
    [type, id],
  );
  const tickets = useSupportTickets();
  const failure = getQueryFailure(tickets.error, tickets.fetchStatus);
  const create = useCreateSupportTicket();
  const reply = useReplySupportTicket();
  useEffect(() => {
    if (view === "list" && reference?.referenceId)
      router.replace(`${base}/new?${params.toString()}`);
  }, [view, base, params, router, reference]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (create.isPending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const created = await create.mutateAsync({
        ...reference,
        subject: String(data.get("subject")),
        category: String(data.get("category")) as SupportTicket["category"],
        message: String(data.get("message")),
        preferredContact: String(
          data.get("preferredContact"),
        ) as SupportTicket["preferredContact"],
      });
      form.reset();
      router.replace(`${base}/${created.id}`);
      toast.success("تیکت ثبت شد");
    } catch {
      toast.danger("ثبت تیکت انجام نشد");
    }
  };

  return (
    <main className="app-page">
      <SecondaryHeader
        title={
          view === "new"
            ? "ثبت تیکت جدید"
            : view === "detail"
              ? "گفت‌وگوی پشتیبانی"
              : "پشتیبانی"
        }
        showFilter={false}
        backHref={view === "list" ? `/${role}/settings` : base}
      />
      <AppPageIntro
        page={
          view === "new"
            ? "supportNew"
            : view === "detail"
              ? "supportThread"
              : "support"
        }
      />
      <div className="space-y-5 pt-5">
        {view === "list" ? (
          <Link
            href={`${base}/new`}
            className="inline-flex rounded-2xl bg-accent px-5 py-3 font-bold text-accent-foreground"
          >
            ثبت تیکت جدید
          </Link>
        ) : null}
        {view === "new" ? (
          <Card className="p-4">
            <form className="space-y-3" onSubmit={submit}>
              {reference ? (
                <div className="rounded-xl bg-accent/10 p-3 text-sm">
                  <p>درخواست به سفارش شما متصل می‌شود.</p>
                  <p dir="ltr" className="mt-1 break-all font-mono text-xs">
                    {reference.referenceId}
                  </p>
                </div>
              ) : null}
              <input
                required
                name="subject"
                maxLength={160}
                defaultValue={reference ? "پیگیری سفارش" : ""}
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
                maxLength={5000}
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
        {view !== "new" && tickets.isPending && !failure ? (
          <TicketListSkeleton count={3} />
        ) : null}
        {view !== "new" && failure ? (
          <RequestFailureState
            error={failure}
            onRetry={() => void tickets.refetch()}
          />
        ) : null}
        {view === "list" &&
        !tickets.isPending &&
        !failure &&
        !tickets.data?.items.length ? (
          <div className="rounded-3xl bg-surface-secondary p-8 text-center">
            <h2 className="font-bold">هنوز درخواستی ثبت نکرده‌اید</h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              برای پیگیری رزرو، پرداخت یا حساب خود، درخواست جدیدی ثبت کنید.
            </p>
          </div>
        ) : null}
        {view === "detail" &&
        tickets.isSuccess &&
        !tickets.data.items.some((ticket) => ticket.id === ticketId) ? (
          <section className="app-card p-6">
            <h2 className="font-bold">این درخواست در دسترس نیست</h2>
            <p className="mt-2 text-sm text-muted">
              درخواست ممکن است حذف شده باشد یا متعلق به حساب دیگری باشد.
            </p>
            <Link href={base} className="mt-4 inline-block font-bold">
              بازگشت به درخواست‌ها
            </Link>
          </section>
        ) : null}
        {view === "list"
          ? tickets.data?.items.map((ticket) => (
              <Link
                key={ticket.id}
                href={`${base}/${ticket.id}`}
                className="app-card block space-y-3 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 break-words font-bold">
                    {ticket.subject}
                  </h2>
                  <span className="shrink-0 text-xs text-muted">
                    {statusLabel[ticket.status]}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm leading-7 text-muted">
                  {ticket.messages.at(-1)?.body}
                </p>
                <span className="text-xs">مشاهده گفت‌وگو</span>
              </Link>
            ))
          : null}
        {view === "detail"
          ? tickets.data?.items
              .filter((ticket) => ticket.id === ticketId)
              .map((ticket) => (
                <Card key={ticket.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold">{ticket.subject}</h2>
                    <span className="text-xs text-muted">
                      {statusLabel[ticket.status]}
                    </span>
                  </div>
                  {ticket.referenceId ? (
                    <p className="text-xs text-muted">
                      سفارش مرتبط:{" "}
                      <span dir="ltr" className="inline-block">
                        {ticket.referenceId}
                      </span>
                    </p>
                  ) : null}
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
                        <span className="mb-1 block text-xs text-muted">
                          {message.authorType === "agent" ? "پشتیبانی" : "شما"}
                        </span>
                        <span className="whitespace-pre-wrap break-words">
                          {message.body}
                        </span>
                      </p>
                    ))}
                  </div>
                  {ticket.status !== "closed" ? (
                    <form
                      className="flex gap-2"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        if (reply.isPending) return;
                        const form = event.currentTarget;
                        const data = new FormData(form);
                        try {
                          await reply.mutateAsync({
                            ticketId: ticket.id,
                            message: String(data.get("message")),
                          });
                          form.reset();
                        } catch {
                          toast.danger(
                            "ارسال پاسخ انجام نشد؛ دوباره تلاش کنید",
                          );
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
              ))
          : null}
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
