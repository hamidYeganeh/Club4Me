"use client";

import { useEffect, useState } from "react";
import { Button, Card, Typography } from "@heroui/react";
import {
  useCreatePaymentIntent,
  usePaymentQuote,
  type PaymentQuoteInput,
  type PaymentIntent,
} from "@api";

export function MockPaymentGateway({
  title,
  amount,
  isPending,
  expiresAt,
  reference,
  intent,
  onResult,
}: {
  title: string;
  amount: number;
  isPending: boolean;
  expiresAt?: string | null;
  reference?: Pick<PaymentQuoteInput, "referenceType" | "referenceId">;
  intent?: PaymentIntent;
  onResult: (result: "approve" | "reject", intent?: PaymentIntent) => void;
}) {
  const [coupon, setCoupon] = useState("");
  const [wallet, setWallet] = useState("");
  const [applied, setApplied] = useState<{
    couponCode?: string;
    walletAmount: number;
  }>({ walletAmount: 0 });
  const quote = usePaymentQuote(
    reference ? { ...reference, ...applied } : undefined,
  );
  const create = useCreatePaymentIntent();
  const [error, setError] = useState<string | null>(null);
  const [key] = useState(() => `checkout-${crypto.randomUUID()}`);
  const summary = intent ?? quote.data;
  const deadline = summary?.expiresAt ?? expiresAt;
  const busy = isPending || create.isPending;
  const decide = async (result: "approve" | "reject") => {
    let created = intent;
    if (result === "approve" && reference) {
      if (!quote.data || quote.isFetching || quote.isError) return;
      try {
        setError(null);
        created = await create.mutateAsync({
          ...reference,
          ...applied,
          idempotencyKey: key,
          expectedAmount: quote.data.amount,
          returnUrl: window.location.href,
        });
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "شروع پرداخت انجام نشد. دوباره تلاش کنید.",
        );
        void quote.refetch();
        return;
      }
    }
    onResult(result, created);
  };
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  const remaining = deadline
    ? Math.max(0, Math.ceil((new Date(deadline).getTime() - now) / 1000))
    : null;
  return (
    <div className="fixed inset-y-0 inset-x-0 z-[100] mx-auto flex w-full max-w-xl items-center justify-center bg-background/80 p-5 backdrop-blur-lg">
      <Card className="app-card w-full max-w-md p-5 shadow-none">
        <span className="w-fit rounded-full bg-warning/15 px-3 py-1 text-xs font-bold text-warning">
          درگاه پرداخت آزمایشی
        </span>
        <Typography type="h4" weight="bold" className="mt-4">
          {title}
        </Typography>
        <p className="mt-2 text-sm text-muted">
          این درگاه واقعی نیست. نتیجه پرداخت را برای تست انتخاب کنید.
        </p>
        <div className="mt-5 rounded-2xl bg-surface-secondary p-4 text-center">
          <p className="text-xs text-muted">مبلغ قابل پرداخت</p>
          <p className="mt-1 text-2xl font-black text-accent">
            {(summary?.amount ?? amount).toLocaleString("fa-IR")} ریال
          </p>
          {summary ? (
            <dl className="mt-3 space-y-1 text-xs text-muted">
              <div className="flex justify-between">
                <dt>مبلغ سفارش</dt>
                <dd>{summary.grossAmount.toLocaleString("fa-IR")} ریال</dd>
              </div>
              <div className="flex justify-between">
                <dt>تخفیف</dt>
                <dd>{summary.discountAmount.toLocaleString("fa-IR")} ریال</dd>
              </div>
              <div className="flex justify-between">
                <dt>سهم کیف پول</dt>
                <dd>{summary.walletAmount.toLocaleString("fa-IR")} ریال</dd>
              </div>
            </dl>
          ) : null}
        </div>
        {reference && !quote.data?.intentId ? (
          <form
            className="mt-4 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              const value = Number(
                wallet
                  .replace(/[۰-۹٠-٩]/g, (digit) =>
                    String(digit.charCodeAt(0) - (digit >= "۰" ? 1776 : 1632)),
                  )
                  .replace(/[٬,\s]/g, ""),
              );
              if (!Number.isSafeInteger(value) || value < 0) {
                setError("سهم کیف پول را به ریال و با عدد صحیح وارد کنید.");
                return;
              }
              setError(null);
              setApplied({
                couponCode: coupon.trim() || undefined,
                walletAmount: value,
              });
            }}
          >
            <label className="block text-xs">
              کد تخفیف
              <input
                aria-label="کد تخفیف"
                className="mt-1 w-full rounded-xl border border-border bg-background p-2"
                value={coupon}
                onChange={(event) => setCoupon(event.target.value)}
                disabled={busy}
              />
            </label>
            <label className="block text-xs">
              سهم کیف پول (ریال)
              <input
                aria-label="سهم کیف پول (ریال)"
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-border bg-background p-2"
                value={wallet}
                onChange={(event) => setWallet(event.target.value)}
                disabled={busy}
              />
            </label>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isDisabled={busy || quote.isFetching}
            >
              بررسی مبلغ
            </Button>
          </form>
        ) : null}
        {reference && quote.isFetching ? (
          <p role="status" className="mt-3 text-xs">
            در حال دریافت مبلغ نهایی…
          </p>
        ) : null}
        {error || quote.isError ? (
          <div role="alert" className="mt-3 text-sm text-danger">
            {error ?? "قیمت‌گیری انجام نشد. دوباره تلاش کنید."}
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => void quote.refetch()}
            >
              تلاش دوباره
            </Button>
          </div>
        ) : null}
        {remaining !== null ? (
          <p
            className="mt-4 text-center text-sm"
            role={remaining === 0 ? "alert" : undefined}
          >
            {remaining === 0
              ? "مهلت پرداخت تمام شده است. برای انتخاب زمان، پرداخت را ببندید."
              : `مهلت پرداخت: ${Math.floor(remaining / 60).toLocaleString("fa-IR")}:${String(remaining % 60).padStart(2, "0")}`}
          </p>
        ) : null}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button
            variant="primary"
            isPending={busy}
            isDisabled={
              remaining === 0 ||
              Boolean(
                reference && (!quote.data || quote.isFetching || quote.isError),
              )
            }
            onPress={() => void decide("approve")}
          >
            پرداخت موفق
          </Button>
          <Button
            variant="danger"
            isDisabled={busy}
            onPress={() => void decide("reject")}
          >
            {remaining === 0 ? "بستن پرداخت" : "پرداخت ناموفق"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
