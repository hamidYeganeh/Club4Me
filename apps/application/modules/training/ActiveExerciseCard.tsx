"use client";
import { useEffect, useState } from "react";
import { Button, Card } from "@heroui/react";
import { History, Repeat2 } from "lucide-react";
import { Counter } from "@/components/counter";
import { FormSelect, FormOption } from "@repo/ui/form-select";
import type {
  Exercise,
  Prescription,
  SessionRecord,
} from "@api/domains/training";
import { previousExercise } from "@api/domains/training/insights";
import type { useWorkouts } from "./useWorkouts";
import { date, number } from "./shared";

export function RestTimer({ until }: { until?: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => {
      const stamp = Date.now();
      setNow(stamp);
      if (stamp >= until) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [until]);
  return (
    <p
      aria-live="off"
      className="rounded-xl bg-accent-soft p-3 text-sm font-semibold tabular-nums"
    >
      {until && until > now
        ? `استراحت: ${number(Math.ceil((until - now) / 1000))} ثانیه`
        : "آماده ست بعدی"}
    </p>
  );
}

export function ActiveExerciseCard({
  exercise,
  index,
  session,
  restUntil,
  library,
  history,
  logs,
}: {
  exercise: Prescription;
  index: number;
  session: SessionRecord;
  restUntil?: number;
  library: Exercise[];
  history: SessionRecord[];
  logs: ReturnType<typeof useWorkouts>;
}) {
  const sets = session.sets
    .map((set, position) => ({ ...set, position }))
    .filter((set) => set.exerciseIndex === index);
  const currentId =
    sets.find((set) => !set.done)?.actualExerciseId ??
    sets[0]?.actualExerciseId ??
    exercise.exerciseId;
  const info = library.find((item) => item.id === currentId);
  const previous = previousExercise(history, currentId, session.startedAt);
  const changeValue = (
    position: number,
    key: "weight" | "reps",
    value: number,
  ) => {
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      value > (key === "reps" ? 100 : 1000) ||
      (key === "reps" && !Number.isInteger(value))
    )
      return;
    void logs.update(
      session.clientId,
      (current) => ({
        ...current,
        sets: current.sets.map((set, i) =>
          i === position ? { ...set, [key]: value } : set,
        ),
      }),
      restUntil,
    );
  };
  return (
    <Card className="p-4 sm:p-5">
      <Card.Header>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted">
            حرکت {number(index + 1)} · {number(exercise.restSeconds)} ثانیه
            استراحت
          </p>
          {exercise.supersetGroup && (
            <span className="flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">
              <Repeat2 size={13} />
              سوپرست {exercise.supersetGroup}
            </span>
          )}
        </div>
        <Card.Title>{info?.name ?? currentId}</Card.Title>
        <Card.Description>
          {exercise.note || info?.instructions}
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        {exercise.supersetGroup && (
          <p className="text-xs leading-6 text-muted">
            حرکت‌های گروه {exercise.supersetGroup} را پشت‌سرهم انجام بده؛ بعد از
            هر دور استراحت کن.
          </p>
        )}
        {!!exercise.alternativeExerciseIds?.length && (
          <label className="grid gap-2 text-xs">
            تجهیزات در دسترس نیست؟ جایگزین مورد تأیید مربی
            <FormSelect
              aria-label={`جایگزین حرکت ${index + 1}`}
              value={currentId}
              disabled={logs.busy || sets.some((set) => set.done)}
              onChange={(value) => {
                void logs.update(
                  session.clientId,
                  (current) => ({
                    ...current,
                    sets: current.sets.map((set) =>
                      set.exerciseIndex === index
                        ? { ...set, actualExerciseId: value }
                        : set,
                    ),
                  }),
                  restUntil,
                );
              }}
            >
              {[exercise.exerciseId, ...exercise.alternativeExerciseIds].map(
                (id) => (
                  <FormOption key={id} value={id}>
                    {library.find((item) => item.id === id)?.name ?? id} ·{" "}
                    {library.find((item) => item.id === id)?.equipment ?? ""}
                  </FormOption>
                ),
              )}
            </FormSelect>
          </label>
        )}
        {previous ? (
          <div className="rounded-2xl bg-surface-secondary p-3">
            <p className="flex items-center gap-2 text-xs text-muted">
              <History size={15} />
              جلسه قبل · {date(previous.startedAt)}
            </p>
            <p className="mt-2 text-xs leading-6">
              {previous.sets
                .map(
                  (set) =>
                    `${number(set.weight)} کیلوگرم × ${number(set.reps)}`,
                )
                .join(" · ")}
            </p>
            <Button
              size="sm"
              variant="ghost"
              isDisabled={logs.busy || sets.some((set) => set.done)}
              onPress={() => {
                void logs.update(
                  session.clientId,
                  (current) => ({
                    ...current,
                    sets: current.sets.map((set) => {
                      const old = previous.sets.find(
                        (s) => s.setIndex === set.setIndex,
                      );
                      return set.exerciseIndex === index && old
                        ? { ...set, reps: old.reps, weight: old.weight }
                        : set;
                    }),
                  }),
                  restUntil,
                );
              }}
            >
              استفاده از مقادیر جلسه قبل
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted">
            هنوز سابقه‌ای برای این حرکت ثبت نکرده‌ای.
          </p>
        )}
        <div className="space-y-3">
          {sets.map((set) => (
            <div
              key={`${session.clientId}:${set.position}`}
              className="grid grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2"
            >
              <span className="pb-3 text-xs text-muted">
                {number(set.setIndex + 1)}
              </span>
              {(["reps", "weight"] as const).map((key) => (
                <label key={key} className="min-w-0 text-xs">
                  {key === "reps" ? "تکرار" : "کیلوگرم"}
                  <Counter
                    aria-label={`${key === "reps" ? "تکرار" : "وزنه"} حرکت ${index + 1} ست ${set.setIndex + 1}`}
                    min={0}
                    max={key === "reps" ? 100 : 1000}
                    step={key === "reps" ? 1 : 0.5}
                    className="w-full min-w-0"
                    disabled={logs.busy || set.done}
                    value={set[key]}
                    onChange={(event) =>
                      changeValue(set.position, key, Number(event.target.value))
                    }
                  />
                </label>
              ))}
              <Button
                isIconOnly
                aria-label={`${set.done ? "لغو ثبت" : "ثبت"} حرکت ${index + 1} ست ${set.setIndex + 1}`}
                variant={set.done ? "secondary" : "primary"}
                isDisabled={logs.busy}
                onPress={() => {
                  const day = session.snapshot.days.find(
                    (d) => d.id === session.dayId,
                  )!;
                  const hasNextInGroup =
                    exercise.supersetGroup &&
                    day.exercises
                      .slice(index + 1)
                      .some((e) => e.supersetGroup === exercise.supersetGroup);
                  void logs.update(
                    session.clientId,
                    (current) => ({
                      ...current,
                      sets: current.sets.map((s, i) =>
                        i === set.position ? { ...s, done: !s.done } : s,
                      ),
                    }),
                    !set.done && !hasNextInGroup
                      ? Date.now() + exercise.restSeconds * 1000
                      : restUntil,
                  );
                }}
              >
                {set.done ? "✓" : "ثبت"}
              </Button>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}
