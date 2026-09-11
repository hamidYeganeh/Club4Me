"use client";
import { useState } from "react";
import { ButtonLink } from "@/components/button-link";
import {
  ProgressMeter,
  VisualEmptyState,
  clarityStyles,
} from "@/components/ui/clarity";
import styles from "./progress.module.css";
import { SessionReview } from "./TrainingFollowUps";
import { Card } from "@heroui/react";
import { trainingApi } from "@api/domains/training";
import {
  date,
  LoadState,
  Notice,
  number,
  TrainingFrame,
  TrainingSummary,
  useIdentity,
  useTrainingData,
} from "./shared";
import {
  FeatureBadge,
  HistoryBars,
  featureCardStyles,
} from "@/components/ui/feature-cards";
import { useWorkouts } from "./useWorkouts";
export function TrainingProgress() {
  const identity = useIdentity();
  return <TrainingProgressSession key={identity} />;
}
function TrainingProgressSession() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const remote = useTrainingData("sessions", trainingApi.sessions, true);
  const library = useTrainingData("exercises", trainingApi.exercises, true);
  const local = useWorkouts();
  const sessions = [
    ...new Map(
      [
        ...(remote.data?.items ?? []),
        ...local.workouts.map((w) => w.session),
      ].map((s) => [
        s.clientId,
        {
          ...s,
          coachReview:
            remote.data?.items.find((r) => r.clientId === s.clientId)
              ?.coachReview ?? s.coachReview,
        },
      ]),
    ).values(),
  ].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const complete = sessions.filter((s) => s.status === "completed");
  const maxWeights = new Map<string, number>();
  for (const s of complete)
    for (const set of s.sets.filter((x) => x.done)) {
      const exercise = s.snapshot.days.find((d) => d.id === s.dayId)?.exercises[
        set.exerciseIndex
      ];
      if (exercise)
        maxWeights.set(
          exercise.exerciseId,
          Math.max(maxWeights.get(exercise.exerciseId) ?? 0, set.weight),
        );
    }
  const calendar = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 27 + i);
    const count = complete.filter(
      (s) => new Date(s.startedAt).toDateString() === d.toDateString(),
    ).length;
    return { label: d.toLocaleDateString("fa-IR"), count };
  });
  const activeDays = calendar.filter((day) => day.count > 0).length;
  const selected = calendar.find((day) => day.label === selectedDay);
  return (
    <TrainingFrame title="روند پیشرفت">
      <LoadState {...remote} />
      {(remote.stale || local.workouts.some((w) => w.dirty || w.pending)) && (
        <Notice>
          این نما شامل ثبت‌های محلی است؛ ممکن است همه نتایج هنوز به مربی نرسیده
          باشند.
        </Notice>
      )}
      <TrainingSummary sessions={sessions} />
      <Card className={`${clarityStyles.surface} p-5`}>
        <Card.Header>
          <Card.Title>۲۸ روز حرکت</Card.Title>
          <Card.Description>
            هر خانه، تعداد جلسات کامل‌شده یک روز را نشان می‌دهد.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="mb-5 space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-muted">روزهای دارای تمرین کامل</p>
              <p className="text-xl font-bold tabular-nums">
                {number(activeDays)}{" "}
                <span className="text-xs font-normal text-muted">
                  از ۲۸ روز
                </span>
              </p>
            </div>
            <ProgressMeter
              value={activeDays}
              max={28}
              label="روزهای دارای تمرین کامل در ۲۸ روز اخیر"
            />
          </div>
          <div
            className={styles.calendar}
            role="group"
            aria-label="انتخاب روز تمرین"
          >
            {calendar.map((d) => (
              <button
                type="button"
                key={d.label}
                title={`${d.label}: ${number(d.count)} جلسه`}
                aria-label={`${d.label}: ${number(d.count)} جلسه`}
                aria-pressed={selectedDay === d.label}
                data-active={d.count > 0}
                className={styles.day}
                onClick={() => setSelectedDay(d.label)}
              >
                {number(d.count)}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted">
            <span>{calendar[0]?.label}</span>
            <span>تا امروز</span>
          </div>
          <div className={styles.selection} aria-live="polite">
            {selected ? (
              <>
                <span>{selected.label}</span>
                <strong>
                  {selected.count
                    ? `${number(selected.count)} جلسه کامل‌شده`
                    : "جلسه کاملی ثبت نشده"}
                </strong>
              </>
            ) : (
              <span>یک روز را برای دیدن تعداد جلسات انتخاب کن.</span>
            )}
          </div>
        </Card.Content>
      </Card>
      <h2 className="text-lg font-semibold">بیشترین وزنه ثبت‌شده</h2>
      {!maxWeights.size ? (
        <VisualEmptyState
          icon="weight"
          title="اولین رکوردت در راه است"
          description="پس از کامل‌کردن اولین جلسه، رکورد حرکات اینجا نمایش داده می‌شود."
          action={
            <ButtonLink href="/athlete/training" variant="primary">
              انتخاب و شروع تمرین
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...maxWeights].map(([id, weight]) => (
            <Card key={id} className="p-4">
              <p className="text-sm text-muted">
                {library.data?.items.find((e) => e.id === id)?.name ?? id}
              </p>
              <p className="text-xl font-semibold">{number(weight)} کیلوگرم</p>
            </Card>
          ))}
        </div>
      )}
      <h2 className="text-lg font-semibold">سابقه جلسات</h2>
      {!sessions.length && !remote.loading && (
        <p className="text-sm leading-7 text-muted">
          هنوز تمرینی ثبت نکرده‌ای.
        </p>
      )}
      {sessions.map((s) => (
        <Card key={s.clientId} className={featureCardStyles.history}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <FeatureBadge>
                {s.status === "completed"
                  ? "کامل‌شده"
                  : s.status === "active"
                    ? "ناتمام"
                    : "لغوشده"}
              </FeatureBadge>
              <Card.Title className="mt-2 text-base">
                {s.snapshot.title}
              </Card.Title>
              <p className="mt-1 text-xs text-muted">{date(s.startedAt)}</p>
            </div>
            {s.sets.some((set) => set.done) && (
              <div className="text-accent">
                <HistoryBars
                  values={s.sets
                    .filter((set) => set.done)
                    .map((set) => set.reps)}
                  label={`تکرار ست‌های ثبت‌شده: ${s.sets
                    .filter((set) => set.done)
                    .map((set) => number(set.reps))
                    .join("، ")}`}
                />
              </div>
            )}
          </div>
          <Card.Content>
            <SessionReview session={s} />
            <details>
              <summary className="cursor-pointer">
                {number(s.sets.filter((x) => x.done).length)} ست ثبت‌شده ·
                جزئیات
              </summary>
              <ul className="mt-3 space-y-2 text-sm">
                {s.sets
                  .filter((x) => x.done)
                  .map((set, i) => {
                    const id = s.snapshot.days.find((d) => d.id === s.dayId)
                      ?.exercises[set.exerciseIndex]?.exerciseId;
                    return (
                      <li key={i}>
                        {library.data?.items.find((e) => e.id === id)?.name ??
                          id}{" "}
                        · ست {number(set.setIndex + 1)} · {number(set.reps)}{" "}
                        تکرار × {number(set.weight)} کیلوگرم
                      </li>
                    );
                  })}
              </ul>
              {s.note && <p className="mt-3 text-muted">{s.note}</p>}
            </details>
          </Card.Content>
        </Card>
      ))}
    </TrainingFrame>
  );
}
