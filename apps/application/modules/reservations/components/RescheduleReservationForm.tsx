"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, toast } from "@heroui/react";
import {
  useReservableSessions,
  useRescheduleQuote,
  useRescheduleReservation,
} from "@api";
import { useNow } from "@/lib/use-now";

export function RescheduleReservationForm({
  id,
  clubId,
  sessionId,
  onDone,
}: {
  id: string;
  clubId: string;
  sessionId?: string;
  onDone?: () => void;
}) {
  const sessions = useReservableSessions(clubId);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    root.current?.scrollIntoView({ block: "start" });
  }, []);
  const [target, setTarget] = useState("");
  const [options, setOptions] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const now = useNow();
  const [key] = useState(() => `reschedule-${crypto.randomUUID()}`);
  const router = useRouter();
  const selection = target
    ? {
        sessionId: target,
        options: Object.entries(options)
          .filter(([, quantity]) => quantity > 0)
          .map(([optionId, quantity]) => ({ optionId, quantity })),
      }
    : undefined;
  const quote = useRescheduleQuote(id, selection);
  const change = useRescheduleReservation();
  const selected = sessions.data?.items.find((s) => s.id === target);
  const date = (value: string) =>
    new Intl.DateTimeFormat("fa-IR", {
      timeZone: "Asia/Tehran",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  const money = (value: number) => `${value.toLocaleString("fa-IR")} ریال`;
  const confirm = async (mockResult: "paid" | "failed") => {
    if (!selection || !quote.data || quote.isFetching) return;
    setError("");
    try {
      const next = await change.mutateAsync({
        id,
        ...selection,
        expectedTotalPrice: quote.data.newAmount,
        expectedRefundAmount: quote.data.refundAmount,
        expectedRefundPercent: quote.data.refundPercent,
        idempotencyKey: key,
        mockResult,
      });
      toast.success("زمان رزرو تغییر کرد");
      onDone?.();
      router.push(`/athlete/reservations/${next.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تغییر زمان انجام نشد");
      void quote.refetch();
    }
  };
  return (
    <section
      ref={root}
      className="app-card space-y-4 p-5"
      aria-label="تغییر زمان رزرو"
    >
      <h2 className="font-bold">انتخاب زمان جایگزین</h2>
      <p className="text-sm leading-6 text-muted">
        رزرو قبلی فقط پس از تأیید زمان جدید و پرداخت آزمایشی لغو می‌شود. در صورت
        خطا، رزرو و پرداخت قبلی حفظ می‌شوند.
      </p>
      {sessions.isPending ? (
        <p role="status">دریافت زمان‌ها…</p>
      ) : sessions.isError ? (
        <Button onPress={() => void sessions.refetch()}>
          دریافت دوباره زمان‌ها
        </Button>
      ) : (
        <>
          <label className="grid gap-2 text-sm">
            زمان جدید
            <select
              className="app-field min-h-12 w-full"
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                setOptions({});
                setError("");
              }}
            >
              <option value="">انتخاب کنید</option>
              {sessions.data?.items
                .filter(
                  (s) =>
                    s.id !== sessionId &&
                    s.status === "active" &&
                    now !== null &&
                    new Date(s.startsAt).getTime() > now,
                )
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} · {date(s.startsAt)} ·{" "}
                    {(s.capacity - s.reservedCount).toLocaleString("fa-IR")} جای
                    خالی
                  </option>
                ))}
            </select>
          </label>
          {selected?.options.map((option) => (
            <label key={option.id} className="grid gap-2 text-sm">
              {option.title ?? "خدمت جانبی"} · {money(option.unitPrice)}
              <input
                aria-label={option.title ?? "تعداد خدمت جانبی"}
                type="number"
                min={0}
                max={Math.min(
                  option.maxPerReservation,
                  option.availableQuantity - option.reservedQuantity,
                )}
                value={options[option.id] ?? 0}
                className="app-field min-h-12"
                onChange={(e) =>
                  setOptions((v) => ({
                    ...v,
                    [option.id]: Math.max(0, Number(e.target.value)),
                  }))
                }
              />
            </label>
          ))}
        </>
      )}
      {target &&
        (quote.isFetching ? (
          <p role="status">محاسبه اختلاف قیمت…</p>
        ) : quote.isError ? (
          <div role="alert">
            <p>{quote.error.message}</p>
            <Button variant="secondary" onPress={() => void quote.refetch()}>
              بررسی دوباره
            </Button>
          </div>
        ) : quote.data ? (
          <>
            <dl className="space-y-3 text-sm">
              {[
                ["پرداخت آزمایشی رزرو جدید", quote.data.newAmount],
                ["بازگشت از پرداخت قبلی", quote.data.gatewayRefund],
                ["بازگشت به کیف پول", quote.data.walletRefund],
                ["اختلاف هزینه نهایی", quote.data.difference],
              ].map(([label, amount]) => (
                <div key={String(label)} className="flex justify-between gap-3">
                  <dt>{label}</dt>
                  <dd>{money(Number(amount))}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-muted">
              بازپرداخت طبق قانون رزرو قبلی:{" "}
              {quote.data.refundPercent.toLocaleString("fa-IR")}٪. تخفیف قبلی به
              وجه نقد تبدیل نمی‌شود.{" "}
              {quote.data.restoresEntitlement
                ? "اعتبار عضویت قبلی آزاد و برای زمان جدید مصرف می‌شود."
                : ""}
            </p>
            <Button
              fullWidth
              isPending={change.isPending}
              onPress={() => void confirm("paid")}
            >
              تأیید تغییر زمان و پرداخت آزمایشی
            </Button>
            <Button
              fullWidth
              variant="secondary"
              isDisabled={change.isPending}
              onPress={() => void confirm("failed")}
            >
              شبیه‌سازی پرداخت ناموفق
            </Button>
          </>
        ) : null)}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
