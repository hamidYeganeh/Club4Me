"use client";

import { Checkbox as HeroCheckbox } from "@heroui/react";
import { TextArea as HeroTextArea } from "@heroui/react";
import { Counter } from "@/components/counter";
import { useEffect, useState } from "react";
import { Button, Card } from "@heroui/react";
import {
  trainingApi,
  type Assignment,
  type SessionRecord,
} from "@api/domains/training";
import {
  date,
  errorText,
  fieldClass,
  LoadState,
  Notice,
  number,
  TrainingFrame,
  useIdentity,
  useTrainingData,
  weekdays,
} from "./shared";
import {
  ExerciseRow,
  FeatureBadge,
  featureCardStyles,
} from "@/components/ui/feature-cards";
import { Play } from "lucide-react";
import { useWorkouts } from "./useWorkouts";

export function AthleteTraining() {
  const identity = useIdentity();
  return <AthleteTrainingSession key={identity} />;
}
function AthleteTrainingSession() {
  const assignments = useTrainingData(
    "assignments",
    trainingApi.assignments,
    true,
  );
  const exercises = useTrainingData("exercises", trainingApi.exercises, true);
  const logs = useWorkouts();
  const [message, setMessage] = useState("");
  const [accepting, setAccepting] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const active = logs.workouts.find((w) => w.session.status === "active");
  const pending = logs.workouts.filter((w) => w.dirty || w.pending).length;
  const consent = async (a: Assignment, accepted: boolean) => {
    setAccepting(a.id);
    setMessage("");
    try {
      await trainingApi.consent(a.id, accepted);
      assignments.reload();
    } catch (e) {
      setMessage(errorText(e));
    } finally {
      setAccepting(null);
    }
  };
  const start = async (a: Assignment, dayId: string) => {
    if (active) return;
    const day = a.snapshot.days.find((d) => d.id === dayId)!;
    const session: SessionRecord = {
      clientId: crypto.randomUUID(),
      revision: 0,
      assignmentId: a.id,
      snapshot: a.snapshot,
      dayId,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      status: "active",
      note: "",
      sets: day.exercises.flatMap((e, exerciseIndex) =>
        Array.from({ length: e.sets }, (_, setIndex) => ({
          exerciseIndex,
          setIndex,
          reps: e.reps,
          weight: e.weight,
          done: false,
        })),
      ),
    };
    if (await logs.save(session)) void logs.sync();
  };
  const backup = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(logs.workouts, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "gym4me-workout-backup.json";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <TrainingFrame title="تمرین من">
      <Card className="p-5">
        <Card.Header>
          <Card.Title>
            {active ? "تمرینت منتظر توست" : "قدم بعدی، یک تمرین خوب"}
          </Card.Title>
          <Card.Description>
            ثبت هر ست روی این دستگاه ذخیره می‌شود؛ پس از اتصال، همگام‌سازی کن.
          </Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-wrap items-center gap-3">
          <span role="status" className="text-sm text-muted">
            {pending
              ? `${number(pending)} جلسه در انتظار همگام‌سازی`
              : "همه ثبت‌های محلی همگام‌اند"}
          </span>
          <Button
            variant="secondary"
            isDisabled={!logs.ready || logs.busy}
            onPress={() => void logs.sync()}
          >
            همگام‌سازی
          </Button>
          {logs.workouts.length > 0 && (
            <Button variant="tertiary" onPress={backup}>
              نسخه پشتیبان
            </Button>
          )}
        </Card.Content>
      </Card>
      {(logs.error || message) && <Notice>{logs.error || message}</Notice>}
      {logs.conflict && (
        <Notice>
          نسخه دیگری روی سرور ذخیره شده است. ثبت محلی حفظ شده؛ پیش از جایگزینی،
          نسخه پشتیبان بگیر.
          <Button
            isDisabled={logs.busy}
            variant="danger"
            onPress={() => void logs.resolve()}
          >
            دریافت نسخه سرور
          </Button>
        </Notice>
      )}
      {active && (
        <section aria-label="جلسه فعال" className="space-y-4">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="text-xs text-muted">
                جلسه فعال · {date(active.session.startedAt)}
              </p>
              <h2 className="text-xl font-bold">
                {active.session.snapshot.title} /{" "}
                {
                  active.session.snapshot.days.find(
                    (d) => d.id === active.session.dayId,
                  )?.title
                }
              </h2>
            </div>
            <p
              aria-live="off"
              className="rounded-xl bg-accent-soft p-3 tabular-nums"
            >
              {active.restUntil && active.restUntil > now
                ? `استراحت: ${number(Math.ceil((active.restUntil - now) / 1000))} ثانیه`
                : "آماده ست بعدی"}
            </p>
          </div>
          {active.session.snapshot.days
            .find((d) => d.id === active.session.dayId)
            ?.exercises.map((e, index) => (
              <Card key={index} className="p-5">
                <Card.Header>
                  <p className="text-xs text-muted">
                    حرکت {number(index + 1)} · استراحت {number(e.restSeconds)}{" "}
                    ثانیه
                  </p>
                  <Card.Title>
                    {exercises.data?.items.find((x) => x.id === e.exerciseId)
                      ?.name ?? e.exerciseId}
                  </Card.Title>
                  <Card.Description>
                    {e.note ||
                      exercises.data?.items.find((x) => x.id === e.exerciseId)
                        ?.instructions}
                  </Card.Description>
                </Card.Header>
                <Card.Content className="space-y-3">
                  {active.session.sets.map((set, setArrayIndex) =>
                    set.exerciseIndex !== index ? null : (
                      <div
                        className="grid grid-cols-[2rem_1fr_1fr_auto] items-end gap-2"
                        key={setArrayIndex}
                      >
                        <span className="pb-3 text-muted">
                          {number(set.setIndex + 1)}
                        </span>
                        <label className="text-xs">
                          تکرار
                          <Counter
                            aria-label={`تکرار حرکت ${index + 1} ست ${set.setIndex + 1}`}
                            className={fieldClass}

                            min={0}
                            max={100}
                            disabled={logs.busy || !!set.done}
                            key={`reps:${active.session.clientId}:${active.session.revision}:${set.done}`}
                            defaultValue={set.reps}
                            onBlur={(event) => {
                              if (!event.target.validity.valid)
                                event.target.value = String(set.reps);
                            }}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              if (
                                Number.isInteger(value) &&
                                value >= 0 &&
                                value <= 100
                              )
                                void logs.update(
                                  active.session.clientId,
                                  (current) => ({
                                    ...current,
                                    sets: current.sets.map((s, i) =>
                                      i === setArrayIndex
                                        ? { ...s, reps: value }
                                        : s,
                                    ),
                                  }),
                                  active.restUntil,
                                );
                            }}
                          />
                        </label>
                        <label className="text-xs">
                          کیلوگرم
                          <Counter
                            aria-label={`وزنه حرکت ${index + 1} ست ${set.setIndex + 1}`}
                            className={fieldClass}

                            min={0}
                            max={1000}
                            step={0.5}
                            disabled={logs.busy || !!set.done}
                            key={`weight:${active.session.clientId}:${active.session.revision}:${set.done}`}
                            defaultValue={set.weight}
                            onBlur={(event) => {
                              if (!event.target.validity.valid)
                                event.target.value = String(set.weight);
                            }}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              if (
                                Number.isFinite(value) &&
                                value >= 0 &&
                                value <= 1000
                              )
                                void logs.update(
                                  active.session.clientId,
                                  (current) => ({
                                    ...current,
                                    sets: current.sets.map((s, i) =>
                                      i === setArrayIndex
                                        ? { ...s, weight: value }
                                        : s,
                                    ),
                                  }),
                                  active.restUntil,
                                );
                            }}
                          />
                        </label>
                        <Button
                          aria-label={`${set.done ? "لغو ثبت" : "ثبت"} حرکت ${index + 1} ست ${set.setIndex + 1}`}
                          variant={set.done ? "secondary" : "primary"}
                          isDisabled={logs.busy}
                          onPress={() =>
                            void logs.update(
                              active.session.clientId,
                              (current) => ({
                                ...current,
                                sets: current.sets.map((s, i) =>
                                  i === setArrayIndex
                                    ? { ...s, done: !s.done }
                                    : s,
                                ),
                              }),
                              !set.done
                                ? Date.now() + e.restSeconds * 1000
                                : active.restUntil,
                            )
                          }
                        >
                          {set.done ? "ثبت شد ✓" : "ثبت ست"}
                        </Button>
                      </div>
                    ),
                  )}
                </Card.Content>
              </Card>
            ))}
          <fieldset
            disabled={logs.busy}
            className="space-y-3 rounded-2xl border border-border p-4"
          >
            <legend className="px-2 text-sm font-semibold">
              بازخورد برای مربی · اختیاری
            </legend>
            <p className="text-sm text-muted">تمرین امروز چطور بود؟</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["easy", "آسان"],
                  ["balanced", "متعادل"],
                  ["hard", "سخت"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  size="sm"
                  variant={
                    active.session.effort === value ? "primary" : "secondary"
                  }
                  aria-pressed={active.session.effort === value}
                  onPress={() =>
                    void logs.update(
                      active.session.clientId,
                      (current) => ({
                        ...current,
                        effort: current.effort === value ? null : value,
                      }),
                      active.restUntil,
                    )
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
            <HeroCheckbox
              className="flex min-h-11 items-center gap-3 text-sm"
              isSelected={active.session.followUpRequested ?? false}
              onChange={(e) => {
                const checked = e;
                void logs.update(
                  active.session.clientId,
                  (current) => ({ ...current, followUpRequested: checked }),
                  active.restUntil,
                );
              }}
            >
              <HeroCheckbox.Content>
                <HeroCheckbox.Control>
                  <HeroCheckbox.Indicator />
                </HeroCheckbox.Control>
                می‌خواهم مربی این تمرین را پیگیری کند
              </HeroCheckbox.Content>
            </HeroCheckbox>
          </fieldset>
          <label>
            یادداشت جلسه
            <HeroTextArea
              className={fieldClass}
              maxLength={2000}
              key={`note:${active.session.clientId}:${active.session.revision}`}
              defaultValue={active.session.note}
              disabled={logs.busy}
              onChange={(e) =>
                void logs.update(
                  active.session.clientId,
                  (current) => ({ ...current, note: e.target.value }),
                  active.restUntil,
                )
              }
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button
              isDisabled={logs.busy || !active.session.sets.some((s) => s.done)}
              onPress={() =>
                void logs
                  .update(active.session.clientId, (current) => ({
                    ...current,
                    status: "completed",
                    finishedAt: new Date().toISOString(),
                  }))
                  .then((ok) => {
                    if (ok) {
                      setMessage(
                        "جلسه روی دستگاه ذخیره شد؛ پس از همگام‌سازی، بازخورد مربی در روند پیشرفت نمایش داده می‌شود.",
                      );
                      void logs.sync();
                    }
                  })
              }
            >
              پایان و ذخیره تمرین
            </Button>
            <Button
              variant="tertiary"
              isDisabled={logs.busy}
              onPress={() => {
                if (
                  window.confirm(
                    "این جلسه لغو شود؟ ثبت‌های آن در سابقه می‌ماند.",
                  )
                )
                  void logs.update(active.session.clientId, (current) => ({
                    ...current,
                    status: "discarded",
                    finishedAt: new Date().toISOString(),
                  }));
              }}
            >
              لغو جلسه
            </Button>
          </div>
        </section>
      )}
      <h2 className="text-lg font-bold">برنامه‌های مربی</h2>
      <LoadState {...assignments} />
      {assignments.stale && (
        <Notice>
          نسخه آفلاین برنامه‌ها؛ شروع جلسه جدید فقط با اتصال و تأیید اعتبار
          برنامه ممکن است. جلسه فعال را می‌توانی آفلاین ادامه بدهی.
        </Notice>
      )}
      {assignments.data?.items.length === 0 && (
        <Notice>
          هنوز برنامه‌ای برایت ارسال نشده است. مربی می‌تواند از بخش برنامه‌های
          شاگردان برایت برنامه بسازد.
        </Notice>
      )}
      {assignments.data?.items.map((a) => (
        <Card key={a.id} className="p-5">
          <Card.Header>
            <p className="text-xs text-muted">
              نسخه {number(a.version)} · {date(a.startsAt)} تا {date(a.endsAt)}
            </p>
            <Card.Title>{a.snapshot.title}</Card.Title>
            <Card.Description>{a.snapshot.description}</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            {!a.available ? (
              <Notice>
                اعتبار این برنامه یا ارتباط فعال با مربی پایان یافته است.
              </Notice>
            ) : !a.consentAt ? (
              <div className="space-y-3">
                <p className="text-sm leading-7">
                  با پذیرش، نتیجه ست‌ها و یادداشت این برنامه با مربی به اشتراک
                  گذاشته می‌شود. می‌توانی هر زمان اشتراک را قطع کنی؛ سابقه
                  شخصی‌ات باقی می‌ماند.
                </p>
                <Button
                  isPending={accepting === a.id}
                  isDisabled={assignments.stale}
                  onPress={() => void consent(a, true)}
                >
                  پذیرش برنامه و اشتراک نتایج
                </Button>
              </div>
            ) : (
              <Button
                variant="tertiary"
                isPending={accepting === a.id}
                isDisabled={assignments.stale}
                onPress={() => void consent(a, false)}
              >
                قطع اشتراک نتایج با مربی
              </Button>
            )}
            {a.snapshot.days.map((day) => (
              <div key={day.id} className={featureCardStyles.day}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">
                      <FeatureBadge>{weekdays[day.weekday]}</FeatureBadge>
                      <span className="mt-2 block">{day.title}</span>
                    </h3>
                    <p className="text-xs text-muted">
                      {number(day.exercises.length)} حرکت
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    isDisabled={
                      !logs.ready ||
                      logs.busy ||
                      !!active ||
                      !a.available ||
                      !a.consentAt ||
                      assignments.stale ||
                      Date.parse(a.startsAt) > now ||
                      Date.parse(a.endsAt) <= now
                    }
                    onPress={() => void start(a, day.id)}
                  >
                    <Play size={16} fill="currentColor" aria-hidden="true" />
                    شروع تمرین
                  </Button>
                </div>
                <ul className="space-y-2 text-sm text-muted">
                  {day.exercises.map((e, i) => (
                    <li key={i}>
                      <ExerciseRow
                        index={i + 1}
                        title={
                          exercises.data?.items.find(
                            (x) => x.id === e.exerciseId,
                          )?.name ?? e.exerciseId
                        }
                        detail={`${number(e.sets)} × ${number(e.reps)} · ${number(e.weight)} کیلوگرم`}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card.Content>
        </Card>
      ))}
    </TrainingFrame>
  );
}
