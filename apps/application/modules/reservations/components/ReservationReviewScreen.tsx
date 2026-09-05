"use client";

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
  currency: string;
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
}: {
  entity: ReservationReviewEntity;
  session: ReservationReviewSession;
  isPending: boolean;
  onBack: () => void;
  onConfirm: () => void;
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
    <main className="min-h-dvh bg-background pb-[calc(2rem+env(safe-area-inset-bottom))] text-foreground">
      <div className="mx-auto w-full max-w-xl px-5">
        <header className="flex items-center justify-between pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
          <Button
            isIconOnly
            variant="ghost"
            aria-label="بازگشت به انتخاب سانس"
            onPress={onBack}
          >
            <Icon name="chevron-right" size={22} />
          </Button>
          <h1 className="text-lg font-black">مرور رزرو</h1>
          <span className="size-10" aria-hidden />
        </header>

        <ol className="mb-8 grid grid-cols-3" aria-label="مراحل رزرو">
          {["انتخاب", "زمان", "تأیید و پرداخت"].map((label, index) => (
            <li key={label} className="relative flex flex-col items-center gap-2">
              {index > 0 ? (
                <span className="absolute end-1/2 top-3 h-0.5 w-full bg-accent" />
              ) : null}
              <span className="relative z-10 grid size-6 place-items-center rounded-full border-[5px] border-accent bg-background ring-1 ring-accent">
                {index === 2 ? (
                  <span className="size-1.5 rounded-full bg-accent" />
                ) : null}
              </span>
              <span className="text-[0.7rem] font-bold text-foreground">
                {label}
              </span>
            </li>
          ))}
        </ol>

        <Card className="app-card overflow-hidden shadow-none">
          <Card.Content className="flex items-center gap-4 p-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-surface-secondary">
              <FallbackImage
                src={entity.imageUrl}
                alt={entity.title}
                fill
                unoptimized
                sizes="80px"
                className="object-cover"
              />
              <span className="absolute bottom-1 end-1 grid size-6 place-items-center rounded-full border-2 border-surface bg-success text-success-foreground">
                <Icon name="check" size={12} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black">{entity.title}</p>
              <p className="mt-1 truncate text-sm text-muted">
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

        <ReviewSection icon="calendar-check" title="جزئیات سانس">
          <Card className="app-card shadow-none">
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
          <Card className="app-card shadow-none">
            <Card.Content className="flex items-center gap-4 p-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/12 text-accent">
                <Icon name={coveredAmount ? "ticket" : "wallet"} size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-black">
                  {session.paymentLabel ??
                    (payable > 0 ? "درگاه پرداخت آنلاین" : "بدون پرداخت")}
                </p>
                <p className="mt-1 text-xs leading-6 text-muted">
                  {payable > 0
                    ? "پس از ثبت رزرو، به درگاه پرداخت هدایت می‌شوید."
                    : "هزینه این رزرو در مرحله بعد صفر است."}
                </p>
              </div>
              <span className="grid size-6 place-items-center rounded-full border-2 border-accent">
                <span className="size-2.5 rounded-full bg-accent" />
              </span>
            </Card.Content>
          </Card>
        </ReviewSection>

        <ReviewSection icon="bill" title="خلاصه پرداخت">
          <Card className="app-card overflow-hidden shadow-none">
            <Card.Content className="divide-y divide-foreground/8 p-0">
              <PriceRow
                label={`${session.participantCount.toLocaleString("fa-IR")} × ${session.title}`}
                value={formatMoney(session.amount, session.currency)}
              />
              {coveredAmount > 0 ? (
                <PriceRow
                  label="اعتبار بسته یا عضویت"
                  value={`−${formatMoney(coveredAmount, session.currency)}`}
                  accent
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

        <Button
          variant="primary"
          size="lg"
          className="mt-7 w-full rounded-2xl font-black"
          isPending={isPending}
          onPress={onConfirm}
        >
          {payable > 0 ? "ثبت رزرو و ادامه پرداخت" : "تأیید و ثبت رزرو"}
          <Icon name="arrow-left" size={20} />
        </Button>

        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-surface-secondary/65 p-4 text-sm leading-7 text-muted">
          <Icon
            name="shield-exclamation-mark"
            size={22}
            className="mt-0.5 shrink-0 text-accent"
          />
          <p>{cancellationCopy(session.cancellationPolicy)}</p>
        </div>
      </div>
    </main>
  );
}

function ReviewSection({
  icon,
  title,
  children,
}: {
  icon: "calendar-check" | "credit-card" | "bill";
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-base font-black">
        <Icon name={icon} size={21} className="text-muted" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-5 text-sm">
      <span className="shrink-0 text-muted">{label}</span>
      <strong className="text-end leading-6 text-foreground">{value}</strong>
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
      <strong className={strong ? "text-lg font-black text-accent" : "text-sm"}>
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
  const fullRefundTier = policy?.tiers
    ?.filter((tier) => tier.refundPercent === 100)
    .sort((a, b) => a.hoursBefore - b.hoursBefore)[0];
  if (fullRefundTier && fullRefundTier.hoursBefore > 0) {
    return `${title ? `${title}: ` : ""}لغو تا ${fullRefundTier.hoursBefore.toLocaleString("fa-IR")} ساعت پیش از شروع سانس با بازپرداخت کامل انجام می‌شود.`;
  }
  if (title) return `شرایط لغو و بازپرداخت مطابق «${title}» محاسبه می‌شود.`;
  return "مبلغ بازپرداخت بر اساس زمان باقی‌مانده تا شروع سانس محاسبه می‌شود.";
}
