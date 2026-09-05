"use client";

import { useState } from "react";
import { Button, Card, Spinner, toast } from "@heroui/react";
import { useBenefitsWallet, useRedeemReferral, useReferralCode } from "@api";

import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";

export function BenefitsScreen() {
  const wallet = useBenefitsWallet();
  const referral = useReferralCode();
  const redeem = useRedeemReferral();
  const [code, setCode] = useState("");

  if (wallet.isPending || referral.isPending) {
    return <main className="app-page grid min-h-dvh place-items-center"><Spinner /></main>;
  }

  return (
    <main className="app-page gap-5">
      <SecondaryHeader title="کیف پول و دعوت دوستان" />
      <Card className="rounded-3xl bg-linear-to-br from-accent/20 to-surface p-6 shadow-none">
        <p className="text-sm text-muted">اعتبار قابل استفاده</p>
        <strong className="mt-2 block text-3xl">{(wallet.data?.availableAmount ?? 0).toLocaleString("fa-IR")} ریال</strong>
        {(wallet.data?.reservedAmount ?? 0) > 0 ? <p className="mt-2 text-xs text-muted">{wallet.data!.reservedAmount.toLocaleString("fa-IR")} ریال در حال استفاده</p> : null}
      </Card>
      <Card className="app-card rounded-3xl p-5 shadow-none">
        <Card.Title>کد دعوت شما</Card.Title>
        <button type="button" className="mt-4 w-full rounded-2xl bg-surface-secondary p-4 text-center font-mono text-xl tracking-widest" onClick={() => void navigator.clipboard?.writeText(referral.data?.code ?? "").then(() => toast.success("کد کپی شد"))}>
          {referral.data?.code ?? "—"}
        </button>
        <p className="mt-3 text-xs leading-6 text-muted">دوست شما پس از اولین خرید موفق پاداش دعوت را دریافت می‌کند.</p>
      </Card>
      <Card className="app-card rounded-3xl p-5 shadow-none">
        <Card.Title>ثبت کد معرف</Card.Title>
        <input dir="ltr" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="REFERRAL CODE" className="mt-4 h-12 w-full rounded-xl border border-border bg-surface-secondary px-4 text-center font-mono uppercase" />
        <Button className="mt-3 w-full" variant="primary" isPending={redeem.isPending} isDisabled={code.length < 6} onPress={() => void redeem.mutateAsync(code).then(() => { setCode(""); toast.success("کد معرف ثبت شد"); }).catch(() => toast.danger("کد معرف معتبر نیست یا قبلاً ثبت شده است"))}>
          ثبت کد
        </Button>
      </Card>
      {wallet.data?.transactions.length ? (
        <Card className="app-card rounded-3xl p-5 shadow-none">
          <Card.Title>گردش اعتبار</Card.Title>
          <div className="mt-4 divide-y divide-border">
            {wallet.data.transactions.map((item) => <div key={item.id} className="flex justify-between gap-3 py-3 text-sm"><span>{item.note || item.source}</span><strong className={item.type === "credit" || item.type === "release" ? "text-success" : "text-danger"}>{item.amount.toLocaleString("fa-IR")} ریال</strong></div>)}
          </div>
        </Card>
      ) : null}
    </main>
  );
}
