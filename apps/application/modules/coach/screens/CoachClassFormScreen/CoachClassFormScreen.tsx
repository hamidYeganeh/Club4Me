"use client";

import { FormSelect, FormOption } from "@repo/ui/form-select";
import { Input as HeroInput, TextArea as HeroTextArea } from "@heroui/react";
import { Counter } from "@/components/counter";
import { ResourceUnavailablePage } from "@/components/resource-unavailable-page";

import { IranDateInput } from "@repo/ui/iran-date-input";
import { tehranLocalDate, tehranLocalValue } from "@repo/ui/iran-date";
import {
  FormSectionNavigation,
  FormSectionHeading,
} from "@/components/form-section-navigation";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, toast, Typography, Spinner } from "@heroui/react";
import {
  useCreateCoachClass,
  useGenerateCoachClassSchedule,
  useCoachClass,
  useUpdateCoachClass,
} from "@api";
import { usePublicCatalogResource } from "@api/discovery";

import { DiscoveryPageHeader } from "@modules/discovery/components/DiscoveryPageHeader";

const input =
  "h-12 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm outline-none focus:border-accent";
const parseFaqRows = (value: string) =>
  value
    .split("\n")
    .map((row) => row.split("|").map((part) => part.trim()))
    .filter(([question, answer]) => Boolean(question && answer))
    .map(([question, answer]) => ({ question: question!, answer: answer! }));

