"use client";

import Link from "next/link";
import { useAthleteClubClasses, useSavedItems, useMyReservations } from "@api";
import { Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import {
  DashboardMetricCard,
  MetricBarVisual,
  MetricHeatmapVisual,
  MetricLineVisual,
  MetricRingVisual,
} from "@ui/dashboard-metric-card";
import { DashboardHistoryCard } from "@ui/dashboard-history-card";

const formatNumber = (value: number) => value.toLocaleString("fa-IR");
const dateFormat = new Intl.DateTimeFormat("fa-IR", {
  timeZone: "Asia/Tehran",
  year: "numeric",
  month: "short",
  day: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("fa-IR", {
  timeZone: "Asia/Tehran",
  hour: "2-digit",
  minute: "2-digit",
});

export function AthleteActivitySummarySection() {
  const reservations = useMyReservations();
  const clubClasses = useAthleteClubClasses();
  const favorites = useSavedItems();

  const reservationItems = reservations.data?.items ?? [];
  const classItems = clubClasses.data?.items ?? [];
  const favoriteItems = favorites.data?.items ?? [];
  const reservationCount = reservationItems.filter((item) =>
    ["reserved", "completed"].includes(item.status),
  ).length;
  const activeClassCount = classItems.filter((item) =>
    ["pending", "active", "waitlisted"].includes(item.status),
  ).length;
  const completedCount = reservationItems.filter(
    (item) => item.status === "completed",
  ).length;
  const outcomeCount = reservationItems.filter((item) =>
    ["completed", "no_show"].includes(item.status),
  ).length;
  const completionRate = outcomeCount
    ? Math.round((completedCount / outcomeCount) * 100)
    : 0;
  const reservationStatusData = [
    "reserved",
    "completed",
    "cancelled",
    "no_show",
  ].map((status) => ({
    label: status,
    value: reservationItems.filter((item) => item.status === status).length,
  }));
  const classStatusData = ["pending", "active", "waitlisted", "completed"].map(
    (status) => ({
      label: status,
      primary: classItems.filter((item) => item.status === status).length,
    }),
  );
  const metricValue = (unavailable: boolean, value: number) =>
    unavailable ? "—" : formatNumber(value);
  const recentReservations = [...reservationItems]
    .sort(
      (a, b) =>
        new Date(b.sessionStartsAt).getTime() -
        new Date(a.sessionStartsAt).getTime(),
    )
    .slice(0, 3);
  const recentReservationSeries = [...reservationItems]
    .sort(
      (a, b) =>
        new Date(a.sessionStartsAt).getTime() -
        new Date(b.sessionStartsAt).getTime(),
    )
    .slice(-7);
  const reservationStatus = {
    reserved: {
      label: "رزرو فعال",
      color: "var(--accent)",
      icon: "ticket" as const,
    },
    completed: {
      label: "تکمیل‌شده",
      color: "var(--success)",
      icon: "check-circle" as const,
    },
    cancelled: {
      label: "لغوشده",
      color: "var(--warning)",
      icon: "close-x-circle" as const,
    },
    no_show: {
      label: "عدم حضور",
      color: "var(--danger)",
      icon: "info-circle" as const,
    },
  };

  return (
    <section
      className="app-reveal flex flex-col gap-3"
      aria-labelledby="athlete-activity-summary-title"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <Typography
            id="athlete-activity-summary-title"
            type="h4"
            weight="bold"
          >
            نمای کلی من
          </Typography>
          <p className="mt-1 text-xs text-muted">
            خلاصه‌ای از فعالیت‌های ورزشی تو
          </p>
        </div>
        <Link
          href="/athlete/profile"
          className="shrink-0 text-xs font-bold text-accent"
        >
          پروفایل
        </Link>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/athlete/reservations"
          aria-label="رزروهای من"
          className="shrink-0 rounded-[32px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <DashboardMetricCard
            title="رزروها"
            value={metricValue(
              reservations.isPending || reservations.isError,
              reservationCount,
            )}
            unit="رزرو"
            icon={<Icon name="ticket" size={20} />}
            visual={<MetricBarVisual data={reservationStatusData} />}
            className="bg-warning text-warning-foreground"
          />
        </Link>
        <Link
          href="/athlete/classes"
          aria-label="کلاس‌های فعال من"
          className="shrink-0 rounded-[32px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <DashboardMetricCard
            title="کلاس‌های من"
            value={metricValue(
              clubClasses.isPending || clubClasses.isError,
              activeClassCount,
            )}
            unit="فعال"
            icon={<Icon name="weight" size={20} />}
            visual={<MetricLineVisual data={classStatusData} />}
            className="bg-accent text-accent-foreground"
          />
        </Link>
        <Link
          href="/athlete/favorites"
          aria-label="موارد ذخیره‌شده من"
          className="shrink-0 rounded-[32px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <DashboardMetricCard
            title="ذخیره‌شده"
            value={metricValue(
              favorites.isPending || favorites.isError,
              favoriteItems.length,
            )}
            unit="مورد"
            icon={<Icon name="bookmark" size={20} />}
            visual={<MetricHeatmapVisual value={favoriteItems.length} />}
            className="bg-surface-tertiary text-foreground"
          />
        </Link>
        <Link
          href="/athlete/reservations"
          aria-label="نرخ تکمیل رزروها"
          className="shrink-0 rounded-[32px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <DashboardMetricCard
            title="نرخ تکمیل"
            value={metricValue(
              reservations.isPending || reservations.isError,
              completionRate,
            )}
            unit="٪"
            icon={<Icon name="check-circle" size={20} />}
            visual={<MetricRingVisual value={completionRate} />}
            className="bg-success text-success-foreground"
          />
        </Link>
      </div>

      {recentReservations.length ? (
        <div className="mt-2 flex flex-col gap-3">
          <Typography type="h5" weight="bold">
            فعالیت‌های اخیر
          </Typography>
          {recentReservations.map((reservation) => {
            const status = reservationStatus[reservation.status];
            const startsAt = new Date(reservation.sessionStartsAt);
            return (
              <Link
                key={reservation.id}
                href={`/athlete/reservations/${reservation.id}`}
                className="rounded-[28px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <DashboardHistoryCard
                  date={dateFormat.format(startsAt)}
                  meta={timeFormat.format(startsAt)}
                  value={formatNumber(reservation.participantCount)}
                  unit="نفر"
                  status={status.label}
                  statusIcon={<Icon name={status.icon} size={18} />}
                  chartColor={status.color}
                  data={recentReservationSeries.map((item) => ({
                    label: item.id,
                    value: item.participantCount,
                    color:
                      item.id === reservation.id
                        ? status.color
                        : `color-mix(in oklch, ${status.color} 24%, transparent)`,
                  }))}
                />
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
