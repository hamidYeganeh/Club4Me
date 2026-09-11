"use client";

import { Input as HeroInput } from "@heroui/react";
import { http, tokenStore } from "@api";
import { Button, Card } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import Link from "@/components/app-link";
import { safeReturnPath } from "@/lib/auth-return-path";
import { normalizeNumberInput } from "@/lib/number-input";
import { useNow } from "@/lib/use-now";

type Session = { accessToken: string; refreshToken: string };
type Exchange =
  | { linked: true; session: Session; returnTo: string }
  | {
      linked: false;
      linkToken: string;
      returnTo: string;
      profile: { provider: string; displayName?: string; email?: string };
    };

export default function SocialAuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const ticket = params.get("ticket");
  const request = useRef<{ ticket: string; promise: Promise<Exchange> } | null>(
    null,
  );
  const [exchange, setExchange] = useState<Extract<
    Exchange,
    { linked: false }
  > | null>(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sentAt, setSentAt] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const now = useNow(1000);
  const remaining = Math.max(
    0,
    Math.ceil((sentAt + 60_000 - (now ?? 0)) / 1000),
  );

  useEffect(() => {
    let alive = true;
    if (ticket && request.current?.ticket !== ticket) {
      request.current = {
        ticket,
        promise: http.post<Exchange>("/account/auth/social/exchange", {
          ticket,
        }),
      };
    }
    void (async () => {
      try {
        if (!ticket || !request.current) throw new Error("missing ticket");
        const result = await request.current.promise;
        if (!alive) return;
        if (result.linked) {
          tokenStore.setSession(
            result.session.accessToken,
            result.session.refreshToken,
          );
          router.replace(safeReturnPath(result.returnTo) ?? "/");
        } else {
          setExchange(result);
          setBusy(false);
        }
      } catch {
        if (alive) {
          setError(
            "ورود اجتماعی منقضی یا نامعتبر است؛ از صفحه ورود دوباره شروع کنید.",
          );
          setBusy(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [ticket, router]);

  const sendCode = async () => {
    if (!exchange) return;
    await http.post("/account/auth/social/link/otp", {
      linkToken: exchange.linkToken,
      phone,
    });
    setOtpSent(true);
    setSentAt(Date.now());
    setCode("");
  };
  const resend = async () => {
    if (busy || remaining > 0) return;
    setBusy(true);
    setError("");
    try {
      await sendCode();
    } catch {
      setError("ارسال مجدد انجام نشد؛ کمی بعد دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!exchange || busy) return;
    setBusy(true);
    setError("");
    try {
      if (!otpSent) await sendCode();
      else {
        const result = await http.post<{ session: Session; returnTo: string }>(
          "/account/auth/social/link/confirm",
          { linkToken: exchange.linkToken, phone, code },
        );
        tokenStore.setSession(
          result.session.accessToken,
          result.session.refreshToken,
        );
        router.replace(safeReturnPath(result.returnTo) ?? "/");
      }
    } catch {
      setError("تأیید شماره انجام نشد؛ اطلاعات را بررسی و دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="app-page grid place-items-center">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-xl font-semibold">اتصال امن حساب</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          فقط بار اول شماره موبایل را تأیید کنید تا فعالیت‌هایتان در یک حساب
          باقی بماند.
        </p>
        {busy && !exchange ? (
          <p role="status" className="mt-6">
            در حال تکمیل ورود…
          </p>
        ) : null}
        {exchange ? (
          <form className="mt-6 grid gap-4" onSubmit={submit}>
            <label className="grid gap-2 text-sm">
              شماره موبایل
              <HeroInput
                dir="ltr"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(normalizeNumberInput(event.target.value))
                }
                placeholder="09123456789"
                required
                className="min-h-12 rounded-xl border border-border bg-surface px-3"
                disabled={otpSent || busy}
              />
            </label>
            {otpSent ? (
              <>
                <label className="grid gap-2 text-sm">
                  کد تأیید
                  <HeroInput
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(event) =>
                      setCode(normalizeNumberInput(event.target.value))
                    }
                    required
                    className="min-h-12 rounded-xl border border-border bg-surface px-3"
                    disabled={busy}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    isDisabled={busy || remaining > 0}
                    onPress={() => void resend()}
                  >
                    {remaining > 0
                      ? `ارسال مجدد تا ${remaining.toLocaleString("fa-IR")} ثانیه`
                      : "ارسال مجدد کد"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    isDisabled={busy}
                    onPress={() => {
                      setOtpSent(false);
                      setCode("");
                      setError("");
                    }}
                  >
                    اصلاح شماره
                  </Button>
                </div>
              </>
            ) : null}
            <Button type="submit" variant="primary" isPending={busy}>
              {otpSent ? "تأیید و ورود" : "ارسال کد"}
            </Button>
          </form>
        ) : null}
        {error ? (
          <p role="alert" className="mt-4 text-sm leading-6 text-danger">
            {error}
          </p>
        ) : null}
        <Link
          href="/auth"
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-accent"
        >
          بازگشت به ورود
        </Link>
      </Card>
    </main>
  );
}
