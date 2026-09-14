"use client";
import { useBusinessAnalytics } from "@api/admin";
import { Button, Card, Spinner } from "@heroui/react";
import { useState } from "react";
import {
  AnalyticsPeriodControl,
  ProductAnalyticsDashboard,
} from "@repo/ui/product-analytics-dashboard";
export function BusinessAnalyticsSection({ clubId }: { clubId: string }) {
  const [days, setDays] = useState(30),
    [end, setEnd] = useState("");
  const analytics = useBusinessAnalytics(clubId, days, end || undefined);
  return (
    <section className="mt-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">رشد و عملکرد مجموعه</h2>
          <p className="mt-2 text-sm text-muted">
            جذب از اپ، رزروها و مشتریان همین باشگاه
          </p>
        </div>
        <AnalyticsPeriodControl
          days={days}
          onDays={setDays}
          end={end}
          onEnd={setEnd}
        />
      </header>
      {analytics.isPending ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : analytics.isError ? (
        <Card className="mt-4 p-5">
          <p role="alert">
            دریافت آمار ممکن نشد؛ مجوز گزارش‌ها و تاریخ انتخاب‌شده را بررسی
            کنید.
          </p>
          <Button onPress={() => void analytics.refetch()} className="mt-3">
            تلاش دوباره
          </Button>
        </Card>
      ) : analytics.data ? (
        <ProductAnalyticsDashboard data={analytics.data} />
      ) : null}
    </section>
  );
}
