"use client";
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
import { useWorkouts } from "./useWorkouts";
export function TrainingProgress() {
  const identity = useIdentity();
  return <TrainingProgressSession key={identity} />;
}
function TrainingProgressSession() {
  const remote = useTrainingData("sessions", trainingApi.sessions, true);
  const library = useTrainingData("exercises", trainingApi.exercises, true);
  const local = useWorkouts();
  const sessions = [
    ...new Map(
      [
        ...(remote.data?.items ?? []),
        ...local.workouts.map((w) => w.session),
      ].map((s) => [s.clientId, s]),
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
      <Card className="p-5">
        <Card.Header>
          <Card.Title>۲۸ روز حرکت</Card.Title>
          <Card.Description>
            هر خانه، تعداد جلسات کامل‌شده یک روز را نشان می‌دهد.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-7 gap-2">
            {calendar.map((d) => (
              <div
                key={d.label}
                title={`${d.label}: ${d.count} جلسه`}
                aria-label={`${d.label}: ${d.count} جلسه`}
                className={`flex aspect-square items-center justify-center rounded-lg text-sm ${d.count ? "bg-accent text-accent-foreground" : "bg-surface-secondary text-muted"}`}
              >
                {number(d.count)}
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
      <h2 className="text-lg font-semibold">بیشترین وزنه ثبت‌شده</h2>
      {!maxWeights.size ? (
        <Notice>
          پس از کامل‌کردن اولین جلسه، رکورد حرکات اینجا نمایش داده می‌شود.
        </Notice>
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
        <Notice>هنوز تمرینی ثبت نکرده‌ای.</Notice>
      )}
      {sessions.map((s) => (
        <Card key={s.clientId} className="p-5">
          <Card.Header>
            <Card.Title>{s.snapshot.title}</Card.Title>
            <Card.Description>
              {date(s.startedAt)} ·{" "}
              {s.status === "completed"
                ? "کامل‌شده"
                : s.status === "active"
                  ? "ناتمام"
                  : "لغوشده"}
            </Card.Description>
          </Card.Header>
          <Card.Content>
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
