"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card } from "@heroui/react";
import { Footprints, RefreshCw } from "lucide-react";
import {
  activityAvailability,
  activityError,
  authorizeActivity,
  readActivityWeek,
  type ActivityAvailability,
  type ActivityDay,
} from "@/lib/activity-health";

export function ActivityHealthCard() {
  const [availability, setAvailability] = useState<ActivityAvailability | null>(
    null,
  );
  const [enabled, setEnabled] = useState(false);
  const [days, setDays] = useState<ActivityDay[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const pending = useRef(false);
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  useEffect(() => {
    let cancelled = false;
    void activityAvailability()
      .then((result) => {
        if (!cancelled) setAvailability(result);
      })
      .catch(() => {
        if (!cancelled) setAvailability({ available: false, provider: "web" });
      });
    return () => {
      cancelled = true;
      invalidate();
    };
  }, [invalidate]);
  const refresh = useCallback(async (requestAccess = false) => {
    if (pending.current) return;
    const current = generation.current;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      if (requestAccess) await authorizeActivity();
      const result = await readActivityWeek();
      if (current !== generation.current) return;
      setDays(result);
      setUpdatedAt(Date.now());
      setEnabled(true);
    } catch (failure) {
      if (current !== generation.current) return;
      setError(activityError(failure));
      if ((failure as { code?: string })?.code === "HEALTH_DENIED") {
        setDays([]);
        setEnabled(false);
        setUpdatedAt(null);
      }
    } finally {
      if (current === generation.current) {
        pending.current = false;
        setBusy(false);
      }
    }
  }, []);
  useEffect(() => {
    if (!enabled) return;
    const update = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [enabled, refresh]);
  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-3">
        <Footprints className="text-accent" size={24} aria-hidden />
        <h2 className="font-bold">قدم‌های روزانه</h2>
      </div>
      <p className="text-sm leading-7 text-muted">
        با اجازهٔ تو، مجموع قدم‌های هفت روز اخیر روی همین دستگاه نمایش داده
        می‌شود. داده به سرور، مربی یا باشگاه فرستاده نمی‌شود.
      </p>
      {availability === null ? (
        <p role="status" className="text-sm text-muted">
          بررسی دسترسی دستگاه…
        </p>
      ) : !availability.available ? (
        <p className="text-sm leading-7 text-muted">
          این قابلیت به نسخهٔ نصب‌شدهٔ اپ با HealthKit در iOS یا Health Connect
          در Android 14 و بالاتر نیاز دارد. ثبت دستی عادت‌ها همچنان در دسترس
          است.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted">
            منبع:{" "}
            {availability.provider === "healthkit"
              ? "Apple Health"
              : "Health Connect"}{" "}
            · روزها به وقت تهران
          </p>
          {!enabled ? (
            <Button isPending={busy} onPress={() => void refresh(true)}>
              اجازه و نمایش قدم‌ها
            </Button>
          ) : (
            <>
              <div className="space-y-2" aria-label="قدم‌های هفت روز اخیر">
                {days.map((day, index) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-surface-secondary p-3"
                  >
                    <span className="text-sm">
                      {index === days.length - 1
                        ? "امروز"
                        : new Date(
                            `${day.date}T12:00:00+03:30`,
                          ).toLocaleDateString("fa-IR", {
                            timeZone: "Asia/Tehran",
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                    </span>
                    <strong className="tabular-nums">
                      {day.steps === null
                        ? "—"
                        : `${day.steps.toLocaleString("fa-IR")} قدم`}
                    </strong>
                  </div>
                ))}
              </div>
              <p className="text-xs leading-6 text-muted">
                خط تیره یعنی داده قابل خواندن نیست؛ ممکن است قدمی ثبت نشده یا
                مجوز خواندن داده نشده باشد. تا وقتی این صفحه باز و فعال است،
                داده تقریباً هر دقیقه تازه می‌شود.
              </p>
              {updatedAt ? (
                <p className="text-xs text-muted">
                  آخرین دریافت:{" "}
                  {new Date(updatedAt).toLocaleTimeString("fa-IR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  isPending={busy}
                  onPress={() => void refresh()}
                >
                  <RefreshCw size={16} />
                  تازه‌سازی
                </Button>
                <Button
                  variant="ghost"
                  onPress={() => {
                    generation.current++;
                    pending.current = false;
                    setBusy(false);
                    setEnabled(false);
                    setDays([]);
                    setUpdatedAt(null);
                    setError("");
                  }}
                >
                  توقف نمایش
                </Button>
              </div>
            </>
          )}
          <p className="text-xs leading-6 text-muted">
            برای لغو مجوز، تنظیمات سلامت دستگاه را باز کن. بستن صفحه یا «توقف
            نمایش» خواندن دوره‌ای را متوقف می‌کند؛ هیچ داده‌ای در سرویس سلامت
            تغییر نمی‌کند.
          </p>
        </>
      )}
      {error ? (
        <p role="alert" className="text-sm leading-6 text-danger">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
