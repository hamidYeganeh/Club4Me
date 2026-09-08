"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Spinner, toast } from "@heroui/react";
import {
  useCoachBookingRescheduleOptions,
  useRescheduleCoachBooking,
} from "@api";

export function RescheduleCoachBookingForm({
  bookingId,
  onDone,
}: {
  bookingId: string;
  onDone?: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const options = useCoachBookingRescheduleOptions(bookingId);
  const mutation = useRescheduleCoachBooking();
  const [sessionId, setSessionId] = useState("");
  const [idempotencyKey] = useState(
    () => `coach-reschedule-${crypto.randomUUID()}`,
  );
  useEffect(() => {
    root.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const submit = async () => {
    if (!sessionId) return;
    try {
      await mutation.mutateAsync({ bookingId, sessionId, idempotencyKey });
      toast.success("زمان جلسه تغییر کرد");
      onDone?.();
    } catch (error) {
      toast.danger(
        error instanceof Error ? error.message : "تغییر زمان انجام نشد",
      );
      void options.refetch();
    }
  };

  return (
    <section
      ref={root}
      className="app-card space-y-4 rounded-[1.5rem] p-5"
      aria-label="تغییر زمان جلسه مربی"
    >
      <div>
        <h2 className="font-black">انتخاب سانس جایگزین</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          هزینه و اعتبار بسته حفظ می‌شود و ظرفیت سانس قبلی آزاد خواهد شد.
        </p>
      </div>
      {options.isPending ? (
        <div className="grid min-h-28 place-items-center">
          <Spinner />
        </div>
      ) : options.isError ? (
        <Button variant="outline" onPress={() => void options.refetch()}>
          تلاش دوباره
        </Button>
      ) : options.data?.items.length ? (
        <div className="grid gap-2">
          {options.data.items.map((item) => {
            const selected = item.id === sessionId;
            const label = new Intl.DateTimeFormat("fa-IR", {
              timeZone: "Asia/Tehran",
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(item.startAt));
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setSessionId(item.id)}
                className={`min-h-16 rounded-2xl border px-4 text-start transition ${
                  selected
                    ? "border-accent bg-accent/8 text-accent"
                    : "border-border bg-surface"
                }`}
              >
                <span className="block font-bold">{item.title}</span>
                <span className="mt-1 block text-sm">{label}</span>
                <span className="mt-1 block text-xs text-muted">
                  {item.remainingCapacity.toLocaleString("fa-IR")} ظرفیت
                  باقی‌مانده
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="rounded-2xl bg-surface-secondary p-4 text-sm text-muted">
          فعلاً سانس جایگزین دارای ظرفیت وجود ندارد.
        </p>
      )}
      <Button
        variant="primary"
        className="w-full font-bold"
        isDisabled={!sessionId}
        isPending={mutation.isPending}
        onPress={() => void submit()}
      >
        تأیید تغییر زمان
      </Button>
    </section>
  );
}
