"use client";

import { useRef, useState } from "react";
import { Button, Card, toast } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCoachPackages,
  usePublicCoachOfferings,
  usePurchaseCoachPackage,
  useMockPaymentDecision,
  useCreatePaymentIntent,
  type CoachPackagePurchase,
  type PaymentIntent,
} from "@api";
import { DiscoveryPageHeader } from "@modules/discovery/components/DiscoveryPageHeader";
import { MockPaymentGateway } from "@modules/payments/components/MockPaymentGateway";
import { ButtonLink } from "@/components/button-link";
import { FeatureBadge } from "@/components/ui/feature-cards";
import { useNow } from "@/lib/use-now";

export function CoachPackagesScreen({ coachSlug }: { coachSlug?: string }) {
  const offerings = usePublicCoachOfferings(coachSlug ?? "");
  const owned = useCoachPackages();
  const purchase = usePurchaseCoachPackage();
  const payment = useMockPaymentDecision();
  const createPayment = useCreatePaymentIntent();
  const cache = useQueryClient();
  const keys = useRef(new Map<string, string>());
  const busy = useRef(false);
  const [checkout, setCheckout] = useState<CoachPackagePurchase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = useNow();
  async function buy(offeringId: string) {
    if (busy.current) return;
    busy.current = true;
    try {
      setError(null);
      let key = keys.current.get(offeringId);
      if (!key) {
        key = crypto.randomUUID();
        keys.current.set(offeringId, key);
      }
      const order = await purchase.mutateAsync({
        offeringId,
        idempotencyKey: key,
      });
      keys.current.delete(offeringId);
      if (order.status === "active") toast.success("بسته فعال شد");
      else setCheckout(order);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "خرید انجام نشد؛ دوباره تلاش کنید.",
      );
    } finally {
      busy.current = false;
    }
  }
  async function resolve(result: "approve" | "reject", intent?: PaymentIntent) {
    if (busy.current) return;
    if (!checkout) return;
    if (
      !intent &&
      new Date(checkout.paymentExpiresAt).getTime() <= Date.now()
    ) {
      setCheckout(null);
      return;
    }
    busy.current = true;
    try {
      setError(null);
      const accepted =
        intent ??
        (await createPayment.mutateAsync({
          referenceType: "coach_package_purchase",
          referenceId: checkout.id,
          idempotencyKey: `coach-package-${checkout.id}`,
          returnUrl: window.location.href,
        }));
      const resolved = await payment.mutateAsync({
        intentId: accepted.id,
        status: result === "approve" ? "paid" : "failed",
      });
      if (resolved.status === "paid")
        toast.success("پرداخت آزمایشی موفق بود؛ اعتبار فعال شد");
      else toast.danger("پرداخت ناموفق بود؛ اعتباری اضافه نشد");
      await cache.invalidateQueries({ queryKey: ["athlete", "packages"] });
      setCheckout(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "نتیجه پرداخت ثبت نشد؛ دوباره تلاش کنید.",
      );
    } finally {
      busy.current = false;
    }
  }
  return (
    <main className="app-page space-y-5 px-4 pb-8">
      <DiscoveryPageHeader
        title={coachSlug ? "خرید خدمات مربی" : "بسته‌های مربی من"}
      />
      {error ? (
        <p
          role="alert"
          className="rounded-2xl bg-danger/10 p-4 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}
      {checkout ? (
        <MockPaymentGateway
          key={checkout.id}
          title={checkout.title}
          amount={checkout.priceSnapshot.amount}
          expiresAt={checkout.paymentExpiresAt}
          isPending={payment.isPending || createPayment.isPending}
          reference={{
            referenceType: "coach_package_purchase",
            referenceId: checkout.id,
          }}
          onResult={resolve}
        />
      ) : (
        <>
          {coachSlug ? (
            <section className="space-y-3">
              <h1 className="text-xl font-bold">یک‌بار خرید، رزرو با اعتبار</h1>
              <p className="text-sm leading-7 text-muted">
                اعتبار فقط برای سانس‌های همین خدمت است. ماهانه: ۳۰ روز از
                پرداخت، بدون تمدید خودکار. بسته جلسه‌ای: تا مصرف جلسات، بدون
                انقضای زمانی. لغو مربی یا لغو با بازپرداخت کامل، اعتبار جلسه را
                برمی‌گرداند؛ لغو دیرهنگام اعتبار را مصرف می‌کند.
              </p>
              {offerings.isPending ? (
                <p role="status">در حال دریافت خدمات…</p>
              ) : offerings.isError ? (
                <Button
                  variant="secondary"
                  onPress={() => void offerings.refetch()}
                >
                  تلاش دوباره برای دریافت خدمات
                </Button>
              ) : !offerings.data?.items.some(
                  (item) => item.pricingType !== "per_session",
                ) ? (
                <p className="text-muted">
                  این مربی بسته یا خدمت ماهانه فعالی ندارد.
                </p>
              ) : (
                offerings.data.items
                  .filter((item) => item.pricingType !== "per_session")
                  .map((item) => (
                    <Card
                      key={item.id}
                      className="app-card space-y-3 p-5 shadow-none"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <FeatureBadge>{item.pricingType === "per_month" ? "ماهانه" : "بسته جلسات"}</FeatureBadge>
                          <Card.Title className="mt-2 text-base">{item.title}</Card.Title>
                        </div>
                        <p className="text-sm font-bold tabular-nums">
                          {item.price.amount.toLocaleString("fa-IR")} <span className="text-xs font-normal text-muted">ریال</span>
                        </p>
                      </div>
                      <p className="text-sm leading-7 text-muted">
                        {item.description}
                      </p>
                      <p className="text-sm">
                        {item.pricingType === "per_month"
                          ? "اعتبار ۳۰روزه"
                          : "بسته جلسات"}{" "}
                        ·{" "}
                        {item.sessionCount
                          ? `${item.sessionCount.toLocaleString("fa-IR")} جلسه`
                          : "جلسات نامحدود، با رعایت ظرفیت سانس‌ها"}
                      </p>
                      <Button
                        className="w-full"
                        isPending={purchase.isPending}
                        onPress={() => void buy(item.id)}
                      >
                        ادامه خرید {item.title}
                      </Button>
                    </Card>
                  ))
              )}
            </section>
          ) : null}
          <section className="space-y-3">
            <h2 className="text-lg font-bold">اعتبارهای من</h2>
            {owned.isPending ? (
              <p role="status">در حال دریافت اعتبارها…</p>
            ) : owned.isError ? (
              <Button variant="secondary" onPress={() => void owned.refetch()}>
                تلاش دوباره برای دریافت اعتبارها
              </Button>
            ) : !owned.data?.items.length ? (
              <p className="text-sm text-muted">
                هنوز بسته‌ای نخریده‌اید. از صفحه مربی خدمت دلخواه را انتخاب
                کنید.
              </p>
            ) : (
              owned.data.items.map((item) => {
                const expired = Boolean(
                  now !== null &&
                    item.expiresAt &&
                    new Date(item.expiresAt).getTime() <= now,
                );
                const exhausted = item.remainingSessions === 0;
                const payable =
                  item.status === "pending" &&
                  now !== null &&
                  new Date(item.paymentExpiresAt).getTime() > now;
                return (
                  <Card
                    key={item.id}
                    className="app-card space-y-3 p-5 shadow-none"
                  >
                    <Card.Title>{item.title}</Card.Title>
                    <p className="text-sm">
                      {item.status === "active"
                        ? expired
                          ? "منقضی شده"
                          : exhausted
                            ? "اعتبار مصرف شده"
                            : item.remainingSessions === null
                              ? "فعال · جلسات نامحدود"
                              : `${item.remainingSessions.toLocaleString("fa-IR")} جلسه باقی‌مانده`
                        : item.status === "pending"
                          ? payable
                            ? "در انتظار پرداخت"
                            : "مهلت پرداخت تمام شده"
                          : item.status === "refunded"
                            ? "بازپرداخت شده"
                            : "پرداخت ناموفق"}
                    </p>
                    {item.expiresAt ? (
                      <p className="text-xs text-muted">
                        پایان اعتبار:{" "}
                        {new Date(item.expiresAt).toLocaleDateString("fa-IR")}
                      </p>
                    ) : null}
                    {payable ? (
                      <Button
                        variant="secondary"
                        onPress={() => setCheckout(item)}
                      >
                        ادامه پرداخت
                      </Button>
                    ) : item.status === "active" && !expired && !exhausted ? (
                      <ButtonLink
                        href={`/discovery/coaches/${item.coachId}`}
                        variant="secondary"
                      >
                        انتخاب سانس مربی
                      </ButtonLink>
                    ) : null}
                  </Card>
                );
              })
            )}
          </section>
        </>
      )}
    </main>
  );
}
