"use client";

import Link from "@/components/app-link";
import { SectionHeading } from "@ui/section-heading";
import { useAthleteClubClasses, useSavedItems, useMyReservations } from "@api";
import { Button, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import {
  DashboardMetricCard,
  MetricCategoryVisual,
  MetricHeatmapVisual,
  MetricRingVisual,
} from "@ui/dashboard-metric-card";
import styles from "./activity-summary.module.css";

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
    label: (
      {
        reserved: "فعال",
        completed: "تکمیل",
        cancelled: "لغو",
        no_show: "عدم حضور",
      } as Record<string, string>
    )[status]!,
    value: reservationItems.filter((item) => item.status === status).length,
  }));
  const classStatusData = ["pending", "active", "waitlisted", "completed"].map(
    (status) => ({
      label: (
        {
          pending: "در انتظار",
          active: "فعال",
          waitlisted: "صف انتظار",
          completed: "تکمیل",
        } as Record<string, string>
      )[status]!,
      value: classItems.filter((item) => item.status === status).length,
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
      <SectionHeading
        id="athlete-activity-summary-title"
        title="نمای کلی من"
        description="فعالیت‌های ثبت‌شده؛ هر کارت را برای جزئیات باز کن"
        action={
          <Link
            href="/athlete/profile"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-accent"
          >
            پروفایل
          </Link>
        }
      />

      <div className={styles.grid}>
        <Link
          href="/athlete/reservations"
          aria-label="رزروهای من"
          className={styles.link}
        >
          <DashboardMetricCard
            className={styles.metric}
            title="رزروها"
            value={metricValue(
              reservations.isPending || reservations.isError,
              reservationCount,
            )}
            unit="رزرو"
            icon={<Icon name="ticket" size={20} />}
            visual={<MetricCategoryVisual data={reservationStatusData} />}
            unavailable={reservations.isPending || reservations.isError}
            description={
              reservations.isPending
                ? "در حال دریافت…"
                : reservations.isError
                  ? "دریافت نشد؛ دوباره تلاش کن"
                  : `${formatNumber(reservationCount)} رزرو فعال یا تکمیل‌شده`
            }
            tone="energy"
          />
        </Link>
        <Link
          href="/athlete/classes"
          aria-label="کلاس‌های فعال من"
          className={styles.link}
        >
          <DashboardMetricCard
            className={styles.metric}
            title="کلاس‌های من"
            value={metricValue(
              clubClasses.isPending || clubClasses.isError,
              activeClassCount,
            )}
            unit="فعال"
            icon={<Icon name="weight" size={20} />}
            visual={<MetricCategoryVisual data={classStatusData} />}
            unavailable={clubClasses.isPending || clubClasses.isError}
            description={
              clubClasses.isPending
                ? "در حال دریافت…"
                : clubClasses.isError
                  ? "دریافت نشد؛ دوباره تلاش کن"
                  : "فعال، در انتظار تأیید یا در صف"
            }
            tone="activity"
          />
        </Link>
        <Link
          href="/athlete/favorites"
          aria-label="موارد ذخیره‌شده من"
          className={styles.link}
        >
          <DashboardMetricCard
            className={styles.metric}
            title="ذخیره‌شده"
            value={metricValue(
              favorites.isPending || favorites.isError,
              favoriteItems.length,
            )}
            unit="مورد"
            icon={<Icon name="bookmark" size={20} />}
            visual={<MetricHeatmapVisual value={favoriteItems.length} />}
            unavailable={favorites.isPending || favorites.isError}
            description={
              favorites.isPending
                ? "در حال دریافت…"
                : favorites.isError
                  ? "دریافت نشد؛ دوباره تلاش کن"
                  : "هر خانه یک ذخیره؛ نمایش تا ۲۰ مورد"
            }
            tone="neutral"
          />
        </Link>
        <Link
          href="/athlete/reservations"
          aria-label="نرخ تکمیل رزروها"
          className={styles.link}
        >
          <DashboardMetricCard
            className={styles.metric}
            title="نرخ تکمیل"
            value={metricValue(
              reservations.isPending || reservations.isError || !outcomeCount,
              completionRate,
            )}
            unit="٪"
            icon={<Icon name="check-circle" size={20} />}
            visual={<MetricRingVisual value={completionRate} />}
            unavailable={
              reservations.isPending || reservations.isError || !outcomeCount
            }
            description={
              reservations.isPending
                ? "در حال دریافت…"
                : reservations.isError
                  ? "دریافت نشد؛ دوباره تلاش کن"
                  : outcomeCount
                    ? `${formatNumber(completedCount)} حضور از ${formatNumber(outcomeCount)} رزرو با نتیجه مشخص`
                    : "بعد از ثبت اولین نتیجه نمایش داده می‌شود"
            }
            tone="progress"
          />
        </Link>
      </div>

      {[reservations, clubClasses, favorites].some((query) => query.isError) ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 text-xs text-muted"
        >
          <p>بخشی از اطلاعات دریافت نشد.</p>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => {
              [reservations, clubClasses, favorites].forEach((query) => {
                if (query.isError) void query.refetch();
              });
            }}
          >
            تلاش دوباره
          </Button>
        </div>
      ) : null}
      {reservations.isSuccess && !reservationItems.length ? (
        <div className={styles.empty}>
          <span className={styles.emptyVisual} aria-hidden="true">
            <Icon name="ticket" size={30} />
          </span>
          <div>
            <h3 className="text-base font-semibold">
              اولین فعالیتت از اینجا شروع می‌شود
            </h3>
            <p className="mt-2 text-sm leading-7 text-muted">
              بعد از رزرو، برنامه و سابقه حضورت را اینجا می‌بینی.
            </p>
            <Link
              href="/discovery/search"
              className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-accent"
            >
              پیدا کردن باشگاه <Icon name="arrow-left" size={18} />
            </Link>
          </div>
        </div>
      ) : null}
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
                <article className={styles.history}>
                  <span
                    className={styles.statusIcon}
                    style={{ color: status.color }}
                    aria-hidden="true"
                  >
                    <Icon name={status.icon} size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">
                      {reservation.sessionTitle}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      {dateFormat.format(startsAt)} ·{" "}
                      {timeFormat.format(startsAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="text-xs font-medium">{status.label}</p>
                    <p className="mt-1 text-xs text-muted tabular-nums">
                      {formatNumber(reservation.participantCount)} نفر
                    </p>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