export function CoachClassFormScreen({ classId = "" }: { classId?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const existing = useCoachClass(classId);
  const update = useUpdateCoachClass(classId);
  const [hydrated, setHydrated] = useState("");
  const needsSchedule = !classId || params.get("schedule") === "1";
  const levels = usePublicCatalogResource("sports", "skill-level");
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
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(() =>
    (params.get("days") ?? "")
      .split(",")
      .filter(Boolean)
      .map(Number)
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
  );
  const [startTime, setStartTime] = useState(
    /^([01]\d|2[0-3]):[0-5]\d$/.test(params.get("time") ?? "")
      ? params.get("time")!
      : "18:00",
  );
  const [durationMinutes, setDurationMinutes] = useState(
    Math.min(720, Math.max(15, Number(params.get("duration")) || 60)),
  );
  const [faqs, setFaqs] = useState("");
  const [address, setAddress] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");
  const [skillLevelId, setSkillLevelId] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [registrationStartAt, setRegistrationStartAt] = useState("");
  const [registrationEndAt, setRegistrationEndAt] = useState("");
  const [enrollmentMode, setEnrollmentMode] = useState<
    "automatic" | "requires_approval"
  >("automatic");
  const [prerequisites, setPrerequisites] = useState("");
  useEffect(() => {
    const item = existing.data;
    if (
      !item ||
      !existing.isFetchedAfterMount ||
      existing.isFetching ||
      existing.isError ||
      hydrated === item.id
    )
      return;
    const frame = requestAnimationFrame(() => {
      setHydrated(item.id);
      setTitle(item.title);
      setDescription(item.description);
      setSportId(item.sportId);
      setDeliveryMode(item.deliveryMode);
      setCapacity(item.capacity);
      setPrice(item.price.amount);
      setCourseStartAt(localDateTime(item.courseStartAt));
      setCourseEndAt(localDateTime(item.courseEndAt));
      setFaqs(
        item.faqs.map((item) => `${item.question} | ${item.answer}`).join("\n"),
      );
      setAddress(item.venue?.address ?? "");
      setOnlineUrl(item.venue?.onlineUrl ?? "");
      setSkillLevelId(item.skillLevelId ?? "");
      setMinAge(item.minAge == null ? "" : String(item.minAge));
      setMaxAge(item.maxAge == null ? "" : String(item.maxAge));
      setRegistrationStartAt(localDateTime(item.registrationStartAt));
      setRegistrationEndAt(localDateTime(item.registrationEndAt));
      setEnrollmentMode(item.enrollmentMode);
      setPrerequisites(item.prerequisites.join("\n"));
    });
    return () => cancelAnimationFrame(frame);
  }, [
    existing.data,
    existing.isFetchedAfterMount,
    existing.isFetching,
    existing.isError,
    hydrated,
  ]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (create.isPending || update.isPending || schedule.isPending) return;
    if (needsSchedule && !daysOfWeek.length) {
      toast.danger("حداقل یک روز هفته را انتخاب کنید");
      return;
    }
    let savedId: string | undefined;
    try {
      const start = tehranLocalDate(courseStartAt);
      const end = tehranLocalDate(courseEndAt);
      const payload = {
        title,
        description,
        sportId,
        deliveryMode,
        capacity,
        courseStartAt: start.toISOString(),
        courseEndAt: end.toISOString(),
        price: {
          amount: price,
          currency: existing.data?.price.currency ?? "IRR",
        },
        enrollmentMode,
        venue: {
          ...existing.data?.venue,
          address: address || undefined,
          onlineUrl: onlineUrl || undefined,
        },
        skillLevelId: skillLevelId || null,
        minAge: minAge ? Number(minAge) : null,
        maxAge: maxAge ? Number(maxAge) : null,
        registrationStartAt: registrationStartAt
          ? tehranLocalDate(registrationStartAt).toISOString()
          : null,
        registrationEndAt: registrationEndAt
          ? tehranLocalDate(registrationEndAt).toISOString()
          : null,
        prerequisites: prerequisites
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        faqs: parseFaqRows(faqs),
      };
      const item = classId
        ? await update.mutateAsync(payload)
        : await create.mutateAsync({
            coachAssignments: [],
            galleryMediaIds: [],
            tags: [],
            requiredEquipmentIds: [],
            amenityIds: [],
            ...payload,
          });
      savedId = item.id;
      if (needsSchedule) {
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
      }
      toast.success(
        needsSchedule
          ? "کلاس و برنامه جلسات ذخیره شد"
          : "اطلاعات کلاس ذخیره شد",
      );
      router.replace("/coach");
    } catch {
      if (savedId && !classId) {
        const retry = new URLSearchParams({
          schedule: "1",
          days: daysOfWeek.join(","),
          time: startTime,
          duration: String(durationMinutes),
        });
        router.replace(`/coach/classes/${savedId}/edit?${retry}`);
      }
      toast.danger(
        savedId && needsSchedule
          ? "کلاس ذخیره شد، اما برنامه جلسات ساخته نشد. برنامه را اصلاح و دوباره ثبت کنید."
          : "ذخیره کلاس انجام نشد؛ اطلاعات را بررسی کنید",
      );
    }
  };

  if (
    classId &&
    !existing.isError &&
    (existing.isPending || (existing.data && hydrated !== classId))
  )
    return (
      <div className="grid min-h-64 place-items-center">
        <Spinner />
      </div>
    );
  if (classId && existing.isError && hydrated !== classId)
    return (
      <ResourceUnavailablePage
        title="ویرایش کلاس"
        onRetry={() => void existing.refetch()}
      />
    );
  return (
    <main className="app-page gap-5">
      <DiscoveryPageHeader
        title={classId ? "ویرایش کلاس" : "کلاس جدید"}
        description="اطلاعات پایه و برنامه هفتگی کلاس را وارد کنید."
      />
      <FormSectionNavigation
        sections={[
          { id: "class-basics", title: "معرفی" },
          { id: "class-admission", title: "شرایط حضور" },
          { id: "class-schedule", title: "زمان و هزینه" },
        ]}
      />
      <Card className="app-card coach-editor p-5 shadow-none">
        <form className="space-y-4" onSubmit={submit}>
          <FormSectionHeading
            id="class-basics"
            title="کلاس را معرفی کنید"
            description="نام و توضیحات روشن به انتخاب ورزشکار کمک می‌کند."
          />
          <Field label="نام کلاس">
            <HeroInput
              required
              minLength={2}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={input}
            />
          </Field>
          <Field label="توضیحات">
            <HeroTextArea
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`${input} min-h-28 py-3`}
            />
          </Field>
          <Field label="رشته ورزشی">
            <FormSelect
              aria-label="انتخاب گزینه"
              required
              value={sportId}
              onChange={(event) => setSportId(event)}
              className={input}
            >
              <FormOption value="">انتخاب رشته</FormOption>
              {(sports.data?.items ?? []).map((item) => (
                <FormOption entity={item} key={item.id} value={item.id}>
                  {item.name}
                </FormOption>
              ))}
            </FormSelect>
          </Field>
          <Field label="سوالات متداول">
            <HeroTextArea
              value={faqs}
              onChange={(event) => setFaqs(event.target.value)}
              className={`${input} min-h-24 py-3`}
              placeholder="هر خط: سوال | پاسخ"
            />
          </Field>
          <FormSectionHeading
            id="class-admission"
            title="شرایط حضور"
            description="محل، ظرفیت و شرایط ثبت‌نام را مشخص کنید."
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="شیوه برگزاری">
              <FormSelect
                aria-label="انتخاب گزینه"
                value={deliveryMode}
                onChange={(event) =>
                  setDeliveryMode(event as typeof deliveryMode)
                }
                className={input}
              >
                <FormOption value="club">در باشگاه</FormOption>
                <FormOption value="online">آنلاین</FormOption>
                <FormOption value="home">منزل ورزشکار</FormOption>
                <FormOption value="outdoor">فضای باز</FormOption>
              </FormSelect>
            </Field>
            <Field label="ظرفیت">
              <Counter
                aria-label="ظرفیت"
                min={1}
                value={capacity}
                onChange={(event) => setCapacity(Number(event.target.value))}
                className={input}
              />
            </Field>
          </div>
          <Field
            label={
              deliveryMode === "online"
                ? "پیوند جلسه آنلاین"
                : "نشانی محل برگزاری"
            }
          >
            <HeroInput
              className={input}
              type={deliveryMode === "online" ? "url" : "text"}
              value={deliveryMode === "online" ? onlineUrl : address}
              onChange={(event) =>
                deliveryMode === "online"
                  ? setOnlineUrl(event.target.value)
                  : setAddress(event.target.value)
              }
            />
          </Field>
          <Field label="سطح کلاس">
            <FormSelect
              aria-label="انتخاب گزینه"
              className={input}
              value={skillLevelId}
              onChange={(event) => setSkillLevelId(event)}
            >
              <FormOption value="">همه سطوح</FormOption>
              {levels.data?.items.map((item) => (
                <FormOption entity={item} key={item.id} value={item.id}>
                  {item.name}
                </FormOption>
              ))}
            </FormSelect>
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="حداقل سن (اختیاری)">
              <Counter
                aria-label="حداقل سن (اختیاری)"
                className={input}

                min={0}
                max={120}
                value={minAge}
                onChange={(event) => setMinAge(event.target.value)}
              />
            </Field>
            <Field label="حداکثر سن (اختیاری)">
              <Counter
                aria-label="حداکثر سن (اختیاری)"
                className={input}

                min={minAge || 0}
                max={120}
                value={maxAge}
                onChange={(event) => setMaxAge(event.target.value)}
              />
            </Field>
          </div>
          <Field label="شیوه پذیرش">
            <FormSelect
              aria-label="انتخاب گزینه"
              className={input}
              value={enrollmentMode}
              onChange={(event) =>
                setEnrollmentMode(event as typeof enrollmentMode)
              }
            >
              <FormOption value="automatic">پذیرش خودکار</FormOption>
              <FormOption value="requires_approval">
                نیازمند تأیید مربی
              </FormOption>
            </FormSelect>
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="شروع ثبت‌نام">
              <IranDateInput
                className={input}
                withTime
                value={registrationStartAt}
                onValueChange={(dateValue) => setRegistrationStartAt(dateValue)}
              />
            </Field>
            <Field label="پایان ثبت‌نام">
              <IranDateInput
                className={input}
                withTime
                min={registrationStartAt || undefined}
                value={registrationEndAt}
                onValueChange={(dateValue) => setRegistrationEndAt(dateValue)}
              />
            </Field>
          </div>
          <Field label="پیش‌نیازها (هر مورد یک خط)">
            <HeroTextArea
              className={`${input} min-h-24 py-3`}
              value={prerequisites}
              onChange={(event) => setPrerequisites(event.target.value)}
            />
          </Field>
          <FormSectionHeading
            id="class-schedule"
            title="برنامه و هزینه"
            description="پیش از ذخیره، تاریخ دوره و ساعت جلسات را بررسی کنید."
          />
          <Field label="هزینه (ریال)">
            <Counter
              aria-label="هزینه (ریال)"
              min={0}
              value={price}
              onChange={(event) => setPrice(Number(event.target.value))}
              className={input}
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="شروع دوره">
              <IranDateInput
                required
                withTime
                value={courseStartAt}
                onValueChange={(dateValue) => setCourseStartAt(dateValue)}
                className={input}
              />
            </Field>
            <Field label="پایان دوره">
              <IranDateInput
                required
                withTime
                value={courseEndAt}
                onValueChange={(dateValue) => setCourseEndAt(dateValue)}
                className={input}
              />
            </Field>
          </div>
          {needsSchedule ? (
            <>
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
                      variant={
                        daysOfWeek.includes(day) ? "primary" : "secondary"
                      }
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="ساعت شروع">
                  <HeroInput
                    required
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className={input}
                  />
                </Field>
                <Field label="مدت جلسه">
                  <Counter
                    aria-label="مدت جلسه"
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
            </>
          ) : (
            <p className="text-sm text-muted">
              زمان جلسات موجود از بخش تقویم مربی تغییر می‌کند.
            </p>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isPending={
              create.isPending || update.isPending || schedule.isPending
            }
          >
            {classId ? "ذخیره تغییرات" : "ساخت کلاس"}
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

const localDateTime = tehranLocalValue;
