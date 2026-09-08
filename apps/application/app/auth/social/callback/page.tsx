"use client";

import { http, tokenStore } from "@api";
import { Button, Card } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type Session = { accessToken: string; refreshToken: string };
type Exchange = { linked: true; session: Session; returnTo: string } | { linked: false; linkToken: string; returnTo: string; profile: { provider: string; displayName?: string; email?: string } };

export default function SocialAuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [exchange, setExchange] = useState<Extract<Exchange, { linked: false }> | null>(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const ticket = params.get("ticket");
    if (!ticket) { setError("بلیط ورود در نشانی وجود ندارد."); setBusy(false); return; }
    void http.post<Exchange>("/account/auth/social/exchange", { ticket }).then((result) => {
      if (result.linked) {
        tokenStore.setSession(result.session.accessToken, result.session.refreshToken);
        router.replace(result.returnTo || "/");
      } else { setExchange(result); setBusy(false); }
    }).catch(() => { setError("ورود اجتماعی منقضی یا نامعتبر است؛ دوباره تلاش کنید."); setBusy(false); });
  }, [params, router]);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!exchange) return; setBusy(true); setError("");
    try {
      if (!otpSent) { await http.post("/account/auth/social/link/otp", { linkToken: exchange.linkToken, phone }); setOtpSent(true); }
      else {
        const result = await http.post<{ session: Session; returnTo: string }>("/account/auth/social/link/confirm", { linkToken: exchange.linkToken, phone, code });
        tokenStore.setSession(result.session.accessToken, result.session.refreshToken); router.replace(result.returnTo || "/");
      }
    } catch { setError("تأیید شماره انجام نشد؛ اطلاعات را بررسی و دوباره تلاش کنید."); } finally { setBusy(false); }
  };

  return <main className="app-page grid place-items-center"><Card className="w-full max-w-md p-6"><h1 className="text-xl font-semibold">اتصال امن حساب</h1><p className="mt-2 text-sm leading-6 text-muted">برای جلوگیری از ساخت حساب تکراری، فقط بار اول شماره موبایل و کد یک‌بارمصرف را تأیید کنید.</p>{busy && !exchange ? <p className="mt-6">در حال تکمیل ورود…</p> : null}{exchange ? <form className="mt-6 grid gap-3" onSubmit={submit}><input dir="ltr" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09xxxxxxxxx" required className="min-h-12 rounded-xl border border-border bg-surface px-3" disabled={otpSent} />{otpSent ? <input dir="ltr" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} placeholder="کد تأیید" required className="min-h-12 rounded-xl border border-border bg-surface px-3" /> : null}<Button type="submit" variant="primary" isPending={busy}>{otpSent ? "تأیید و ورود" : "ارسال کد"}</Button></form> : null}{error ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p> : null}</Card></main>;
}
