"use client";

import { FormSelect, FormOption } from "@repo/ui/form-select";
import { ClubEmptyState } from "@modules/discovery/components/ClubEmptyState";

import {
  usePublicBenefitProducts,
  useCreateBenefitPurchase,
  useCreatePaymentIntent,
  useMockPaymentDecision,
  type PaymentIntent,
} from "@api";
import { useState } from "react";
import Link from "@/components/app-link";
import { MockPaymentGateway } from "@modules/payments/components/MockPaymentGateway";
import { Button, Card, Chip, Skeleton, toast } from "@heroui/react";
import { CompactCardListSkeleton } from "@/components/loading-skeletons";

export function ClubBenefitProductsSection({
  clubId,
  renewedFromId,
}: {
  clubId: string;
  renewedFromId?: string;
}) {
  const [startMode, setStartMode] = useState<"immediate" | "after_expiry">(
    "after_expiry",
  );
  const products = usePublicBenefitProducts(clubId);
  const purchase = useCreateBenefitPurchase();
  const createPayment = useCreatePaymentIntent();
  const payment = useMockPaymentDecision();
  const [checkout, setCheckout] = useState<{
    title: string;
    id: string;
    amount: number;
  } | null>(null);
  const [completed, setCompleted] = useState(false);
  async function resolve(
    result: "approve" | "reject",
    accepted?: PaymentIntent,
  ) {
    if (!checkout || payment.isPending) return;
    try {
      const intent =
        accepted ??
        (await createPayment.mutateAsync({
          referenceType: "benefit_purchase",
          referenceId: checkout.id,
          idempotencyKey: `benefit-purchase-${checkout.id}`,
          returnUrl: window.location.href,
        }));
      const resolved = await payment.mutateAsync({
        intentId: intent.id,
        status: result === "approve" ? "paid" : "failed",
      });
      if (resolved.status === "paid") {
        setCompleted(true);
        toast.success("پرداخت آزمایشی موفق بود و عضویت فعال شد");
      } else toast.danger("پرداخت ناموفق بود؛ عضویت فعال نشد");
      setCheckout(null);
    } catch {
      toast.danger("ثبت نتیجه پرداخت انجام نشد؛ دوباره تلاش کنید");
    }
  }
  if (products.isPending)
    return (
      <section className="space-y-4 px-4 py-5" aria-label="بسته‌ها و عضویت‌ها">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <Skeleton className="h-3 w-56 max-w-full rounded-lg" />
        </div>
        <CompactCardListSkeleton count={2} />
      </section>
    );

  return (
    <section className="px-4 py-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold">بسته‌ها و عضویت‌ها</h2>
        <p className="mt-1 text-xs text-muted">
          یک‌بار بخرید و هنگام رزرو استفاده کنید
        </p>
      </div>
      {products.isError ? (
        <div className="app-surface rounded-3xl p-5 text-center text-sm text-muted">
          دریافت بسته‌ها و عضویت‌ها انجام نشد.
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onPress={() => void products.refetch()}
          >
            تلاش دوباره
          </Button>
        </div>
      ) : !products.data?.items.length ? (
        <ClubEmptyState
          title="هنوز بسته یا عضویتی ارائه نشده است"
          description="بسته‌های جلسه و عضویت‌های این باشگاه پس از انتشار اینجا نمایش داده می‌شوند."
        />
      ) : null}
      {renewedFromId && (
        <label className="mb-4 grid gap-2 text-sm">
          شروع قرارداد جدید
          <FormSelect
            aria-label="شروع قرارداد جدید"
            className="min-h-11 rounded-xl border border-border bg-surface px-3"
            value={startMode}
            onChange={(event) => setStartMode(event as typeof startMode)}
          >
            <FormOption value="after_expiry">
              پس از پایان اعتبار قبلی و تمدیدهای ثبت‌شده
            </FormOption>
            <FormOption value="immediate">
              از امروز (اعتبار قبلی جدا باقی می‌ماند)
            </FormOption>
          </FormSelect>
          <span className="text-muted">
            تاریخ شروع هنگام پرداخت ثبت می‌شود. شرایط و قیمت قرارداد جدید مطابق
            محصول انتخابی است.
          </span>
        </label>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {(products.data?.items ?? []).map((item) => (
          <Card key={item.id} className="app-card rounded-3xl p-5 shadow-none">
            <Chip size="sm" variant="soft">
              {item.type === "session_pack" ? "بسته جلسه" : "عضویت زمانی"}
            </Chip>

            {!!item.accessClubs?.length && (
              <div className="rounded-xl bg-surface-secondary p-3 text-xs leading-6">
                <p className="font-semibold">
                  اعتبار مشترک در{" "}
                  {item.accessClubs.length.toLocaleString("fa-IR")} باشگاه
                </p>
                <p>تعداد جلسات و سقف هفتگی بین همه باشگاه‌های زیر مشترک است.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.accessClubs.map((club) => (
                    <Link
                      key={club.id}
                      className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 text-accent"
                      href={`/discovery/clubs/${club.id}/slots`}
                    >
                      {club.name} ←
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <h3 className="mt-3 font-bold">{item.title}</h3>
            <p className="mt-2 text-xs leading-6 text-muted">
              {item.description}
            </p>
            <p className="mt-1 text-xs leading-6 text-muted">
              {item.type === "session_pack"
                ? `${item.sessionCount} جلسه با ${item.validityDays} روز اعتبار`
                : `هفته‌ای ${item.weeklyLimit} مرتبه تا ${item.validityDays} روز`}
            </p>
            {item.type === "time_membership" && (
              <p className="mt-1 text-xs text-muted">
                {item.weekCalendar === "iran_saturday"
                  ? "هفته از شنبه تا جمعه، ساعت تهران"
                  : "هفته از دوشنبه تا یکشنبه، UTC (قرارداد قبلی)"}
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              {item.maxPauseDays
                ? `تا ${item.maxPauseDays.toLocaleString("fa-IR")} روز توقف طبق قرارداد`
                : "این قرارداد امکان توقف ندارد"}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <strong>{item.price.toLocaleString("fa-IR")} ریال</strong>
              <Button
                size="sm"
                variant="primary"
                isPending={purchase.isPending}
                isDisabled={Boolean(checkout)}
                onPress={async () => {
                  try {
                    const purchaseResult = await purchase.mutateAsync(
                      renewedFromId
                        ? { productId: item.id, renewedFromId, startMode }
                        : item.id,
                    );
                    setCheckout({
                      title: item.title,
                      id: purchaseResult.id,
                      amount: purchaseResult.amount ?? item.price,
                    });
                  } catch {
                    toast.danger("خرید انجام نشد");
                  }
                }}
              >
                {renewedFromId ? "خرید تمدید" : "خرید"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {completed ? (
        <Link
          href="/athlete/memberships"
          className="mt-4 inline-flex min-h-11 items-center text-accent"
        >
          مشاهده عضویت خریداری‌شده
        </Link>
      ) : null}
      {checkout ? (
        <MockPaymentGateway
          title={checkout.title}
          reference={{
            referenceType: "benefit_purchase",
            referenceId: checkout.id,
          }}
          amount={checkout.amount}
          isPending={payment.isPending || createPayment.isPending}
          onResult={(result, intent) => void resolve(result, intent)}
        />
      ) : null}
    </section>
  );
}
