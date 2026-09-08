"use client";

import {
  useNotificationDeliveryReport,
  useRetryNotificationDelivery,
  type NotificationDeliveryState,
} from "@api";
import { Button, toast } from "@heroui/react";

const labels: Record<NotificationDeliveryState, string> = {
  pending: "در صف",
  processing: "در حال ارسال",
  accepted: "پذیرفته‌شده توسط سرویس",
  skipped: "ارسال غیرفعال یا بدون گیرنده",
  failed: "نیازمند پیگیری",
};

export function NotificationDeliverySection() {
  const report = useNotificationDeliveryReport();
  const retry = useRetryNotificationDelivery();
  return (
    <section
      aria-label="گزارش ارسال اعلان"
      className="mt-6 rounded-2xl border border-border bg-surface p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">ارسال اعلان‌ها</h2>
        <Button
          variant="secondary"
          isPending={report.isFetching}
          onPress={() => void report.refetch()}
        >
          به‌روزرسانی
        </Button>
      </div>
      <p className="mt-2 text-sm text-muted">
        پذیرش سرویس به معنی دیده‌شدن پیام نیست. ارسال ناموفق تا ۸ مرتبه تلاش
        می‌شود.
      </p>
      {report.isPending ? (
        <p role="status" className="mt-4">
          دریافت وضعیت ارسال…
        </p>
      ) : report.isError ? (
        <p role="alert" className="mt-4 text-danger">
          گزارش ارسال دریافت نشد.
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(["pushDelivery", "smsDelivery"] as const).map((channel) => (
              <div key={channel}>
                <h3 className="font-medium">
                  {channel === "pushDelivery" ? "اعلان دستگاه" : "پیامک"}
                </h3>
                <dl>
                  {report.data.counts[channel].map((row) => (
                    <div
                      key={row._id}
                      className="mt-2 flex justify-between gap-3 text-sm"
                    >
                      <dt>{labels[row._id]}</dt>
                      <dd>{row.count.toLocaleString("fa-IR")}</dd>
                    </div>
                  ))}
                </dl>
                {!report.data.counts[channel].length && (
                  <p className="mt-2 text-sm text-muted">
                    هنوز ارسالی ثبت نشده است.
                  </p>
                )}
              </div>
            ))}
          </div>
          {report.data.failed.length > 0 && (
            <ul className="mt-4 divide-y divide-border">
              {report.data.failed.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <span className="text-sm">
                    اعلان {item.id.slice(-8)} ·{" "}
                    {new Intl.DateTimeFormat("fa-IR", {
                      timeZone: "Asia/Tehran",
                      dateStyle: "short",
                    }).format(new Date(item.createdAt))}{" "}
                    ·{" "}
                    {item.pushDelivery?.state === "failed"
                      ? "اعلان دستگاه"
                      : ""}{" "}
                    {item.smsDelivery?.state === "failed" ? "پیامک" : ""}
                  </span>
                  <Button
                    variant="secondary"
                    isDisabled={retry.isPending}
                    onPress={async () => {
                      try {
                        await retry.mutateAsync(item.id);
                        toast.success("برای ارسال مجدد در صف قرار گرفت");
                      } catch {
                        toast.danger("ثبت تلاش مجدد ناموفق بود");
                      }
                    }}
                  >
                    تلاش مجدد ارسال
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
