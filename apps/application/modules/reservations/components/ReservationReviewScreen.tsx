"use client";
import type { ReservationPaymentMethod } from "@api";
import { ClubCard } from "@ui/club-card";

import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import type { ReactNode } from "react";
import { Button, Card } from "@heroui/react";
import { Icon } from "@theme/icon";

import { FallbackImage } from "@/components/FallbackImage";

type CancellationTier = { hoursBefore: number; refundPercent: number };

export type ReservationReviewEntity = {
  kind: "coach" | "club";
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  rating?: number;
  reviewsCount?: number;
};

export type ReservationReviewSession = {
  title: string;
  startsAt: string;
  endsAt: string;
  deliveryMode: "club" | "online" | "home" | "outdoor";
  address?: string | null;
  participantCount: number;
  amount: number;
  pricingUnit?: "per_participant" | "per_session" | "per_court";
  currency: string;
  includedTaxAmount?: number;
  paymentLabel?: string;
  coveredAmount?: number;
  cancellationPolicy?: {
    title?: string;
    tiers?: CancellationTier[];
  } | null;
};

export function ReservationReviewScreen({
  entity,
  session,
  isPending,
  onBack,
  onConfirm,
  paymentMethod = "online",
  onPaymentMethodChange,
  availablePaymentMethods = ["online"],
}: {
  entity: ReservationReviewEntity;
  session: ReservationReviewSession;
  isPending: boolean;
  onBack: () => void;
  onConfirm: () => void;
  paymentMethod?: ReservationPaymentMethod;
  onPaymentMethodChange?: (method: ReservationPaymentMethod) => void;
  availablePaymentMethods?: ReservationPaymentMethod[];
}) {
  const coveredAmount = Math.min(
    session.amount,
    Math.max(0, session.coveredAmount ?? 0),
  );
  const payable = Math.max(0, session.amount - coveredAmount);
  const date = new Date(session.startsAt);
  const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <main className="min-h-dvh shrink-0 bg-background pb-[calc(12rem+env(safe-area-inset-bottom))] text-foreground">
      <div className="mx-auto w-full max-w-xl px-5">
        <SecondaryHeader
          title="مرور رزرو"
          showFilter={false}
          onBack={onBack}
          backLabel="بازگشت به انتخاب سانس"
        />

        <p className="mb-5 text-sm leading-6 text-muted">
          جزئیات رزرو را بررسی کنید و برای تأیید ادامه دهید.
        </p>
        <ol className="mb-8 grid grid-cols-3" aria-label="مراحل رزرو">
          {["انتخاب", "زمان", "تأیید و پرداخت"].map((label, index) => (
            <li
              key={label}
              aria-current={index === 2 ? "step" : undefined}
              className="relative flex flex-col items-center gap-2"
            >
              {index > 0 ? (
                <span className="absolute end-1/2 top-3 h-0.5 w-full bg-accent" />
              ) : null}
              <span className="relative z-10 grid size-6 place-items-center rounded-full bg-accent text-accent-foreground">
                {index === 2 ? (
                  <span className="text-xs font-black">۳</span>
                ) : (
                  <Icon name="check" size={14} />
                )}
              </span>
              <span className="text-[0.7rem] font-bold text-foreground">
                {label}
              </span>
            </li>
          ))}
        </ol>

        {entity.kind === "club" ? (
          <ClubCard
            title={entity.title}
            imageUrl={entity.imageUrl ?? undefined}
            rating={entity.rating}
            reviewsCount={entity.reviewsCount}
            className="!w-full !aspect-[16/8]"
          />
        ) : (
          <Card className="rounded-[var(--app-radius-feature,24px)] bg-surface shadow-none">
            <Card.Content className="!flex !flex-row items-center gap-4 p-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-surface-secondary">
                <FallbackImage
                  src={entity.imageUrl}
                  alt={entity.title}
                  fill
                  unoptimized
                  sizes="80px"
                  className="object-cover"
                />
                <span className="absolute bottom-1 end-1 grid size-6 place-items-center rounded-full bg-success text-success-foreground">
                  <Icon name="check" size={12} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black">{entity.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">
                  {entity.subtitle}
                </p>
                {entity.rating !== undefined ? (
                  <p className="mt-2 flex items-center gap-1 text-xs font-bold">
                    <Icon name="star-full" size={16} className="text-warning" />
                    {entity.rating.toLocaleString("fa-IR")}
                    {entity.reviewsCount !== undefined ? (
                      <span className="font-normal text-muted">
                        ({entity.reviewsCount.toLocaleString("fa-IR")} نظر)
                      </span>
                    ) : null}
                  </p>
                ) : null}
              </div>
            </Card.Content>
          </Card>
        )}

        <ReviewSection
          icon="calendar-check"
          title="جزئیات سانس"
          action={
            <Button
              size="sm"
              variant="ghost"
              onPress={onBack}
              isDisabled={isPending}
            >
              ویرایش سانس
            </Button>
          }
        >
          <Card className="rounded-[var(--app-radius-feature,24px)] bg-surface shadow-none">
            <Card.Content className="grid gap-4 p-5">
              <SummaryRow label="سانس" value={session.title} />
              <SummaryRow
                label="تاریخ"
                value={date.toLocaleDateString("fa-IR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              />
              <SummaryRow
                label="ساعت"
                value={`${timeFormatter.format(new Date(session.startsAt))} تا ${timeFormatter.format(new Date(session.endsAt))}`}
              />
              <SummaryRow
                label="شیوه برگزاری"
                value={deliveryModeLabel(session.deliveryMode)}
              />
              {session.address ? (
                <SummaryRow label="نشانی" value={session.address} />
              ) : null}
              <SummaryRow
                label="تعداد نفرات"
                value={session.participantCount.toLocaleString("fa-IR")}
              />
            </Card.Content>
          </Card>
        </ReviewSection>

        <ReviewSection icon="credit-card" title="روش پرداخت">
          {payable > 0 && onPaymentMethodChange ? (
            <fieldset className="grid gap-2.5" disabled={isPending}>
              <legend className="sr-only">روش پرداخت</legend>
              {availablePaymentMethods.map((method) => {
                const option = PAYMENT_OPTIONS[method];
                return (
                  <label
                    key={method}
                    className={`flex min-h-20 cursor-pointer items-center gap-3 rounded-2xl p-4 transition-colors has-[:focus-visible]:[&_strong]:underline has-[:focus-visible]:[&_strong]:underline-offset-4 ${isPending ? "cursor-wait opacity-60" : ""} ${paymentMethod === method ? "bg-accent/15" : "bg-surface"}`}
                  >
                    <span className="relative size-6 shrink-0">
                      <input
                        type="radio"
                        name="reservation-payment"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={() => onPaymentMethodChange(method)}
                        className="peer absolute inset-0 size-full cursor-inherit opacity-0"
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none grid size-full place-items-center rounded-full bg-surface-secondary text-accent-foreground peer-checked:bg-accent"
                      >
                        {paymentMethod === method ? (
                          <Icon name="check" size={16} />
                        ) : null}
                      </span>
                    </span>
                    <Icon
                      name={option.icon}
                      size={24}
                      className="shrink-0 text-accent"
                    />
                    <span className="min-w-0 flex-1">
                      <strong className="block leading-6">
                        {option.title}
                      </strong>
                      <span className="mt-1 block text-xs leading-6 text-muted">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
          ) : (
            <Card className="rounded-2xl bg-surface p-4">
              <strong>
                {session.paymentLabel ??
                  (payable ? "درگاه پرداخت آنلاین" : "بدون نیاز به پرداخت")}
              </strong>
            </Card>
          )}
        </ReviewSection>

        <ReviewSection icon="bill" title="خلاصه پرداخت">
          <Card className="rounded-[var(--app-radius-feature,24px)] bg-surface shadow-none">
            <Card.Content className="p-0">
              <PriceRow
                label={
                  session.pricingUnit === "per_court"
                    ? `کل زمین · ${session.title}`
                    : session.pricingUnit === "per_session"
                      ? `کل سانس · ${session.title}`
                      : `${session.participantCount.toLocaleString("fa-IR")} نفر · ${session.title}`
                }
                value={formatMoney(session.amount, session.currency)}
              />
              {coveredAmount > 0 ? (
                <PriceRow
                  label="اعتبار بسته یا عضویت"
                  value={`−${formatMoney(coveredAmount, session.currency)}`}
                  accent
                />
              ) : null}
              {(session.includedTaxAmount ?? 0) > 0 ? (
                <PriceRow
                  label="مالیات لحاظ‌شده در مبلغ"
                  value={formatMoney(
                    session.includedTaxAmount!,
                    session.currency,
                  )}
                />
              ) : null}
              <PriceRow
                label="مبلغ قابل پرداخت"
                value={formatMoney(payable, session.currency)}
                strong
              />
            </Card.Content>
          </Card>
        </ReviewSection>

        <section
          aria-labelledby="cancellation-title"
          className="mt-6 flex items-start gap-3 rounded-2xl bg-surface-secondary/65 p-4 text-sm leading-7 text-muted"
        >
          <Icon
            name="shield-exclamation-mark"
            size={22}
            className="mt-0.5 shrink-0 text-accent"
          />
          <div>
            <h2
              id="cancellation-title"
              className="mb-1 font-bold text-foreground"
            >
              شرایط لغو و بازپرداخت
            </h2>
            <p>{cancellationCopy(session.cancellationPolicy)}</p>
          </div>
        </section>
      </div>
      <div
        role="region"
        aria-label="تأیید رزرو"
        className="app-bottom-fade fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-xl px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4"
      >
        <div className="rounded-[var(--app-radius-card)] bg-background p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm text-muted">
              {payable > 0 && paymentMethod !== "online"
                ? "قابل پرداخت در محل"
                : "قابل پرداخت"}
            </span>
            <strong className="text-lg font-black tabular-nums">
              {formatMoney(payable, session.currency)}
            </strong>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-full font-black"
            isPending={isPending}
            isDisabled={isPending}
            onPress={onConfirm}
          >
            {payable > 0
              ? paymentMethod === "online"
                ? "ثبت رزرو و ادامه پرداخت"
                : "ثبت رزرو با پرداخت حضوری"
              : "تأیید و ثبت رزرو"}
            <Icon name="arrow-left" size={20} />
          </Button>
        </div>
      </div>
    </main>
  );
}

function ReviewSection({
  icon,
  title,
  children,
  action,
}: {
  icon: "calendar-check" | "credit-card" | "bill";
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-black">
          <Icon name={icon} size={21} className="text-muted" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted">{label}</span>
      <strong className="min-w-0 break-words text-end leading-6 text-foreground">
        {value}
      </strong>
    </div>
  );
}

function PriceRow({
  label,
  value,
  accent,
  strong,
}: {
  label: string;
  value: string;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-5 py-4 ${accent ? "bg-success/10 text-success" : ""}`}
    >
      <span className={strong ? "font-black" : "text-sm"}>{label}</span>
      <strong
        className={
          strong
            ? "shrink-0 text-base font-black text-accent"
            : "shrink-0 text-sm"
        }
      >
        {value}
      </strong>
    </div>
  );
}

function deliveryModeLabel(mode: ReservationReviewSession["deliveryMode"]) {
  return {
    club: "حضوری در باشگاه",
    online: "آنلاین",
    home: "در محل ورزشکار",
    outdoor: "فضای باز",
  }[mode];
}

function formatMoney(amount: number, currency: string) {
  const unit = currency.toUpperCase() === "IRR" ? "ریال" : currency;
  return `${amount.toLocaleString("fa-IR")} ${unit}`;
}

function cancellationCopy(
  policy: ReservationReviewSession["cancellationPolicy"],
) {
  const title = policy?.title?.trim();
  const tiers = [...(policy?.tiers ?? [])].sort(
    (a, b) => b.hoursBefore - a.hoursBefore,
  );
  if (!tiers.length)
    return (
      title || "شرایط لغو مشخص نشده است؛ پیش از پرداخت با پشتیبانی هماهنگ کنید."
    );
  return `${title ? `${title}: ` : ""}${tiers.map((tier) => `${tier.hoursBefore > 0 ? `از ${tier.hoursBefore.toLocaleString("fa-IR")} ساعت پیش از شروع` : "نزدیک به زمان شروع"}: ${tier.refundPercent.toLocaleString("fa-IR")}٪ بازپرداخت`).join("؛ ")}.`;
}

const PAYMENT_OPTIONS = {
  online: {
    title: "پرداخت آنلاین",
    description: "پرداخت از طریق درگاه، پس از ثبت رزرو.",
    icon: "wallet" as const,
  },
  cash: {
    title: "پرداخت نقدی",
    description: "مبلغ را هنگام مراجعه به پذیرش باشگاه بپردازید.",
    icon: "bill" as const,
  },
  pos: {
    title: "کارت‌خوان در محل",
    description: "هنگام مراجعه، با کارت بانکی در پذیرش پرداخت کنید.",
    icon: "credit-card" as const,
  },
};
