"use client";

import { useProductAnalytics } from "@api/admin";
import { Card, Chip, Spinner } from "@heroui/react";
import { useState } from "react";

const number = new Intl.NumberFormat("fa-IR");

export function ProductAnalyticsScreen() {
  const [days, setDays] = useState(30);
  const analytics = useProductAnalytics(days);

  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">
              قیف محصول و بازگشت کاربران
            </h1>
            <p className="mt-1 text-sm text-muted">
              کاربران یکتا از کشف باشگاه تا پرداخت و بازگشت هفتگی رزروکنندگان
            </p>
          </div>
          <select
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            <option value={30}>۳۰ روز</option>
            <option value={90}>۹۰ روز</option>
            <option value={180}>۱۸۰ روز</option>
          </select>
        </div>

        {analytics.isPending ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : analytics.isError ? (
          <Card className="mt-6 p-8 text-center text-danger">
            دریافت داده‌های تحلیلی ناموفق بود.
          </Card>
        ) : (
          <>
            <section className="mt-6 grid gap-4 md:grid-cols-4">
              {analytics.data?.funnel.map((stage, index) => (
                <Card
                  key={stage.key}
                  className="rounded-[1.5rem] border border-border bg-surface p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted">{stage.label}</span>
                    <Chip size="sm">مرحله {number.format(index + 1)}</Chip>
                  </div>
                  <strong className="mt-4 block text-3xl">
                    {number.format(stage.users)}
                  </strong>
                  <span className="mt-2 block text-xs text-muted">
                    {number.format(stage.conversionPercent)}٪ از ورودی قیف
                  </span>
                </Card>
              ))}
            </section>

            <Card className="mt-5 overflow-auto rounded-[1.75rem] border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold">Retention cohort هفتگی</h2>
              <table className="mt-4 w-full min-w-[680px] text-sm">
                <thead className="text-muted">
                  <tr>
                    <th className="p-3 text-start">هفته شروع</th>
                    <th className="p-3 text-start">کاربر جدید</th>
                    {[0, 1, 2, 3, 4].map((week) => (
                      <th key={week} className="p-3">
                        هفته {number.format(week)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analytics.data?.cohorts.map((cohort) => (
                    <tr key={cohort.week} className="border-t border-border">
                      <td className="p-3" dir="ltr">
                        {cohort.week}
                      </td>
                      <td className="p-3">{number.format(cohort.users)}</td>
                      {cohort.retention.map((value, index) => (
                        <td key={index} className="p-3 text-center">
                          <span className="inline-block min-w-14 rounded-lg bg-primary/10 px-2 py-1 text-primary">
                            {number.format(value)}٪
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!analytics.data?.cohorts.length ? (
                <p className="py-10 text-center text-muted">
                  هنوز داده رزرو کافی وجود ندارد.
                </p>
              ) : null}
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
