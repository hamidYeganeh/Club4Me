"use client";

import { useCoachBookings } from "@api";
import { trainingApi } from "@api/domains/training";
import { Button } from "@heroui/react";
import Link from "@/components/app-link";
import { CompactCardListSkeleton } from "@/components/loading-skeletons";
import { useNow } from "@/lib/use-now";
import { useTrainingData } from "@modules/training/shared";
import { NextActionCard } from "./NextActionCard";
import { sessionDate, sessionTime } from "./agenda";

export function CoachToday() {
  const bookings = useCoachBookings();
  const clients = useTrainingData("coach-clients", trainingApi.clients);
  const assignments = useTrainingData("coach-assignments", trainingApi.coachAssignments);
  const now = useNow();
  const upcoming = now === null ? [] : (bookings.data?.items ?? []).filter((item) => ["pending", "confirmed"].includes(item.status) && !["failed", "refunded"].includes(item.paymentStatus) && Date.parse(item.sessionEndsAt) > now && !(item.paymentStatus === "pending" && item.paymentExpiresAt && Date.parse(item.paymentExpiresAt) <= now)).sort((a, b) => Date.parse(a.sessionStartsAt) - Date.parse(b.sessionStartsAt));
  const pending = upcoming.filter((item) => item.status === "pending" && ["paid", "not_required"].includes(item.paymentStatus));
  const next = upcoming.find((item) => item.status === "confirmed" && ["paid", "not_required"].includes(item.paymentStatus));
  const active = now === null ? [] : (assignments.data?.items ?? []).filter((item) => item.status === "active" && Date.parse(item.endsAt) > now);
  const unassigned = assignments.data && clients.data ? clients.data.items.filter((client) => !active.some((item) => item.athleteId === client.id)) : [];
  const waiting = active.filter((item) => !item.consentAt);
  const failed = bookings.isError || clients.error || assignments.error;
  const loading = bookings.isPending || now === null;
  return <section className="space-y-4" aria-label="میز کار امروز مربی">
    <div><p className="text-xs text-muted">{now === null ? "امروز" : sessionDate(now)}</p><h1 className="mt-2 text-2xl font-bold">میز کار امروز</h1><p className="mt-2 text-sm leading-7 text-muted">جلسه‌های پیش رو و شاگردهایی که منتظر قدم بعدی‌اند.</p></div>
    {loading ? <CompactCardListSkeleton count={1} /> : <NextActionCard {...(pending.length ? { eyebrow: "نیازمند پاسخ", title: `${pending.length.toLocaleString("fa-IR")} درخواست رزرو منتظر تأیید`, description: "وضعیت درخواست‌ها را مرور کن تا شاگرد بتواند برای جلسه آماده شود.", href: "/coach/reservations", action: "بررسی درخواست‌های رزرو" } : next ? { eyebrow: "جلسه بعدی", title: next.sessionTitle, description: `${sessionDate(next.sessionStartsAt)} · ${sessionTime(next.sessionStartsAt)} تا ${sessionTime(next.sessionEndsAt)}`, href: "/coach/reservations", action: "مدیریت جلسه و حضور" } : unassigned.length ? { eyebrow: "پیگیری شاگردان", title: `${unassigned.length.toLocaleString("fa-IR")} شاگرد بدون برنامه فعال`, description: "برنامه موجود را مرور یا نسخه‌ای مناسب شاگرد آماده کن.", href: "/coach/training", action: "برنامه‌ریزی برای شاگردان" } : { eyebrow: "قدم بعدی", title: "برای جلسه‌های بعد آماده شو", description: "زمان‌های قابل رزرو و خدماتت را مرور کن.", href: "/coach/availability", action: "مدیریت زمان‌های حضور" })} />}
    {failed ? <div role="alert" className="rounded-2xl bg-warning/10 p-4 text-sm leading-7"><p>دریافت بخشی از میز کار انجام نشد؛ تعدادها ممکن است کامل نباشند.</p><Button variant="ghost" size="sm" onPress={() => { void bookings.refetch(); clients.reload(); assignments.reload(); }}>تلاش دوباره</Button></div> : null}
    <div className="grid grid-cols-2 gap-3">
      <Link href="/coach/training" className="rounded-2xl bg-surface p-4"><span className="block text-sm font-semibold">برنامه شاگردان</span><span className="mt-2 block text-xs leading-6 text-muted">{assignments.loading || clients.loading ? "در حال دریافت…" : assignments.error || clients.error ? "بررسی وضعیت برنامه‌ها" : `${unassigned.length.toLocaleString("fa-IR")} بدون برنامه · ${waiting.length.toLocaleString("fa-IR")} منتظر پذیرش`}</span></Link>
      <Link href="/coach/services/new" className="rounded-2xl bg-surface p-4"><span className="block text-sm font-semibold">تعریف خدمت</span><span className="mt-2 block text-xs leading-6 text-muted">جلسه خصوصی، بسته یا خدمت ماهانه</span></Link>
    </div>
  </section>;
}
