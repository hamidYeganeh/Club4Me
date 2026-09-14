"use client";
import { useProductAnalytics } from "@api/admin";
import { Card, Button, Spinner } from "@heroui/react";
import { useState } from "react";
import {
  AnalyticsPeriodControl,
  ProductAnalyticsDashboard,
} from "@repo/ui/product-analytics-dashboard";
export function ProductAnalyticsScreen() {
  const [days, setDays] = useState(30),
    [end, setEnd] = useState("");
  const analytics = useProductAnalytics(days, end || undefined);
  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">آمار و رشد محصول</h1>
            <p className="mt-2 text-sm text-muted">
              از اولین بازدید تا رزرو، درآمد و بازگشت مشتری
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
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : analytics.isError ? (
          <Card className="mt-6 p-6">
            <p role="alert">
              گزارش دریافت نشد. تاریخ پایان باید در ۹۰ روز اخیر باشد.
            </p>
            <Button onPress={() => void analytics.refetch()} className="mt-3">
              تلاش دوباره
            </Button>
          </Card>
        ) : analytics.data ? (
          <ProductAnalyticsDashboard data={analytics.data} />
        ) : null}
      </div>
    </main>
  );
}
