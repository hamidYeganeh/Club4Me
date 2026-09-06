"use client";

import Link from "next/link";
import { Button, Skeleton } from "@heroui/react";
import {
  useMyClassEnrollments,
  useMyCoachBookings,
  useMyReservations,
} from "@api";
import { Icon, type IconName } from "@theme/icon";

import { RequestFailureState } from "@/components/request-failure-state";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";

import {
  durationMinutes,
  formatReservationTime,
} from "../../reservations.utils";

type ReservationSource = "club" | "coach" | "class";

type ReservationDetail = {
  id: string;
  source: ReservationSource;
  title: string;
  subtitle?: string | null;
  startsAt: string;
  endsAt: string;
  participantCount: number;
  status: "reserved" | "cancelled" | "completed" | "no_show";
  paymentStatus: "not_required" | "pending" | "paid" | "refunded" | "failed";
  amount: number;
  currency: string;
  bookedAt: string;
  location?: string | null;
  refundPercent?: number | null;
  refundAmount?: number | null;
  cancellationPolicy?: string | null;
  changeTimeHref?: string;
};

export function ReservationDetailsScreen({
  reservationId,
  source,
}: {
  reservationId: string;
  source: ReservationSource;
}) {
  const clubReservations = useMyReservations();
  const coachBookings = useMyCoachBookings();
  const classEnrollments = useMyClassEnrollments();

  const detail = getReservationDetail({
    reservationId,
    source,
    clubItems: clubReservations.data?.items ?? [],
    coachItems: coachBookings.data?.items ?? [],
    classItems: classEnrollments.data?.items ?? [],
  });

  const activeQuery =
    source === "coach"
      ? coachBookings
      : source === "class"
        ? classEnrollments
        : clubReservations;

  return (
    <main className="min-h-dvh bg-background pb-[calc(7rem+env(safe-area-inset-bottom))] text-foreground">
      <SecondaryHeader
        title="جزئیات رزرو"
        showFilter={false}
        backHref="/athlete/reservations"
      />

      <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-5 pt-5">
        {activeQuery.isPending ? (
          <ReservationDetailsSkeleton />
        ) : activeQuery.isError ? (
          <RequestFailureState
            error={activeQuery.error}
            onRetry={() => void activeQuery.refetch()}
          />
        ) : detail ? (
          <ReservationDetailsContent detail={detail} />
        ) : (
          <section className="flex min-h-[55dvh] flex-col items-center justify-center text-center">
            <span className="grid size-16 place-items-center rounded-2xl bg-surface-secondary text-muted">
              <Icon name="calendar-1" size={30} />
            </span>
            <h2 className="mt-5 text-xl font-black">رزرو پیدا نشد</h2>
            <p className="mt-2 max-w-[28ch] text-sm leading-6 text-muted">
              ممکن است این رزرو حذف شده باشد یا دیگر به حساب شما تعلق نداشته باشد.
            </p>
            <Link
              href="/athlete/reservations"
              className="mt-6 flex min-h-12 items-center justify-center rounded-2xl bg-accent px-6 font-bold text-accent-foreground active:scale-[0.98]"
            >
              بازگشت به رزروها
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

function ReservationDetailsContent({ detail }: { detail: ReservationDetail }) {
  const status = STATUS_PRESENTATION[detail.status];
  const payment = PAYMENT_LABELS[detail.paymentStatus];
  const sourceLabel = SOURCE_LABELS[detail.source];
  const date = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(detail.startsAt));
  const bookedAt = new Intl.DateTimeFormat("fa-IR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(detail.bookedAt));

  return (
    <>
      <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-accent px-5 py-6 text-accent-foreground">
        <span
          aria-hidden
          className="absolute -end-10 -top-12 -z-10 size-40 rounded-full bg-white/10"
        />
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15">
            <Icon name={SOURCE_ICONS[detail.source]} size={27} />
          </span>
          <span className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-black">
            {status.label}
          </span>
        </div>
        <p className="mt-7 text-xs font-bold text-accent-foreground/75">
          {sourceLabel}
        </p>
        <h2 className="mt-1 text-balance text-2xl leading-9 font-black">
          {detail.title}
        </h2>
        {detail.subtitle ? (
          <p className="mt-2 text-sm text-accent-foreground/80">
            {detail.subtitle}
          </p>
        ) : null}
      </section>

      <DetailSection title="زمان برگزاری" icon="calendar-check">
        <div className="grid gap-4">
          <DetailRow label="تاریخ" value={date} icon="calendar-1" />
          <DetailRow
            label="ساعت"
            value={`${formatReservationTime(detail.startsAt)} تا ${formatReservationTime(detail.endsAt)}`}
            icon="clock"
          />
          <DetailRow
            label="مدت"
            value={`${durationMinutes(detail.startsAt, detail.endsAt).toLocaleString("fa-IR")} دقیقه`}
            icon="stopwatch"
          />
          <DetailRow
            label="تعداد نفرات"
            value={`${detail.participantCount.toLocaleString("fa-IR")} نفر`}
            icon="users-two"
          />
          {detail.location ? (
            <DetailRow label="محل برگزاری" value={detail.location} icon="map-pin-1" />
          ) : null}
        </div>
      </DetailSection>

      <DetailSection title="پرداخت" icon="wallet">
        <div className="grid gap-4">
          <DetailRow label="وضعیت پرداخت" value={payment} icon="credit-card" />
          <DetailRow
            label="مبلغ رزرو"
            value={formatMoney(detail.amount, detail.currency)}
            icon="bill"
            accent
          />
          {detail.refundAmount != null ? (
            <DetailRow
              label="مبلغ بازپرداخت"
              value={`${formatMoney(detail.refundAmount, detail.currency)} (${Number(detail.refundPercent ?? 0).toLocaleString("fa-IR")}٪)`}
              icon="wallet"
            />
          ) : null}
        </div>
      </DetailSection>

      <DetailSection title="اطلاعات رزرو" icon="info">
        <div className="grid gap-4">
          <DetailRow label="تاریخ ثبت" value={bookedAt} icon="calendar-1" />
          <DetailRow label="شناسه رزرو" value={detail.id.slice(-8)} icon="qr-code" ltr />
          {detail.cancellationPolicy ? (
            <DetailRow
              label="قانون لغو"
              value={detail.cancellationPolicy}
              icon="shield"
            />
          ) : null}
        </div>
      </DetailSection>

      {detail.status === "reserved" ? (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-xl border-t border-border bg-background/95 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/athlete/reservations"
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-danger/25 bg-danger/8 px-4 font-bold text-danger active:scale-[0.98]"
            >
              مدیریت رزرو
              <Icon name="calendar-1" size={19} />
            </Link>
            <Link
              href={detail.changeTimeHref ?? "/discovery"}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-4 font-bold text-accent-foreground active:scale-[0.98]"
            >
              تغییر زمان
              <Icon name="calendar-plus" size={19} />
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: IconName;
  children: React.ReactNode;
}) {
  return (
    <section className="app-card rounded-[1.5rem] p-5">
      <h2 className="mb-5 flex items-center gap-2 text-base font-black">
        <Icon name={icon} size={21} className="text-accent" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function DetailRow({
  label,
  value,
  icon,
  accent = false,
  ltr = false,
}: {
  label: string;
  value: string;
  icon: IconName;
  accent?: boolean;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-secondary text-muted">
        <Icon name={icon} size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p
          dir={ltr ? "ltr" : undefined}
          className={`mt-1 text-sm leading-6 font-bold ${accent ? "text-accent" : "text-foreground"} ${ltr ? "text-end" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function ReservationDetailsSkeleton() {
  return (
    <div className="grid gap-5" aria-label="در حال بارگذاری جزئیات رزرو">
      <Skeleton className="h-52 rounded-[1.75rem]" />
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="app-card grid gap-4 rounded-[1.5rem] p-5">
          <Skeleton className="h-5 w-32 rounded-lg" />
          {Array.from({ length: index === 0 ? 4 : 2 }, (_, row) => (
            <div key={row} className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20 rounded-lg" />
                <Skeleton className="h-4 w-2/3 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function getReservationDetail({
  reservationId,
  source,
  clubItems,
  coachItems,
  classItems,
}: {
  reservationId: string;
  source: ReservationSource;
  clubItems: NonNullable<ReturnType<typeof useMyReservations>["data"]>["items"];
  coachItems: NonNullable<ReturnType<typeof useMyCoachBookings>["data"]>["items"];
  classItems: NonNullable<ReturnType<typeof useMyClassEnrollments>["data"]>["items"];
}): ReservationDetail | null {
  if (source === "coach") {
    const item = coachItems.find((candidate) => candidate.id === reservationId);
    if (!item) return null;
    return {
      id: item.id,
      source,
      title: item.sessionTitle,
      subtitle: item.offeringTitle,
      startsAt: item.sessionStartsAt,
      endsAt: item.sessionEndsAt,
      participantCount: 1,
      status: normalizeCoachStatus(item.status),
      paymentStatus: item.paymentStatus,
      amount: item.priceSnapshot.amount,
      currency: item.priceSnapshot.currency,
      bookedAt: item.bookedAt,
      location: deliveryLocation(item.deliveryMode, item.venue),
      refundPercent: item.refundPercent,
      refundAmount: item.refundAmount,
      changeTimeHref: `/discovery/coaches/${item.coachId}`,
    };
  }

  if (source === "class") {
    const item = classItems.find((candidate) => candidate.id === reservationId);
    if (!item) return null;
    return {
      id: item.id,
      source,
      title: item.classTitle,
      startsAt: item.courseStartAt,
      endsAt: item.courseEndAt,
      participantCount: 1,
      status: normalizeClassStatus(item.status),
      paymentStatus: item.paymentStatus,
      amount: item.priceSnapshot.amount,
      currency: item.priceSnapshot.currency,
      bookedAt: item.registeredAt,
      location: deliveryLocation(item.deliveryMode, item.venue),
      refundPercent: item.refundPercent,
      refundAmount: item.refundAmount,
      changeTimeHref: `/discovery/classes/${item.classId}`,
    };
  }

  const item = clubItems.find((candidate) => candidate.id === reservationId);
  if (!item) return null;
  return {
    id: item.id,
    source,
    title: item.sessionTitle,
    startsAt: item.sessionStartsAt,
    endsAt: item.sessionEndsAt,
    participantCount: item.participantCount,
    status: item.status,
    paymentStatus: item.paymentStatus,
    amount: item.totalPrice,
    currency: "IRR",
    bookedAt: item.createdAt,
    refundPercent: item.refundPercent,
    refundAmount: item.refundAmount,
    cancellationPolicy: item.cancellationPolicy.title,
    changeTimeHref: `/discovery/clubs/${item.clubId}/slots`,
  };
}

function deliveryLocation(
  mode: "club" | "online" | "home" | "outdoor",
  venue: { address?: string; onlineUrl?: string } | null,
) {
  if (mode === "online") return venue?.onlineUrl || "آنلاین";
  if (mode === "home") return venue?.address || "محل انتخابی ورزشکار";
  if (mode === "outdoor") return venue?.address || "فضای باز";
  return venue?.address || "باشگاه";
}

function normalizeCoachStatus(
  status:
    | "pending"
    | "confirmed"
    | "rejected"
    | "cancelled_by_athlete"
    | "cancelled_by_coach"
    | "completed"
    | "no_show",
): ReservationDetail["status"] {
  if (status === "pending" || status === "confirmed") return "reserved";
  if (status === "completed" || status === "no_show") return status;
  return "cancelled";
}

function normalizeClassStatus(
  status: "pending" | "active" | "rejected" | "cancelled" | "completed",
): ReservationDetail["status"] {
  if (status === "pending" || status === "active") return "reserved";
  if (status === "completed") return "completed";
  return "cancelled";
}

function formatMoney(amount: number, currency: string) {
  const unit = currency.toUpperCase() === "IRR" ? "ریال" : currency;
  return `${amount.toLocaleString("fa-IR")} ${unit}`;
}

const SOURCE_LABELS: Record<ReservationSource, string> = {
  club: "رزرو باشگاه",
  coach: "جلسه مربی",
  class: "ثبت‌نام کلاس",
};

const SOURCE_ICONS: Record<ReservationSource, IconName> = {
  club: "building-2",
  coach: "user",
  class: "users-three",
};

const STATUS_PRESENTATION: Record<
  ReservationDetail["status"],
  { label: string }
> = {
  reserved: { label: "فعال" },
  cancelled: { label: "لغوشده" },
  completed: { label: "انجام‌شده" },
  no_show: { label: "عدم حضور" },
};

const PAYMENT_LABELS: Record<ReservationDetail["paymentStatus"], string> = {
  not_required: "بدون نیاز به پرداخت",
  pending: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  refunded: "بازپرداخت‌شده",
  failed: "پرداخت ناموفق",
};
