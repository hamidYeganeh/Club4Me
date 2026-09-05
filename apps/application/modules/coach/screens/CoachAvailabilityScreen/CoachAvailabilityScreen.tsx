"use client";

import { useEffect, useState } from "react";
import { Button, Card, Spinner, toast } from "@heroui/react";
import {
  useAddCoachAvailabilityException,
  useCoachAvailability,
  useReplaceCoachAvailability,
} from "@api";
import {
  AvailabilityScheduler,
  DAY_KEY_TO_DOW,
  DOW_TO_DAY_KEY,
  defaultWeek,
  type WeekAvailability,
} from "@ui/availability-scheduler";

import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";

export function CoachAvailabilityScreen() {
  const availability = useCoachAvailability();
  const replace = useReplaceCoachAvailability();
  const addException = useAddCoachAvailabilityException();
  const [week, setWeek] = useState<WeekAvailability>(() => defaultWeek());
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");

  useEffect(() => {
    if (!availability.data) return;
    const next = defaultWeek();
    for (const rule of availability.data.rules) {
      const key = DOW_TO_DAY_KEY[rule.dayOfWeek];
      if (!key) continue;
      next[key] = {
        enabled: true,
        ranges: [
          ...next[key].ranges,
          {
            id: rule.id,
            start: minutesToTime(rule.startMinute),
            end: minutesToTime(rule.endMinute),
          },
        ],
      };
    }
    const frame = requestAnimationFrame(() => setWeek(next));
    return () => cancelAnimationFrame(frame);
  }, [availability.data]);

  const save = async () => {
    const validFrom = new Date().toISOString().slice(0, 10);
    const rules = Object.entries(week).flatMap(([key, day]) =>
      day.enabled
        ? day.ranges.map((range) => ({
            dayOfWeek: DAY_KEY_TO_DOW[key as keyof WeekAvailability],
            startMinute: timeToMinutes(range.start),
            endMinute: timeToMinutes(range.end),
            deliveryModes: ["online", "in_person"] as Array<
              "online" | "in_person"
            >,
            clubId: null,
            validFrom,
            validUntil: null,
          }))
        : [],
    );
    try {
      await replace.mutateAsync(rules);
      toast.success("برنامه دسترسی ذخیره شد");
    } catch {
      toast.danger("ذخیره برنامه انجام نشد");
    }
  };

  const blockDate = async () => {
    if (!exceptionDate) return;
    try {
      await addException.mutateAsync({
        date: exceptionDate,
        type: "unavailable",
        reason: exceptionReason || undefined,
      });
      setExceptionDate("");
      setExceptionReason("");
      toast.success("روز استثنا ثبت شد");
    } catch {
      toast.danger("ثبت روز استثنا انجام نشد");
    }
  };

  return (
    <main className="app-page gap-5">
      <SecondaryHeader title="زمان‌های در دسترس" />
      {availability.isPending ? (
        <div className="grid min-h-64 place-items-center"><Spinner /></div>
      ) : (
        <>
          <Card className="app-card rounded-3xl p-5 shadow-none">
            <Card.Title>برنامه هفتگی</Card.Title>
            <p className="mt-2 text-xs leading-6 text-muted">روزها و بازه‌هایی را که امکان پذیرش رزرو دارید مشخص کنید.</p>
            <AvailabilityScheduler value={week} onChange={setWeek} className="mt-4" />
            <Button className="mt-5 w-full" variant="primary" isPending={replace.isPending} onPress={() => void save()}>
              ذخیره برنامه
            </Button>
          </Card>
          <Card className="app-card rounded-3xl p-5 shadow-none">
            <Card.Title>روز تعطیل یا استثنا</Card.Title>
            <div className="mt-4 grid gap-3">
              <input type="date" value={exceptionDate} onChange={(event) => setExceptionDate(event.target.value)} className="h-12 rounded-xl border border-border bg-surface-secondary px-3" />
              <input value={exceptionReason} onChange={(event) => setExceptionReason(event.target.value)} placeholder="دلیل (اختیاری)" className="h-12 rounded-xl border border-border bg-surface-secondary px-3" />
              <Button variant="secondary" isPending={addException.isPending} isDisabled={!exceptionDate} onPress={() => void blockDate()}>
                ثبت روز غیرقابل رزرو
              </Button>
            </div>
            {availability.data?.exceptions.length ? (
              <div className="mt-4 space-y-2 text-sm text-muted">
                {availability.data.exceptions.map((item) => <p key={item.id}>{new Date(item.date).toLocaleDateString("fa-IR")} {item.reason ? `— ${item.reason}` : ""}</p>)}
              </div>
            ) : null}
          </Card>
        </>
      )}
    </main>
  );
}

function minutesToTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function timeToMinutes(value: string) {
  const [hour = 0, minute = 0] = value.split(":").map(Number);
  return hour * 60 + minute;
}
