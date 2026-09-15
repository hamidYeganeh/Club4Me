"use client";
import { useMemo, useState } from "react";
import { Card } from "@heroui/react";
import { BarChart3, CalendarCheck, Layers3 } from "lucide-react";
import type { Exercise, SessionRecord } from "@api/domains/training";
import { trainingInsights } from "@api/domains/training/insights";
import { FormSelect, FormOption } from "@repo/ui/form-select";
import { date, number } from "./shared";
import { useNow } from "@/lib/use-now";

export function WeeklyTrainingReport({
  sessions,
  exercises = [],
  audience = "athlete",
}: {
  sessions: SessionRecord[];
  exercises?: Exercise[];
  audience?: "athlete" | "coach";
}) {
  const now = useNow();
  const report = useMemo(
    () => trainingInsights(sessions, now ?? 0),
    [sessions, now],
  );
  const [selected, setSelected] = useState("");
  const trend =
    report.trends.find((t) => t.exerciseId === selected) ?? report.trends[0];
  return (
    <Card className="overflow-hidden p-5">
      <Card.Header>
        <p className="text-xs font-medium text-accent">هفت روز اخیر</p>
        <Card.Title>قدم‌هایی که برداشتی</Card.Title>
        <Card.Description>
          فقط تمرین‌های کامل‌شده؛ مقایسه با هفت روز قبل.
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-5">
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: "جلسه",
              value: report.current.sessions,
              icon: CalendarCheck,
            },
            { label: "ست ثبت‌شده", value: report.current.sets, icon: Layers3 },
            {
              label: "جلسه هفته قبل",
              value: report.previous.sessions,
              icon: BarChart3,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-surface-secondary p-3"
            >
              <item.icon size={18} className="mb-3 text-accent" aria-hidden />
              <strong className="block text-2xl tabular-nums">
                {number(item.value)}
              </strong>
              <span className="text-[11px] text-muted">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="rounded-2xl bg-accent/5 p-4 text-sm leading-7">
          {audience === "coach"
            ? report.pendingReviews
              ? "درخواست‌های بازخورد را بررسی کن و برای جلسهٔ بعد هماهنگ شو."
              : report.hardSessions >= 2
                ? "جلسه‌های سخت ثبت‌شده را با ورزشکار مرور کن."
                : "روند ثبت‌ها را همراه یادداشت ورزشکار برای جلسهٔ بعد مرور کن."
            : report.nextStep}
        </p>
        {report.pendingReviews > 0 && (
          <p className="text-xs text-muted">
            {number(report.pendingReviews)} درخواست بازخورد هنوز پاسخ ندارد.
          </p>
        )}
        {trend && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold">
              روند حرکت
              <FormSelect
                aria-label="روند حرکت"
                value={trend.exerciseId}
                onChange={setSelected}
              >
                {report.trends.map((item) => (
                  <FormOption key={item.exerciseId} value={item.exerciseId}>
                    {exercises.find((e) => e.id === item.exerciseId)?.name ??
                      item.exerciseId}
                  </FormOption>
                ))}
              </FormSelect>
            </label>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <caption className="pb-3 text-right text-muted">
                  آخرین ۸ جلسه؛ حجم برابر مجموع وزنه × تکرار ست‌های ثبت‌شده است.
                </caption>
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="py-3">جلسه</th>
                    <th>بیشترین وزنه</th>
                    <th>حجم (کیلوگرم × تکرار)</th>
                  </tr>
                </thead>
                <tbody>
                  {trend.points
                    .slice(-8)
                    .reverse()
                    .map((point, index) => (
                      <tr
                        key={`${point.date}:${index}`}
                        className="border-b border-border/50"
                      >
                        <td className="py-3">{date(point.date)}</td>
                        <td>{number(point.maxWeight)} کیلوگرم</td>
                        <td>{number(point.volume)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
