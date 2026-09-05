"use client";

import { useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { Button, Card, Typography } from "@heroui/react";
import {
  useCoachBookings,
  useCoachClasses,
  useCoachEnrollmentQueries,
} from "@api";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { buildCoachAnalytics, numberFormat } from "./coach-analytics";

const primary = "var(--accent)";
const secondary = "var(--success)";
type Series = { key: string; label: string; color: string };
const incomeSeries = [{ key: "income", label: "درآمد", color: primary }];
const reservationSeries = [
  { key: "bookings", label: "رزرو جلسه", color: primary },
  { key: "enrollments", label: "ثبت‌نام کلاس", color: secondary },
];
const capacitySeries = [
  { key: "enrolled", label: "ثبت‌نام‌شده", color: primary },
  { key: "available", label: "ظرفیت خالی", color: "var(--chart-4)" },
];
const statusSeries = [{ key: "value", label: "درخواست", color: primary }];
const currencyLabel = (currency: string) =>
  currency === "IRR" ? "ریال" : currency;

export function CoachAnalyticsSection() {
  const [days, setDays] = useState(30);
  const [selectedCurrency, setSelectedCurrency] = useState("IRR");
  const classes = useCoachClasses();
  const bookings = useCoachBookings();
  const enrollmentQueries = useCoachEnrollmentQueries(
    (classes.data?.items ?? []).map((item) => item.id),
  );
  const enrollments = enrollmentQueries.flatMap(
    (query) => query.data?.items ?? [],
  );
  const currencies = [
    ...new Set([
      ...(bookings.data?.items ?? []).map(
        (item) => item.priceSnapshot.currency,
      ),
      ...enrollments.map((item) => item.priceSnapshot.currency),
    ]),
  ].sort();
  const currency = currencies.includes(selectedCurrency)
    ? selectedCurrency
    : (currencies[0] ?? "IRR");
  const isError =
    classes.isError ||
    bookings.isError ||
    enrollmentQueries.some((query) => query.isError);
  const loading =
    classes.isPending ||
    bookings.isPending ||
    enrollmentQueries.some((query) => query.isPending);
  const analytics = buildCoachAnalytics(
    classes.data?.items ?? [],
    bookings.data?.items ?? [],
    enrollments,
    days,
    currency,
  );
  const retry = () => {
    void classes.refetch();
    void bookings.refetch();
    enrollmentQueries.forEach((query) => {
      void query.refetch();
    });
  };

  return (
    <section
      aria-labelledby="coach-analytics-title"
      className="flex min-w-0 flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography id="coach-analytics-title" type="h4" weight="bold">
            عملکرد شما
          </Typography>
          <p className="mt-1 text-xs text-muted">
            درآمد، رزروها و وضعیت کلاس‌های شخصی شما
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted">
          بازه گزارش
          <select
            aria-label="بازه گزارش"
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            <option value={7}>۷ روز اخیر</option>
            <option value={30}>۳۰ روز اخیر</option>
            <option value={90}>۹۰ روز اخیر</option>
          </select>
        </label>
      </div>
      {isError ? (
        <Card className="rounded-3xl bg-surface p-5 shadow-none" role="alert">
          <p className="text-sm">دریافت آمار کامل نشد. دوباره تلاش کنید.</p>
          <Button variant="secondary" onPress={retry}>
            تلاش دوباره
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3" aria-busy={loading}>
            <Metric
              label="درآمد پس از بازپرداخت"
              value={loading ? "—" : numberFormat.format(analytics.income)}
              detail={currencyLabel(currency)}
            />
            <Metric
              label="رزرو و ثبت‌نام"
              value={
                loading ? "—" : numberFormat.format(analytics.reservations)
              }
              detail="در بازه انتخاب‌شده"
            />
            <Metric
              label="کلاس‌های فعال"
              value={
                loading ? "—" : numberFormat.format(analytics.activeClasses)
              }
              detail="وضعیت فعلی"
            />
            <Metric
              label="تکمیل ظرفیت"
              value={
                loading
                  ? "—"
                  : `${numberFormat.format(analytics.occupancyPercent)}٪`
              }
              detail="کلاس‌های فعال فعلی"
            />
          </div>
          <ChartCard
            title="روند درآمد"
            description="پرداخت‌های رزرو جلسه و ثبت‌نام کلاس، پس از کسر بازپرداخت؛ بر اساس تاریخ ثبت درخواست، نه تاریخ تسویه مربی."
          >
            {currencies.length > 1 && (
              <label className="flex items-center gap-2 text-sm">
                واحد پول
                <select
                  aria-label="واحد پول درآمد"
                  className="rounded-lg border border-border bg-surface p-2"
                  value={currency}
                  onChange={(event) => setSelectedCurrency(event.target.value)}
                >
                  {currencies.map((value) => (
                    <option key={value} value={value}>
                      {currencyLabel(value)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <DashboardChart
              title="روند درآمد"
              data={analytics.trend}
              series={incomeSeries}
              loading={loading}
              empty={analytics.income === 0}
              emptyText="در این بازه درآمدی ثبت نشده است."
              unit={currencyLabel(currency)}
            />
          </ChartCard>
          <ChartCard
            title="روند رزرو و ثبت‌نام"
            description="تعداد درخواست‌های ثبت‌شده در بازه انتخاب‌شده، شامل درخواست‌های لغوشده."
          >
            <DashboardChart
              title="روند رزرو و ثبت‌نام"
              data={analytics.trend}
              series={reservationSeries}
              loading={loading}
              empty={analytics.reservations === 0}
              emptyText="در این بازه رزرو یا ثبت‌نامی وجود ندارد."
            />
          </ChartCard>
          <ChartCard
            title="وضعیت درخواست‌ها"
            description="وضعیت فعلی رزروها و ثبت‌نام‌های ثبت‌شده در بازه انتخاب‌شده."
          >
            <DashboardChart
              title="وضعیت درخواست‌ها"
              data={analytics.statuses}
              series={statusSeries}
              loading={loading}
              empty={analytics.reservations === 0}
              emptyText="هنوز درخواستی برای نمایش وجود ندارد."
            />
          </ChartCard>
          <ChartCard
            title="ظرفیت کلاس‌ها"
            description="وضعیت فعلی ۶ کلاس فعال با بیشترین ثبت‌نام؛ مستقل از بازه گزارش."
          >
            <DashboardChart
              title="ظرفیت کلاس‌ها"
              data={analytics.occupancy}
              series={capacitySeries}
              loading={loading}
              empty={!analytics.occupancy.length}
              emptyText="هنوز کلاس فعالی برای نمایش وجود ندارد."
            />
            {!loading && analytics.occupancy.length > 0 && (
              <ol className="flex flex-col gap-2 text-xs text-muted">
                {analytics.occupancy.map((item) => (
                  <li key={item.label} className="flex items-start gap-2">
                    <span>{item.label}.</span>
                    <span className="min-w-0 flex-1">{item.fullLabel}</span>
                    <span className="shrink-0">
                      {numberFormat.format(item.enrolled)} /{" "}
                      {numberFormat.format(item.enrolled + item.available)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </ChartCard>
        </>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="min-w-0 rounded-2xl bg-surface p-4 shadow-none">
      <p className="text-xs text-muted">{label}</p>
      <p className="break-words text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{detail}</p>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="min-w-0 gap-4 rounded-3xl bg-surface p-5 shadow-none">
      <div>
        <Typography type="h5" weight="bold">
          {title}
        </Typography>
        <p className="mt-2 text-xs leading-6 text-muted">{description}</p>
      </div>
      {children}
    </Card>
  );
}

function DashboardChart({
  title,
  data,
  series,
  loading,
  empty,
  emptyText,
  unit = "",
}: {
  title: string;
  data: Record<string, unknown>[];
  series: Series[];
  loading: boolean;
  empty: boolean;
  emptyText: string;
  unit?: string;
}) {
  const reducedMotion = useReducedMotion();
  if (!loading && empty)
    return <p className="py-10 text-center text-sm text-muted">{emptyText}</p>;
  return (
    <div className="min-w-0" aria-busy={loading}>
      <div dir="ltr" aria-hidden="true">
        <BarChart
          data={loading ? [] : data}
          xDataKey="label"
          aspectRatio="1.6 / 1"
          margin={{ top: 12, right: 12, bottom: 40, left: 12 }}
          stacked={series.length > 1}
          status={loading ? "loading" : "ready"}
          animationDuration={reducedMotion ? 0 : 650}
        >
          <Grid horizontal numTicksRows={3} />
          {series.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              fill={item.color}
              lineCap={4}
              animate={!reducedMotion}
            />
          ))}
          <BarXAxis maxLabels={6} />
          <ChartTooltip
            showDatePill={false}
            showDots={false}
            content={({ point }) => (
              <div dir="rtl" className="flex flex-col gap-2 p-3 text-xs">
                <p className="font-bold">
                  {String(point.fullLabel ?? point.label)}
                </p>
                {series.map((item) => (
                  <p key={item.key}>
                    {item.label}: {numberFormat.format(Number(point[item.key]))}{" "}
                    {unit}
                  </p>
                ))}
              </div>
            )}
          />
        </BarChart>
      </div>
      {!loading && (
        <>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
            {series.map((item) => (
              <span key={item.key} className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
                {unit ? ` (${unit})` : ""}
              </span>
            ))}
          </div>
          <details className="mt-4 text-xs text-muted">
            <summary className="cursor-pointer py-2">
              مشاهده داده‌های نمودار
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <caption className="sr-only">{title}</caption>
                <thead>
                  <tr>
                    <th scope="col" className="p-2 text-start">
                      بازه / عنوان
                    </th>
                    {series.map((item) => (
                      <th key={item.key} scope="col" className="p-2 text-start">
                        {item.label} {unit}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((point) => (
                    <tr key={String(point.label)}>
                      <th scope="row" className="p-2 text-start font-normal">
                        {String(point.fullLabel ?? point.label)}
                      </th>
                      {series.map((item) => (
                        <td key={item.key} className="p-2">
                          {numberFormat.format(Number(point[item.key]))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
