"use client";

import { useState } from "react";
import { Button, Card, Skeleton, toast } from "@heroui/react";
import { useBenefitsWallet, useRedeemReferral, useReferralCode } from "@api";

import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { RequestFailureState } from "@/components/request-failure-state";
import { getQueryFailure } from "@/lib/request-failure";
import { usePathname } from "next/navigation";

export function BenefitsScreen() {
  const wallet = useBenefitsWallet();
  const referral = useReferralCode();
  const redeem = useRedeemReferral();
  const [code, setCode] = useState("");
  const pathname = usePathname();
  const role = pathname.startsWith("/coach") ? "coach" : "athlete";
  const failure =
    getQueryFailure(wallet.error, wallet.fetchStatus) ??
    getQueryFailure(referral.error, referral.fetchStatus);

  if (failure || wallet.isPending || referral.isPending) {
    return (
      <main className="app-page gap-5">
        <SecondaryHeader
          title="کیف پول و دعوت دوستان"
          showFilter={false}
          backHref={`/${role}/settings`}
        />
        {failure ? (
          <RequestFailureState
            error={failure}
            onRetry={() => {
              void wallet.refetch();
              void referral.refetch();
            }}
          />
        ) : (
          <div className="space-y-5" aria-label="در حال بارگذاری کیف پول">
            <Skeleton className="h-36 rounded-3xl" />
            <Skeleton className="h-48 rounded-3xl" />
            <Skeleton className="h-48 rounded-3xl" />
          </div>
        )}
      </main>
    );
  }

  const copyCode = async () => {
    if (!referral.data?.code) return;
    try {
      await navigator.clipboard.writeText(referral.data.code);
      toast.success("کد کپی شد");
    } catch {
      toast.danger("کپی انجام نشد؛ کد دعوت را دستی وارد کنید");
    }
  };

  return (
    <main className="app-page gap-5">
      <SecondaryHeader
        title="کیف پول و دعوت دوستان"
        showFilter={false}
        backHref={`/${role}/settings`}
      />
      <Card className="rounded-3xl bg-linear-to-br from-accent/20 to-surface p-6 shadow-none">
        <p className="text-sm text-muted">اعتبار قابل استفاده</p>
        <strong className="mt-2 block text-3xl">
          {(wallet.data?.availableAmount ?? 0).toLocaleString("fa-IR")} ریال
        </strong>
        {(wallet.data?.reservedAmount ?? 0) > 0 ? (
          <p className="mt-2 text-xs text-muted">
            {wallet.data!.reservedAmount.toLocaleString("fa-IR")} ریال در حال
            استفاده
          </p>
        ) : null}
      </Card>
      <Card className="app-card rounded-3xl p-5 shadow-none">
        <Card.Title>کد دعوت شما</Card.Title>
        <button
          type="button"
          aria-label="کپی کد دعوت"
          disabled={!referral.data?.code}
          className="mt-4 w-full rounded-2xl bg-surface-secondary p-4 text-center font-mono text-xl tracking-widest"
          onClick={() => void copyCode()}
        >
          {referral.data?.code ?? "—"}
        </button>
        <p className="mt-3 text-xs leading-6 text-muted">
          دوست شما پس از اولین خرید موفق پاداش دعوت را دریافت می‌کند.
        </p>
      </Card>
      <Card className="app-card rounded-3xl p-5 shadow-none">
        <Card.Title>ثبت کد معرف</Card.Title>
        <input
          dir="ltr"
          aria-label="کد معرف"
          value={code}
          onChange={(event) => setCode(event.target.value.trim().toUpperCase())}
          placeholder="کد معرف"
          className="app-field mt-4 w-full text-center font-mono uppercase"
        />
        <Button
          className="mt-3 w-full"
          variant="primary"
          isPending={redeem.isPending}
          isDisabled={code.length < 6}
          onPress={() =>
            void redeem
              .mutateAsync(code)
              .then(() => {
                setCode("");
                toast.success("کد معرف ثبت شد");
              })
              .catch(() =>
                toast.danger("کد معرف معتبر نیست یا قبلاً ثبت شده است"),
              )
          }
        >
          ثبت کد
        </Button>
      </Card>
      {wallet.data?.transactions.length ? (
        <Card className="app-card rounded-3xl p-5 shadow-none">
          <Card.Title>گردش اعتبار</Card.Title>
          <div className="mt-4 divide-y divide-border">
            {wallet.data.transactions.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-3 py-3 text-sm"
              >
                <span>{item.note || item.source}</span>
                <strong
                  className={
                    item.type === "credit" || item.type === "release"
                      ? "text-success"
                      : "text-danger"
                  }
                >
                  {item.amount.toLocaleString("fa-IR")} ریال
                </strong>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </main>
  );
}
