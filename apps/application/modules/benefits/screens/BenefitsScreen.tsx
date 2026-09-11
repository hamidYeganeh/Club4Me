"use client";

import { Icon } from "@theme/icon";
import { VisualEmptyState, clarityStyles } from "@/components/ui/clarity";
import styles from "./benefits.module.css";
import { Input as HeroInput } from "@heroui/react";
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
      <section className={styles.balance} aria-label="موجودی کیف پول">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted">اعتبار قابل استفاده</p>
          <span
            className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent"
            aria-hidden="true"
          >
            <Icon name="wallet" size={22} />
          </span>
        </div>
        <div className={styles.amount}>
          <strong>
            {(wallet.data?.availableAmount ?? 0).toLocaleString("fa-IR")}
          </strong>
          <span>ریال</span>
        </div>
        <p className="text-xs leading-6 text-muted">
          برای استفاده در خریدهای واجد شرایط
        </p>
        <div className={styles.reserved}>
          <span>اعتبار در حال استفاده</span>
          <span className="font-semibold text-foreground tabular-nums">
            {(wallet.data?.reservedAmount ?? 0).toLocaleString("fa-IR")} ریال
          </span>
        </div>
      </section>
      <Card className={`${clarityStyles.surface} p-5`}>
        <Card.Title>کد دعوت شما</Card.Title>
        <button
          type="button"
          aria-label="کپی کد دعوت"
          disabled={!referral.data?.code}
          className={styles.code}
          onClick={() => void copyCode()}
        >
          <span dir="ltr" className="font-mono text-lg tracking-wider">
            {referral.data?.code ?? "—"}
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-accent">
            <Icon name="copy-1" size={18} />
            کپی کد
          </span>
        </button>
        <p className="mt-3 text-xs leading-6 text-muted">
          دوست شما پس از اولین خرید موفق پاداش دعوت را دریافت می‌کند.
        </p>
      </Card>
      <Card className={`${clarityStyles.surface} p-5`}>
        <Card.Title>ثبت کد معرف</Card.Title>
        <HeroInput
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
        <Card className={`${clarityStyles.surface} p-5`}>
          <Card.Title>گردش اعتبار</Card.Title>
          <div className="mt-4 divide-y divide-border">
            {wallet.data.transactions.map((item) => (
              <div
                key={item.id}
                className={styles.transaction}
                data-incoming={
                  item.type === "credit" || item.type === "release"
                }
              >
                <span className={styles.transactionIcon} aria-hidden="true">
                  <Icon
                    name={
                      item.type === "credit" || item.type === "release"
                        ? "plus-fat"
                        : "minus"
                    }
                    size={18}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-6">
                    {item.note || item.source}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(item.createdAt).toLocaleDateString("fa-IR", {
                      month: "short",
                      day: "numeric",
                      timeZone: "Asia/Tehran",
                    })}
                  </p>
                </div>
                <strong
                  className={
                    item.type === "credit" || item.type === "release"
                      ? "text-success"
                      : "text-danger"
                  }
                >
                  <span
                    dir="ltr"
                    className="whitespace-nowrap text-sm tabular-nums"
                  >
                    {item.type === "credit" || item.type === "release"
                      ? "+"
                      : "−"}
                    {item.amount.toLocaleString("fa-IR")}
                  </span>
                  <span className="mt-1 block text-end text-xs font-normal text-muted">
                    ریال
                  </span>
                </strong>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <VisualEmptyState
          icon="wallet"
          title="گردش اعتبارت از اینجا شروع می‌شود"
          description="بعد از دریافت یا استفاده از اعتبار، جزئیات هر تراکنش را اینجا می‌بینی."
          action={
            <Button
              variant="secondary"
              isDisabled={!referral.data?.code}
              onPress={() => void copyCode()}
            >
              کپی کد دعوت دوستان
            </Button>
          }
        />
      )}
    </main>
  );
}
