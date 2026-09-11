"use client";

import { FormSelect, FormOption } from "@repo/ui/form-select";
import { BusinessToday } from "./BusinessToday";
import { useSelectedClub } from "@/lib/use-selected-club";

import {
  useBusinessClubActivation,
  useBusinessDashboardSummary,
} from "@api/business";
import { Button, Card, Spinner } from "@heroui/react";
import { Icon, type IconName } from "@theme/icon";
import { Grid, Line, LineChart, RingChart, XAxis } from "@ui/charts";
import {
  DashboardMetricCard,
  MetricBarVisual,
  MetricHeatmapVisual,
  MetricLineVisual,
  MetricRingVisual,
} from "@ui/dashboard-metric-card";
import {
  DashboardHistoryCard,
  DashboardTrendCard,
} from "@ui/dashboard-history-card";
import Link from "next/link";
import { useMemo } from "react";

const number = (value: number) => new Intl.NumberFormat("fa-IR").format(value);
const money = (value: number, compact = false) =>
  new Intl.NumberFormat("fa-IR", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
const monthLabel = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", { month: "short" }).format(
    new Date(`${value}-01T00:00:00.000Z`),
  );
const dayLabel = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", { weekday: "short" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );

const quickActions: Array<{
  href: string;
  label: string;
  description: string;
  icon: IconName;
}> = [
  {
    href: "/students",
    label: "شاگردها",
    description: "ثبت، جست‌وجو و مدیریت عضویت",
    icon: "users-two",
  },
  {
    href: "/classes",
    label: "کلاس‌ها",
    description: "برنامه، ظرفیت و سانس‌ها",
    icon: "calendar-1",
  },
  {
    href: "/attendance",
    label: "حضور و غیاب",
    description: "ثبت وضعیت جلسه‌های امروز",
    icon: "calendar-check",
  },
  {
    href: "/payments",
    label: "پرداخت‌ها",
    description: "ثبت شهریه، سانس و تراکنش",
    icon: "wallet",
  },
  {
    href: "/coaches",
    label: "مربی‌ها",
    description: "مدیریت تیم و تخصص‌ها",
    icon: "user",
  },
  {
    href: "/memberships",
    label: "محصولات عضویت",
    description: "تعریف پلن‌ها و مزایا",
    icon: "ticket",
  },
  {
    href: "/branches",
    label: "شعبه‌ها",
    description: "مکان‌ها و اطلاعات تماس",
    icon: "building-1",
  },
  {
    href: "/reviews",
    label: "بازخوردها",
    description: "پیگیری نظر اعضای باشگاه",
    icon: "star-full",
  },
];

