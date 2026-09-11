"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { useMyReservations, useMyCoachBookings, useMyEntitlements, useAccountMe } from "@api";
import { trainingApi } from "@api/domains/training";
import Link from "@/components/app-link";
import { CompactCardListSkeleton } from "@/components/loading-skeletons";
import { useNow } from "@/lib/use-now";
import { useWorkouts } from "@modules/training/useWorkouts";
import { useTrainingData } from "@modules/training/shared";
import { NextActionCard } from "./NextActionCard";
import { upcomingAgenda, tehranDay, sessionDate, sessionTime } from "./agenda";

export function AthleteToday() {
  const account = useAccountMe();
  const reservations = useMyReservations();
  const bookings = useMyCoachBookings();
  const entitlements = useMyEntitlements();
  const assignments = useTrainingData("assignments", trainingApi.assignments, true);
  const workouts = useWorkouts();
  const now = useNow();
  const [dayOffset, setDayOffset] = useState(0);
  const queries = [reservations, bookings, entitlements];
  const loading = now === null || queries.some((query) => query.isPending);
  const agenda = now === null ? [] : upcomingAgenda(reservations.data?.items ?? [], bookings.data?.items ?? [], now);
  const activeWorkout = workouts.workouts.find((item) => item.session.status === "active");
  const payment = agenda.find((item) => item.paymentPending);
  const next = agenda.find((item) => !item.paymentPending);
  const expiring = now === null ? undefined : entitlements.data?.items.filter((item) => item.status === "active" && Date.parse(item.startsAt) <= now && Date.parse(item.endsAt) > now && (Date.parse(item.endsAt) <= now + 7 * 86400000 || (item.remainingSessions !== null && item.remainingSessions <= 1))).sort((a, b) => Date.parse(a.endsAt) - Date.parse(b.endsAt))[0];
  const plan = assignments.data?.items.find((item) => item.status === "active" && item.available && now !== null && Date.parse(item.startsAt) <= now && Date.parse(item.endsAt) > now);
  const failed = queries.some((query) => query.isError);
  const selectedDay = now === null ? "" : tehranDay(now + dayOffset * 86400000);
  const visible = agenda.filter((item) => tehranDay(item.startsAt) === selectedDay);

  const action = activeWorkout ? {
    eyebrow: "ادامه مسیرت", title: activeWorkout.session.snapshot.title,
    description: "تمرین نیمه‌تمامت روی این دستگاه ذخیره شده؛ از همان‌جا ادامه بده.", href: "/athlete/training", action: "ادامه تمرین",
  } : payment ? {
    eyebrow: "رزرو در انتظار پرداخت", title: payment.title,
    description: "رزرو هنوز نهایی نشده است. وضعیت و مهلت پرداخت را بررسی کن.", href: payment.href, action: "بررسی و ادامه پرداخت",
  } : next && now !== null && Date.parse(next.startsAt) - now < 86400000 ? {
    eyebrow: "فعالیت پیش رو", title: next.title,
    description: `${sessionDate(next.startsAt)} · ${sessionTime(next.startsAt)} تا ${sessionTime(next.endsAt)}`,
    href: next.href, action: "مشاهده وضعیت و جزئیات",
  } : expiring ? {
    eyebrow: "اعتبارت را بررسی کن", title: expiring.title,
    description: `اعتبار تا ${sessionDate(expiring.endsAt)}${expiring.remainingSessions === null ? "" : ` · ${expiring.remainingSessions.toLocaleString("fa-IR")} جلسه باقی مانده`}`,
    href: `/athlete/memberships/${encodeURIComponent(expiring.id)}`, action: "مشاهده اعتبار و گزینه‌های تمدید",
  } : plan ? {
    eyebrow: "برنامه تمرینی تو", title: plan.snapshot.title,
    description: plan.consentAt ? "برنامه مربی آماده است؛ روز تمرینت را انتخاب کن." : "مربی برایت برنامه فرستاده؛ قبل از شروع آن را مرور کن.",
    href: "/athlete/training", action: plan.consentAt ? "مشاهده و شروع تمرین" : "مرور برنامه مربی",
  } : next ? {
    eyebrow: "رزرو بعدی تو", title: next.title,
    description: `${sessionDate(next.startsAt)} · ساعت ${sessionTime(next.startsAt)}`, href: next.href, action: "مشاهده رزرو",
  } : {
    eyebrow: "قدم بعدی", title: "برای حرکت بعدی آماده‌ای؟",
    description: "باشگاه، مربی یا کلاسی را پیدا کن که با زمان و علاقه‌ات هماهنگ باشد.", href: "/discovery/search", action: "پیدا کردن فعالیت مناسب",
  };

  return <div className="space-y-6">
    <div><p className="text-xs text-muted">{now === null ? "امروز" : sessionDate(now)}</p><h1 className="mt-2 text-2xl font-bold leading-10">سلام{account.data?.firstName ? `، ${account.data.firstName}` : ""}</h1><p className="text-sm leading-7 text-muted">برنامه و قدم بعدی‌ات، همین‌جا.</p></div>
    {loading ? <div role="status" aria-label="دریافت برنامه امروز"><CompactCardListSkeleton count={1} /></div> : <NextActionCard {...action} />}
    {failed ? <div role="alert" className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm leading-7"><p>بخشی از برنامه یا اعتبارها دریافت نشد؛ اطلاعات این صفحه ممکن است کامل نباشد.</p><Button size="sm" variant="ghost" onPress={() => { queries.forEach((query) => { if (query.isError) void query.refetch(); }); }}>تلاش دوباره</Button></div> : null}
    {workouts.error || assignments.error ? <Link href="/athlete/training" className="block rounded-xl bg-surface-secondary p-3 text-xs leading-6 text-muted">وضعیت تمرین کامل دریافت نشد؛ برای بررسی ذخیره‌ها و تلاش مجدد وارد تمرین من شو.</Link> : null}
    <section aria-label="برنامه هفت روز آینده" className="space-y-4">
      <div className="flex items-center justify-between gap-3"><h2 className="text-base font-bold">برنامه من</h2><Link href="/athlete/reservations" className="inline-flex min-h-11 items-center text-xs font-semibold text-accent">همه رزروها</Link></div>
      <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="انتخاب روز">
        {Array.from({ length: 7 }, (_, offset) => {
          const stamp = (now ?? 0) + offset * 86400000;
          const count = agenda.filter((item) => tehranDay(item.startsAt) === tehranDay(stamp)).length;
          return <button key={offset} type="button" disabled={now === null} aria-pressed={dayOffset === offset} aria-label={now === null ? "در حال دریافت روز" : `${sessionDate(stamp)}، ${count.toLocaleString("fa-IR")} رزرو`} onClick={() => setDayOffset(offset)} className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-3 transition focus-visible:outline-2 focus-visible:outline-focus ${dayOffset === offset ? "bg-accent text-accent-foreground" : "bg-surface text-muted hover:bg-surface-secondary"}`}>
            <span className="text-[10px]">{now === null ? "—" : new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", weekday: "short" }).format(stamp)}</span><span className="text-base font-bold tabular-nums">{now === null ? "—" : new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", day: "numeric" }).format(stamp)}</span><span aria-hidden="true" className={`size-1 rounded-full ${count ? "bg-current" : "bg-transparent"}`} />
          </button>;
        })}
      </div>
      {visible.map((item) => <Link key={`${item.source}:${item.id}`} href={item.href} className="flex min-h-24 items-center gap-4 rounded-2xl bg-surface px-4 py-3 transition hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-focus"><span className="border-l border-border pl-4 text-sm font-bold tabular-nums">{sessionTime(item.startsAt)}</span><span className="min-w-0 flex-1"><strong className="block text-sm leading-6">{item.title}</strong><span className="mt-1 block text-xs text-muted">{item.paymentPending ? "نیازمند تکمیل پرداخت" : item.source === "coach" ? "رزرو مربی · مشاهده وضعیت" : "رزرو باشگاه"}</span></span><span aria-hidden="true">←</span></Link>)}
      {!loading && !visible.length ? <p className="rounded-2xl border border-dashed border-border p-4 text-sm leading-7 text-muted">{failed ? "برای نمایش کامل رزروهای این روز، دریافت اطلاعات را دوباره امتحان کن." : "برای این روز رزرو باشگاه یا جلسه مربی ثبت نشده."}</p> : null}
      <div className="flex flex-wrap gap-3"><Link href="/athlete/training" className="min-h-11 rounded-xl bg-surface-secondary px-4 py-3 text-xs font-semibold">برنامه و ثبت تمرین من</Link><Link href="/athlete/classes" className="min-h-11 rounded-xl bg-surface-secondary px-4 py-3 text-xs font-semibold">دوره‌ها و کلاس‌های من</Link></div>
    </section>
  </div>;
}
