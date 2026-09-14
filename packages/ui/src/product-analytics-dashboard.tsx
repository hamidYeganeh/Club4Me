"use client";
import { IranDateInput } from "./iran-date-input";
import { useState } from "react";
import { Card, Button } from "@heroui/react";
import { FormSelect, FormOption } from "./form-select";
import { LineChart, Line, Grid, XAxis } from "./charts";

export type AnalyticsData = {
  start: string;
  end: string;
  generatedAt: string;
  clubId: string | null;
  metrics: Array<{
    key: string;
    label: string;
    value: number;
    previous: number;
    changePercent: number | null;
    unit: string;
  }>;
  funnel: Array<{
    key: string;
    label: string;
    users: number;
    conversionPercent: number;
  }>;
  cohorts: Array<{
    week: string;
    users: number;
    retention: Array<number | null>;
  }>;
  operations: {
    newCustomers: number;
    returningCustomers: number;
    repeatRate: number | null;
    upcomingCapacity: number;
    upcomingReserved: number;
    occupancyRate: number | null;
    expiringMemberships: number;
    averageRating: number | null;
    reviewCount: number;
    noShows: number;
  };
  renewals: number;
  peakHours: Array<{ day: number; hour: number; count: number }>;
  markets: Array<{ id: string; name: string; count: number }>;
  health: Array<{
    key: string;
    count: number;
    failed: number;
    errorRate: number | null;
    p95Ms: number;
  }>;
  trend: Array<{ label: string; value: number }>;
  classes: Array<{
    id: string;
    clubId: string;
    title: string;
    capacity: number;
    enrolled: number;
    pending: number;
    occupancyRate: number | null;
  }>;
  actions: Array<{ key: string; label: string; href: string }>;
  integration?: { configured: boolean; pending: number; retrying: number };
  paymentMode: string;
  definitions: Record<string, string>;
  breakdowns: {
    acquisitionChannel: Array<{ key: string; count: number }>;
    sport: Array<{ key: string; count: number }>;
    serviceType: Array<{ key: string; count: number }>;
  };
  versions: Array<{ key: string; count: number }>;
  searchCount: number;
  emptySearches: number;
};
const number = (v: number | null) =>
  v === null ? "—" : v.toLocaleString("fa-IR", { maximumFractionDigits: 1 });