export function BusinessDashboardOverview() {
  const { clubs, clubId, setClubId: setClubId } = useSelectedClub();
  const summary = useBusinessDashboardSummary(clubId);
  const activation = useBusinessClubActivation(clubId);
  const stats = summary.data?.stats;

  const revenue = useMemo(
    () =>
      (summary.data?.revenueByMonth ?? []).map((item) => ({
        ...item,
        label: monthLabel(item.label),
      })),
    [summary.data?.revenueByMonth],
  );
  const attendance = useMemo(
    () =>
      (summary.data?.attendanceByDay ?? []).map((item) => ({
        ...item,
        label: dayLabel(item.label),
      })),
    [summary.data?.attendanceByDay],
  );
  const attendanceTotals = useMemo(
    () =>
      attendance.reduce(
        (totals, item) => ({
          present: totals.present + item.present,
          absent: totals.absent + item.absent,
          excused: totals.excused + item.excused,
        }),
        { present: 0, absent: 0, excused: 0 },
      ),
    [attendance],
  );
  const paymentMix = summary.data?.paymentMix ?? {
    tuition: 0,
    session: 0,
    other: 0,
  };
  const paymentTotal =
    paymentMix.tuition + paymentMix.session + paymentMix.other;
  const tuitionShare = paymentTotal
    ? Math.round((paymentMix.tuition / paymentTotal) * 100)
    : 0;
  const attendanceRateData = attendance.map((item) => {
    const total = item.present + item.absent + item.excused;
    return {
      label: item.label,
      primary: total ? Math.round((item.present / total) * 100) : 0,
    };
  });
  const recentRevenue = revenue.slice(-3).reverse();

  if (clubs.isPending) {
    return (
      <div className="flex flex-1 justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (clubs.isError) {
    return (
      <main className="p-6">
        <Card className="p-6">
          <h1 className="text-xl font-bold">باشگاه‌ها دریافت نشدند</h1>
          <p role="alert" className="mt-2 text-sm text-muted">
            برای بازیابی باشگاه‌های حساب دوباره تلاش کنید.
          </p>
          <Button className="mt-4" onPress={() => void clubs.refetch()}>
            تلاش دوباره
          </Button>
        </Card>
      </main>
    );
  }

  if (!clubs.data?.items.length) {
    return (
      <main className="grid flex-1 place-items-center p-6">
        <div className="max-w-md text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/10 text-accent">
            <Icon name="building-2" size={28} />
          </span>
          <h1 className="mt-5 text-2xl font-semibold">اولین باشگاهت را بساز</h1>
          <p className="mt-2 leading-7 text-muted">
            آمار، شاگردها، مربی‌ها و شعبه‌ها بعد از ساخت باشگاه در همین داشبورد
            نمایش داده می‌شوند.
          </p>
          <Link
            href="/clubs/new"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground transition active:scale-[0.98]"
          >
            <Icon name="plus-fat" size={16} />
            ساخت باشگاه
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-accent">عملکرد باشگاه</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">
              مرکز مدیریت کسب‌وکار
            </h1>
            <p className="mt-1 text-sm text-muted">
              درآمد، حضور اعضا و عملیات روزانه در یک نگاه
            </p>
          </div>
          <label className="grid gap-1.5 text-xs text-muted">
            باشگاه فعال
            <FormSelect
              aria-label="باشگاه فعال"
              className="h-11 min-w-56 rounded-[1.15rem] border border-border/70 bg-surface/80 px-3 text-sm text-foreground outline-none transition focus:border-focus focus:ring-3 focus:ring-focus/15"
              value={clubId}
              onChange={(event) => setClubId(event)}
            >
              {clubs.data.items.map((club) => (
                <FormOption entity={club} key={club.id} value={club.id}>
                  {club.name}
                </FormOption>
              ))}
            </FormSelect>
          </label>
        </header>

        {activation.data && !activation.data.ready ? (
          <Card className="mt-5 rounded-[1.5rem] border border-warning/35 bg-warning/8 p-5 shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">
                  راه‌اندازی عرضه: {number(activation.data.completed)} از{" "}
                  {number(activation.data.total)}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  برای دیده‌شدن و اولین رزرو، موارد باقی‌مانده را کامل کنید.
                </p>
              </div>
              <Link
                href={
                  new URL(
                    activation.data.publicPreviewUrl,
                    process.env.NEXT_PUBLIC_APPLICATION_URL ||
                      "https://app.gym4me.ir",
                  ).href
                }
                className="text-sm font-medium text-accent"
              >
                پیش‌نمایش عمومی
              </Link>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {activation.data.items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl px-3 py-2 text-sm ${item.complete ? "bg-success/10 text-success" : "bg-surface-secondary text-foreground"}`}
                >
                  {item.complete ? "✓" : "○"} {item.label}
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <BusinessToday
          key={clubId}
          clubId={clubId}
          clubName={
            clubs.data.items.find((club) => club.id === clubId)?.name ?? ""
          }
        />

        {summary.isPending ? (
          <div className="flex justify-center py-24">
            <Spinner />
          </div>
        ) : summary.isError ? (
          <Card className="mt-6 rounded-2xl border border-danger/30 bg-danger/5 p-6 text-center shadow-none">
            <p>دریافت آمار باشگاه انجام نشد.</p>
            <Button
              className="mt-3"
              size="sm"
              variant="ghost"
              onPress={() => summary.refetch()}
            >
              تلاش دوباره
            </Button>
          </Card>
        ) : (
          <>
            <section className="mt-6 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link
                href="/payments"
                aria-label="درآمد این ماه"
                className="shrink-0 rounded-[32px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <DashboardMetricCard
                  title="خالص دریافت حضوری ماه"
                  value={money(stats?.monthlyRevenue ?? 0, true)}
                  unit="ریال"
                  icon={<Icon name="wallet" size={20} />}
                  visual={<MetricBarVisual data={revenue} />}
                  className="bg-warning text-warning-foreground"
                />
              </Link>
              <Link
                href="/attendance"
                aria-label="نرخ حضور هفت روز اخیر"
                className="shrink-0 rounded-[32px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <DashboardMetricCard
                  title="نرخ حضور"
                  value={number(stats?.attendanceRate ?? 0)}
                  unit="٪"
                  icon={<Icon name="calendar-check" size={20} />}
                  visual={<MetricLineVisual data={attendanceRateData} />}
                  className="bg-accent text-accent-foreground"
                />
              </Link>
              <Link
                href="/students"
                aria-label="شاگردهای فعال"
                className="shrink-0 rounded-[32px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <DashboardMetricCard
                  title="شاگرد فعال"
                  value={number(stats?.activeStudents ?? 0)}
                  unit="نفر"
                  icon={<Icon name="users-two" size={20} />}
                  visual={
                    <MetricHeatmapVisual value={stats?.activeStudents ?? 0} />
                  }
                  className="bg-surface-tertiary text-foreground"
                />
              </Link>
              <Link
                href="/payments"
                aria-label="سهم شهریه از پرداخت‌ها"
                className="shrink-0 rounded-[32px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <DashboardMetricCard
                  title="سهم شهریه"
                  value={number(tuitionShare)}
                  unit="٪"
                  icon={<Icon name="chart-trend-up" size={20} />}
                  visual={
                    <MetricRingVisual
                      value={paymentMix.tuition}
                      max={paymentTotal}
                    />
                  }
                  className="bg-success text-success-foreground"
                />
              </Link>
            </section>

            {recentRevenue.length ? (
              <section className="mt-4 grid gap-3 lg:grid-cols-3">
                {recentRevenue.map((period) => {
                  const chronologicalIndex = revenue.findIndex(
                    (item) => item.label === period.label,
                  );
                  const previous = revenue[chronologicalIndex - 1]?.value ?? 0;
                  const change = period.value - previous;
                  const chartColor =
                    change < 0 ? "var(--danger)" : "var(--success)";
                  return (
                    <DashboardHistoryCard
                      key={period.label}
                      date={period.label}
                      meta="گزارش ماهانه"
                      value={money(period.value, true)}
                      unit="ریال"
                      status={
                        previous === 0
                          ? "اولین دوره ثبت‌شده"
                          : change < 0
                            ? "کاهش نسبت به ماه قبل"
                            : "رشد نسبت به ماه قبل"
                      }
                      statusIcon={
                        <Icon
                          name={
                            change < 0 ? "chart-trend-down" : "chart-trend-up"
                          }
                          size={18}
                        />
                      }
                      chartColor={chartColor}
                      data={revenue.map((item) => ({
                        label: item.label,
                        value: item.value,
                        color:
                          item.label === period.label
                            ? chartColor
                            : `color-mix(in oklch, ${chartColor} 24%, transparent)`,
                      }))}
                    />
                  );
                })}
              </section>
            ) : null}

            <section className="mt-4 grid gap-4 xl:grid-cols-12">
              <DashboardTrendCard
                title="روند درآمد شش‌ماهه"
                detail="شهریه، سانس و پرداخت‌های ثبت‌شده"
                value={money(stats?.monthlyRevenue ?? 0, true)}
                unit="ریال"
                data={revenue}
                color="var(--accent)"
                className="xl:col-span-7"
              />

              <Card className="app-card p-5 shadow-none active:scale-100 xl:col-span-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">ترکیب پرداخت‌ها</h2>
                    <p className="mt-1 text-sm text-muted">
                      سهم هر نوع از درآمد ثبت‌شده
                    </p>
                  </div>
                  <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                    ۶ ماه
                  </span>
                </div>
                <div className="mt-4 grid items-center gap-4 sm:grid-cols-[1fr_9rem] xl:grid-cols-[1fr_10rem]">
                  <div className="space-y-3">
                    {[
                      ["شهریه", paymentMix.tuition, "var(--chart-1)"],
                      ["سانس", paymentMix.session, "var(--chart-2)"],
                      ["سایر", paymentMix.other, "var(--chart-4)"],
                    ].map(([label, value, color]) => {
                      const numericValue = Number(value);
                      return (
                        <div
                          key={String(label)}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: String(color) }}
                          />
                          <span className="flex-1 text-muted">{label}</span>
                          <span className="font-medium tabular-nums">
                            {paymentTotal
                              ? `${number(Math.round((numericValue / paymentTotal) * 100))}٪`
                              : "۰٪"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-40">
                    <RingChart
                      centerValue={money(paymentTotal, true)}
                      centerLabel="ریال"
                      thickness={18}
                      segments={[
                        {
                          key: "tuition",
                          label: "شهریه",
                          value: paymentMix.tuition,
                          color: "var(--chart-1)",
                        },
                        {
                          key: "session",
                          label: "سانس",
                          value: paymentMix.session,
                          color: "var(--chart-2)",
                        },
                        {
                          key: "other",
                          label: "سایر",
                          value: paymentMix.other,
                          color: "var(--chart-4)",
                        },
                      ]}
                    />
                  </div>
                </div>
              </Card>
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-12">
              <Card className="app-card p-5 shadow-none active:scale-100 xl:col-span-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">حضور هفت روز اخیر</h2>
                    <p className="mt-1 text-sm text-muted">
                      مقایسه حضور و غیبت در جلسه‌های ثبت‌شده
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                    <Icon name="check-circle" size={14} />
                    {number(stats?.attendanceRate ?? 0)}٪ نرخ حضور
                  </span>
                </div>
                <div className="mt-5 h-56">
                  <LineChart data={attendance}>
                    <Grid />
                    <Line dataKey="present" stroke="var(--chart-1)" fill />
                    <Line dataKey="absent" stroke="var(--chart-3)" />
                    <Line dataKey="excused" stroke="var(--chart-4)" />
                    <XAxis />
                  </LineChart>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
                  {[
                    ["حاضر", attendanceTotals.present, "bg-accent"],
                    ["غایب", attendanceTotals.absent, "bg-[var(--chart-3)]"],
                    ["موجه", attendanceTotals.excused, "bg-[var(--chart-4)]"],
                  ].map(([label, value, dot]) => (
                    <span
                      key={String(label)}
                      className="inline-flex items-center gap-1.5"
                    >
                      <span className={`size-2 rounded-full ${dot}`} />
                      {label} · {number(Number(value))}
                    </span>
                  ))}
                </div>
              </Card>

              <Card className="app-card p-5 shadow-none active:scale-100 xl:col-span-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">دسترسی سریع</h2>
                    <p className="mt-1 text-sm text-muted">
                      کارهای پرتکرار پنل باشگاه
                    </p>
                  </div>
                  <Link
                    href="/data"
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    ورود و خروج داده
                  </Link>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-surface/45 p-3 transition-colors hover:border-accent/40 hover:bg-accent/5 active:scale-[0.99]"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-accent">
                        <Icon name={action.icon} size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          {action.label}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {action.description}
                        </span>
                      </span>
                      <Icon
                        name="chevron-left"
                        size={14}
                        className="shrink-0 text-muted transition-transform group-hover:-translate-x-0.5"
                      />
                    </Link>
                  ))}
                </div>
              </Card>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
