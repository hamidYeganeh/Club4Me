"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, toast, Typography } from "@heroui/react";
import { useCreateCoachClass, useGenerateCoachClassSchedule } from "@api";
import { usePublicCatalogResource } from "@api/discovery";

import { DiscoveryPageHeader } from "@modules/discovery/components/DiscoveryPageHeader";

const input =
  "h-12 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm outline-none focus:border-accent";

export function CoachClassFormScreen() {
  const router = useRouter();
  const sports = usePublicCatalogResource("sports", "sport");
  const create = useCreateCoachClass();
  const schedule = useGenerateCoachClassSchedule();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sportId, setSportId] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<
    "club" | "online" | "home" | "outdoor"
  >("club");
  const [capacity, setCapacity] = useState(10);
  const [price, setPrice] = useState(0);
  const [courseStartAt, setCourseStartAt] = useState("");
  const [courseEndAt, setCourseEndAt] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("18:00");
  const [durationMinutes, setDurationMinutes] = useState(60);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!daysOfWeek.length) {
      toast.danger("حداقل یک روز هفته را انتخاب کنید");
      return;
    }
    try {
      const start = new Date(courseStartAt);
      const end = new Date(courseEndAt);
      const item = await create.mutateAsync({
        title,
        description,
        sportId,
        coachAssignments: [],
        deliveryMode,
        capacity,
        courseStartAt: start.toISOString(),
        courseEndAt: end.toISOString(),
        price: { amount: price, currency: "IRR" },
        enrollmentMode: "automatic",
        galleryMediaIds: [],
        tags: [],
        prerequisites: [],
        requiredEquipmentIds: [],
        amenityIds: [],
      });
      const [hour, minute] = startTime.split(":").map(Number);
      await schedule.mutateAsync({
        classId: item.id,
        timezone: "Asia/Tehran",
        daysOfWeek,
        startMinute: (hour ?? 0) * 60 + (minute ?? 0),
        durationMinutes,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        repeatEveryWeeks: 1,
      });
      toast.success("کلاس و برنامه جلسات ساخته شد");
      router.replace("/coach");
    } catch {
      toast.danger("ساخت کلاس ناموفق بود؛ اطلاعات را بررسی کنید");
    }
  };

  return (
    <main className="min-h-dvh px-5 pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <DiscoveryPageHeader
        title="کلاس جدید"
        description="اطلاعات پایه و برنامه هفتگی کلاس را وارد کنید."
      />
      <Card className="rounded-3xl bg-surface p-5 shadow-none">
        <form className="space-y-4" onSubmit={submit}>
          <Field label="نام کلاس">
            <input
              required
              minLength={2}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={input}
            />
          </Field>
          <Field label="توضیحات">
            <textarea
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`${input} min-h-28 py-3`}
            />
          </Field>
          <Field label="رشته ورزشی">
            <select
              required
              value={sportId}
              onChange={(event) => setSportId(event.target.value)}
              className={input}
            >
              <option value="">انتخاب رشته</option>
              {(sports.data?.items ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="شیوه برگزاری">
              <select
                value={deliveryMode}
                onChange={(event) =>
                  setDeliveryMode(event.target.value as typeof deliveryMode)
                }
                className={input}
              >
                <option value="club">در باشگاه</option>
                <option value="online">آنلاین</option>
                <option value="home">منزل ورزشکار</option>
                <option value="outdoor">فضای باز</option>
              </select>
            </Field>
            <Field label="ظرفیت">
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(event) => setCapacity(Number(event.target.value))}
                className={input}
              />
            </Field>
          </div>
          <Field label="هزینه (ریال)">
            <input
              type="number"
              min={0}
              value={price}
              onChange={(event) => setPrice(Number(event.target.value))}
              className={input}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="شروع دوره">
              <input
                required
                type="datetime-local"
                value={courseStartAt}
                onChange={(event) => setCourseStartAt(event.target.value)}
                className={input}
              />
            </Field>
            <Field label="پایان دوره">
              <input
                required
                type="datetime-local"
                value={courseEndAt}
                onChange={(event) => setCourseEndAt(event.target.value)}
                className={input}
              />
            </Field>
          </div>
          <Field label="روزهای برگزاری">
            <div className="flex flex-wrap gap-2">
              {[
                "یکشنبه",
                "دوشنبه",
                "سه‌شنبه",
                "چهارشنبه",
                "پنجشنبه",
                "جمعه",
                "شنبه",
              ].map((label, day) => (
                <Button
                  key={label}
                  type="button"
                  size="sm"
                  variant={daysOfWeek.includes(day) ? "primary" : "secondary"}
                  onPress={() =>
                    setDaysOfWeek((items) =>
                      items.includes(day)
                        ? items.filter((item) => item !== day)
                        : [...items, day],
                    )
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ساعت شروع">
              <input
                required
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className={input}
              />
            </Field>
            <Field label="مدت جلسه">
              <input
                type="number"
                min={15}
                max={480}
                value={durationMinutes}
                onChange={(event) =>
                  setDurationMinutes(Number(event.target.value))
                }
                className={input}
              />
            </Field>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isPending={create.isPending || schedule.isPending}
          >
            ساخت کلاس
          </Button>
        </form>
      </Card>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <Typography type="body-sm" weight="bold">
        {label}
      </Typography>
      {children}
    </label>
  );
}