const date = (v: string) =>
  new Date(v.length === 10 ? `${v}T12:00:00+03:30` : v).toLocaleDateString(
    "fa-IR",
    {
      timeZone: "Asia/Tehran",
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

export function AnalyticsPeriodControl({
  days,
  onDays,
  end,
  onEnd,
}: {
  days: number;
  onDays: (v: number) => void;
  end: string;
  onEnd: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-xs text-muted">
        بازه گزارش
        <FormSelect
          aria-label="بازه گزارش"
          value={days}
          onChange={(v) => onDays(Number(v))}
          className="h-11 rounded-xl border border-border bg-surface px-3"
        >
          <FormOption value={7}>۷ روز</FormOption>
          <FormOption value={30}>۳۰ روز</FormOption>
          <FormOption value={90}>۹۰ روز</FormOption>
        </FormSelect>
      </label>
      <label className="grid gap-1 text-xs text-muted">
        پایان بازه (خالی: اکنون)
        <IranDateInput
          value={end}
          max={new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Tehran",
          })}
          onValueChange={onEnd}
          className="h-11 rounded-xl border border-border bg-surface px-3 text-foreground"
        />
        {end ? <span>{date(end)}؛ ابتدای این روز</span> : null}
      </label>
    </div>
  );
}
export function ProductAnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { key: "overview", label: "نمای کلی" },
    { key: "behavior", label: "رفتار کاربران" },
    { key: "operations", label: "کلاس‌ها و مشتریان" },
  ];
  return (
    <div className="mt-5 space-y-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <span>
          {date(data.start)} تا {date(data.end)} · مقایسه با دوره قبل
        </span>
        <Button size="sm" variant="secondary" onPress={() => exportCsv(data)}>
          خروجی CSV
        </Button>
      </div>
      {data.paymentMode !== "live" ? (
        <p className="rounded-xl bg-warning/10 p-3 text-sm text-warning">
          پرداخت آنلاین در حالت{" "}
          {data.paymentMode === "simulation" ? "آزمایشی" : "غیرفعال"} است؛ اعداد
          پرداخت آنلاین را فروش واقعی تلقی نکنید.
        </p>
      ) : null}
      <div
        role="tablist"
        aria-label="گزارش‌های تحلیلی"
        className="flex flex-wrap gap-2"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            aria-controls={`analytics-${t.key}`}
            className={`rounded-full px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-focus ${tab === t.key ? "bg-accent text-accent-foreground" : "bg-surface-secondary text-foreground"}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <section
        id={`analytics-${tab}`}
        role="tabpanel"
        aria-label={tabs.find((t) => t.key === tab)?.label}
        className="space-y-5"
      >
        {tab === "overview" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {data.metrics.map((m) => (
                <Card key={m.key} className="rounded-2xl bg-surface p-5">
                  <p className="text-sm text-muted">{m.label}</p>
                  <p className="mt-3 text-2xl font-semibold tabular-nums">
                    {number(m.value)}{" "}
                    <span className="text-xs font-normal text-muted">
                      {m.unit}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    دوره قبل: {number(m.previous)} ·{" "}
                    {m.changePercent === null
                      ? "بدون مبنای درصدی"
                      : `${m.changePercent > 0 ? "+" : ""}${number(m.changePercent)}٪`}
                  </p>
                </Card>
              ))}
            </div>
            <Card className="rounded-2xl bg-surface p-5">
              <h2 className="font-semibold">روند ثبت رزرو</h2>
              {data.trend.length ? (
                <>
                  <div
                    className="mt-4 h-56"
                    aria-label="نمودار تعداد رزرو به تفکیک روز"
                  >
                    <LineChart
                      data={data.trend.map((p) => ({
                        label: date(p.label),
                        value: p.value,
                      }))}
                    >
                      <Grid />
                      <Line dataKey="value" stroke="var(--accent)" fill />
                      <XAxis />
                    </LineChart>
                  </div>
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer text-muted">
                      جدول داده‌های نمودار
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {data.trend.map((p) => (
                        <span key={p.label}>
                          {date(p.label)}: {number(p.value)}
                        </span>
                      ))}
                    </div>
                  </details>
                </>
              ) : (
                <Empty text="در این بازه رزروی ثبت نشده است." />
              )}
            </Card>
            <Card className="rounded-2xl bg-surface p-5">
              <h2 className="font-semibold">نیازمند پیگیری</h2>
              {data.actions.length ? (
                <ul className="mt-3 space-y-2">
                  {data.actions.map((a) => (
                    <li key={a.key}>
                      <a
                        href={a.href}
                        className="block rounded-xl bg-surface-secondary p-3 text-sm hover:text-accent"
                      >
                        {a.label} ←
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty text="در داده‌های فعلی موردی برای پیگیری پیدا نشد." />
              )}
            </Card>
          </>
        ) : null}
        {tab === "behavior" ? (
          <>
            <Card className="rounded-2xl bg-surface p-5">
              <h2 className="font-semibold">قیف رزرو سانس</h2>
              <p className="mt-2 text-sm text-muted">
                {data.definitions.conversion}
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {data.funnel.map((stage, i) => (
                  <div
                    key={stage.key}
                    className="rounded-xl bg-surface-secondary p-4"
                  >
                    <p className="text-sm">
                      {number(i + 1)}. {stage.label}
                    </p>
                    <strong className="mt-3 block text-2xl">
                      {number(stage.users)}
                    </strong>
                    <progress
                      aria-label={stage.label}
                      value={stage.conversionPercent}
                      max={100}
                      className="mt-3 h-2 w-full accent-[var(--accent)]"
                    />
                    <p className="mt-2 text-xs text-muted">
                      {number(stage.conversionPercent)}٪ از ورودی
                    </p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="overflow-auto rounded-2xl bg-surface p-5">
              <h2 className="font-semibold">بازگشت هفتگی رزروکنندگان</h2>
              <p className="mt-2 text-sm text-muted">
                {data.definitions.retention}
              </p>
              <table className="mt-4 w-full min-w-[600px] text-sm">
                <thead>
                  <tr>
                    <th className="p-3 text-start">
                      هفته اولین رزرو مشاهده‌شده
                    </th>
                    <th>تعداد</th>
                    {[0, 1, 2, 3, 4].map((w) => (
                      <th key={w}>هفته {number(w)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.cohorts.map((c) => (
                    <tr key={c.week}>
                      <td className="p-3">{date(c.week)}</td>
                      <td className="text-center">{number(c.users)}</td>
                      {c.retention.map((v, i) => (
                        <td key={i} className="p-2 text-center">
                          <span
                            title={
                              v === null
                                ? "این هفته هنوز کامل نشده است"
                                : undefined
                            }
                            className="block rounded-lg p-2"
                            style={
                              v !== null
                                ? {
                                    background: `color-mix(in oklch, var(--accent) ${Math.max(5, v * 0.35)}%, transparent)`,
                                  }
                                : undefined
                            }
                          >
                            {number(v)}
                            {v === null ? "" : "٪"}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.cohorts.length ? (
                <Empty text="هنوز تاریخچه کافی برای تحلیل بازگشت وجود ندارد." />
              ) : null}
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["کانال جذب", data.breakdowns.acquisitionChannel],
                ["نوع خدمت", data.breakdowns.serviceType],
                ["رشته (شناسه)", data.breakdowns.sport],
                ["نسخه و پلتفرم · تعداد رویداد", data.versions],
              ].map(([title, rows]) => (
                <Card
                  key={String(title)}
                  className="rounded-2xl bg-surface p-5"
                >
                  <h2 className="font-semibold">{String(title)}</h2>
                  {(rows as Array<{ key: string; count: number }>).length ? (
                    (rows as Array<{ key: string; count: number }>).map((r) => (
                      <div
                        key={r.key}
                        className="mt-3 flex justify-between gap-3 text-sm"
                      >
                        <span dir="auto">{r.key}</span>
                        <strong>{number(r.count)}</strong>
                      </div>
                    ))
                  ) : (
                    <Empty text="برای این تفکیک هنوز رویدادی نداریم." />
                  )}
                </Card>
              ))}
            </div>
            {!data.clubId ? (
              <Card className="overflow-auto rounded-2xl bg-surface p-5">
                <h2 className="font-semibold">
                  سلامت درخواست‌ها به تفکیک نسخه
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {data.definitions.health}
                </p>
                <table className="mt-4 w-full min-w-[500px] text-sm">
                  <thead>
                    <tr>
                      <th className="p-3 text-start">بخش / نسخه</th>
                      <th>درخواست</th>
                      <th>خطا</th>
                      <th>نرخ خطا</th>
                      <th>صدک ۹۵ (میلی‌ثانیه)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.health.map((r) => (
                      <tr key={r.key}>
                        <td dir="auto" className="p-3">
                          {r.key}
                        </td>
                        <td className="text-center">{number(r.count)}</td>
                        <td className="text-center">{number(r.failed)}</td>
                        <td className="text-center">{number(r.errorRate)}٪</td>
                        <td className="text-center">{number(r.p95Ms)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!data.health.length ? (
                  <Empty text="هنوز داده‌ای از سلامت درخواست‌ها ثبت نشده است." />
                ) : null}
              </Card>
            ) : null}
            {!data.clubId ? (
              <p className="text-sm text-muted">
                جست‌وجوهای بدون نتیجه: {number(data.emptySearches)} از{" "}
                {number(data.searchCount)}
              </p>
            ) : null}
          </>
        ) : null}
        {tab === "operations" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["مشتری اولین رزرو", data.operations.newCustomers],
                ["مشتری برگشتی", data.operations.returningCustomers],
                ["نرخ چند رزرو در بازه (%)", data.operations.repeatRate],
                ["غیبت رزروها", data.operations.noShows],
                [
                  "اشغال سانس‌های ۷ روز آینده (%)",
                  data.operations.occupancyRate,
                ],
                ["عضویت نزدیک انقضا", data.operations.expiringMemberships],
                ["میانگین امتیاز", data.operations.averageRating],
                ["تعداد نظر", data.operations.reviewCount],
              ].map(([label, value]) => (
                <Card
                  key={String(label)}
                  className="rounded-2xl bg-surface p-5"
                >
                  <p className="text-sm text-muted">{label}</p>
                  <strong className="mt-3 text-2xl">
                    {number(value as number | null)}
                  </strong>
                </Card>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="rounded-2xl bg-surface p-5">
                <h2 className="font-semibold">
                  زمان‌های پرطرفدار · تعداد نفر رزرو معتبر
                </h2>
                {data.peakHours.length ? (
                  data.peakHours.map((r) => (
                    <div
                      key={`${r.day}-${r.hour}`}
                      className="mt-3 flex justify-between text-sm"
                    >
                      <span>
                        {
                          [
                            "",
                            "یکشنبه",
                            "دوشنبه",
                            "سه‌شنبه",
                            "چهارشنبه",
                            "پنجشنبه",
                            "جمعه",
                            "شنبه",
                          ][r.day]
                        }{" "}
                        · ساعت {number(r.hour)}
                      </span>
                      <strong>{number(r.count)}</strong>
                    </div>
                  ))
                ) : (
                  <Empty text="برای این بازه رزرو معتبری نداریم." />
                )}
              </Card>
              <Card className="rounded-2xl bg-surface p-5">
                <h2 className="font-semibold">تمدید عضویت</h2>
                <strong className="mt-3 block text-3xl">
                  {number(data.renewals)}
                </strong>
                <p className="mt-2 text-sm text-muted">
                  عضویت‌های تمدیدشده در بازه انتخاب‌شده
                </p>
              </Card>
            </div>
            {!data.clubId ? (
              <Card className="rounded-2xl bg-surface p-5">
                <h2 className="font-semibold">
                  باشگاه‌ها بر اساس تعداد ثبت رزرو
                </h2>
                {data.markets.length ? (
                  data.markets.map((r) => (
                    <div
                      key={r.id}
                      className="mt-3 flex justify-between gap-3 text-sm"
                    >
                      <a href="/clubs" className="hover:text-accent">
                        {r.name}
                      </a>
                      <strong>{number(r.count)}</strong>
                    </div>
                  ))
                ) : (
                  <Empty text="هنوز رزروی در این بازه ثبت نشده است." />
                )}
              </Card>
            ) : null}
            <Card className="overflow-auto rounded-2xl bg-surface p-5">
              <h2 className="font-semibold">ظرفیت فعلی کلاس‌های فعال</h2>
              <p className="mt-2 text-sm text-muted">
                ۲۰ کلاس با بیشترین ثبت‌نام؛ رزرو موقت جدا نمایش داده می‌شود.
              </p>
              <table className="mt-4 w-full min-w-[500px] text-sm">
                <thead>
                  <tr>
                    <th className="p-3 text-start">کلاس</th>
                    <th>عضو قطعی</th>
                    <th>در انتظار</th>
                    <th>ظرفیت</th>
                    <th>پرشدن</th>
                  </tr>
                </thead>
                <tbody>
                  {data.classes.map((c) => (
                    <tr key={c.id}>
                      <td className="p-3">
                        <a
                          className="hover:text-accent"
                          href={
                            data.clubId
                              ? `/clubs/${c.clubId}/classes/${c.id}`
                              : "/classes"
                          }
                        >
                          {c.title}
                        </a>
                      </td>
                      <td className="text-center">{number(c.enrolled)}</td>
                      <td className="text-center">{number(c.pending)}</td>
                      <td className="text-center">{number(c.capacity)}</td>
                      <td className="text-center">
                        {number(c.occupancyRate)}٪
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.classes.length ? (
                <Empty text="کلاس فعالی برای نمایش وجود ندارد." />
              ) : null}
            </Card>
          </>
        ) : null}
      </section>
      <details className="rounded-2xl bg-surface p-5 text-sm">
        <summary className="cursor-pointer font-semibold">
          تعریف آمار و زمان به‌روزرسانی
        </summary>
        <dl className="mt-3 space-y-3">
          {Object.entries(data.definitions).map(([key, value]) => (
            <div key={key}>
              <dd className="leading-6 text-muted">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted">
          محاسبه گزارش:{" "}
          {new Date(data.generatedAt).toLocaleString("fa-IR", {
            timeZone: "Asia/Tehran",
          })}{" "}
          · ثبت نتایج سرور معمولاً با حدود یک دقیقه تأخیر
        </p>
        {data.integration ? (
          <p className="mt-3 text-xs text-muted">
            PostHog:{" "}
            {data.integration.configured
              ? "تنظیم‌شده"
              : "در انتظار تنظیم پروژه"}{" "}
            · صف: {number(data.integration.pending)} · در انتظار تلاش مجدد:{" "}
            {number(data.integration.retrying)}
          </p>
        ) : null}
      </details>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted">{text}</p>;
}
function exportCsv(data: AnalyticsData) {
  const cell = (v: unknown) =>
    `"${String(v ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""')}"`;
  const rows: unknown[][] = [
    ["شاخص", "مقدار", "دوره قبل", "درصد تغییر", "واحد", "شروع", "پایان"],
    ...data.metrics.map((m) => [
      m.label,
      m.value,
      m.previous,
      m.changePercent,
      m.unit,
      date(data.start),
      date(data.end),
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics-${data.clubId ?? "admin"}-${data.end.slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
