"use client";

import { useBusinessClubs, useBusinessDashboardSummary } from "@api/business";
import { Button, Card, Spinner } from "@heroui/react";
import { Icon, type IconName } from "@theme/icon";
import { Bar, BarChart, Grid, Line, LineChart, XAxis } from "@ui/charts";
import Link from "next/link";
import { useMemo, useState } from "react";

const money = (value: number) =>
  new Intl.NumberFormat("fa-IR", {
    notation: value >= 1_000_000_000 ? "compact" : "standard",
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

function Metric({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: IconName;
}) {
  return (
    <Card className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted">{hint}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent">
          <Icon name={icon} size={20} />
        </span>
      </div>
    </Card>
  );
}

export function BusinessDashboardOverview() {
  const clubs = useBusinessClubs();
  const [selectedClubId, setClubId] = useState("");
  const clubId = selectedClubId || clubs.data?.items[0]?.id || "";
  const summary = useBusinessDashboardSummary(clubId);
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
  const stats = summary.data?.stats;

  if (clubs.isPending)
    return (
      <div className="flex flex-1 justify-center py-24">
        <Spinner />
      </div>
    );
  if (!clubs.data?.items.length)
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
          <Button className="mt-5" variant="primary">
            <Link href="/clubs/new">ساخت باشگاه</Link>
          </Button>
        </div>
      </main>
    );

  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-accent">نمای کلی امروز</p>
            <h1 className="mt-1 text-2xl font-semibold">
              داشبورد مدیریت باشگاه
            </h1>
            <p className="mt-1 text-sm text-muted">
              همه اعداد از اطلاعات ثبت‌شده همین باشگاه محاسبه می‌شوند.
            </p>
          </div>
          <label className="grid gap-1 text-xs text-muted">
            باشگاه
            <select
              className="h-11 min-w-56 rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-accent"
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
            >
              {clubs.data.items.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {summary.isPending ? (
          <div className="flex justify-center py-24">
            <Spinner />
          </div>
        ) : summary.isError ? (
          <Card className="mt-6 rounded-2xl border border-danger/30 bg-danger/5 p-6 text-center">
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
            <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <Metric
                label="شاگرد فعال"
                value={String(stats?.activeStudents ?? 0)}
                hint="پرونده‌های فعال"
                icon="users-two"
              />
              <Metric
                label="مربی فعال"
                value={String(stats?.activeCoaches ?? 0)}
                hint="همکاران فعال"
                icon="user"
              />
              <Metric
                label="کلاس فعال"
                value={String(stats?.activeClasses ?? 0)}
                hint="کلاس‌های در حال اجرا"
                icon="calendar-1"
              />
              <Metric
                label="شعبه فعال"
                value={String(stats?.branchCount ?? 0)}
                hint="مکان‌های در حال کار"
                icon="building-1"
              />
              <Metric
                label="درآمد این ماه"
                value={`${money(stats?.monthlyRevenue ?? 0)} ریال`}
                hint="پرداخت‌های دستی"
                icon="wallet"
              />
              <Metric
                label="نرخ حضور هفته"
                value={`${stats?.attendanceRate ?? 0}٪`}
                hint="حاضر از کل ثبت‌ها"
                icon="check-circle"
              />
            </section>
            <section className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
              <Card className="rounded-2xl border border-border bg-surface p-5">
                <div>
                  <h2 className="font-semibold">روند درآمد شش‌ماهه</h2>
                  <p className="mt-1 text-sm text-muted">
                    مجموع شهریه، سانس و سایر پرداخت‌های ثبت‌شده
                  </p>
                </div>
                <div className="mt-5 h-64">
                  <BarChart data={revenue}>
                    <Bar dataKey="value" fill="var(--chart-1)" />
                  </BarChart>
                </div>
              </Card>
              <Card className="rounded-2xl border border-border bg-surface p-5">
                <div>
                  <h2 className="font-semibold">حضور هفت روز اخیر</h2>
                  <p className="mt-1 text-sm text-muted">
                    مقایسه حضور و غیبت ثبت‌شده
                  </p>
                </div>
                <div className="mt-5 h-64">
                  <LineChart data={attendance}>
                    <Grid />
                    <Line dataKey="present" stroke="var(--chart-1)" fill />
                    <Line dataKey="absent" stroke="var(--chart-3)" />
                    <XAxis />
                  </LineChart>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-muted">
                  <span>حاضر</span>
                  <span>غایب</span>
                </div>
              </Card>
            </section>
            <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["/students", "ثبت و مدیریت شاگرد", "users-two"],
                ["/classes", "مدیریت کلاس‌ها", "calendar-1"],
                ["/payments", "ثبت شهریه و پرداخت", "wallet"],
                ["/attendance", "حضور و غیاب امروز", "calendar-check"],
              ].map(([href, label, icon]) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 transition hover:border-accent active:scale-[0.99]"
                >
                  <span className="font-medium">{label}</span>
                  <Icon name={icon as IconName} className="text-accent" />
                </Link>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
