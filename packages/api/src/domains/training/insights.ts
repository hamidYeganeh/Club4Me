import type { SessionRecord, TrainingSet } from "./index";

const DAY = 86_400_000;
export function mergeTrainingSessions(
  remote: SessionRecord[],
  local: SessionRecord[],
) {
  const merged = new Map(remote.map((session) => [session.clientId, session]));
  for (const session of local) {
    const server = merged.get(session.clientId);
    merged.set(session.clientId, {
      ...session,
      coachReview: server?.coachReview ?? session.coachReview,
    });
  }
  return [...merged.values()].sort(
    (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
  );
}
export function exerciseForSet(session: SessionRecord, set: TrainingSet) {
  return (
    set.actualExerciseId ??
    session.snapshot.days.find((day) => day.id === session.dayId)?.exercises[
      set.exerciseIndex
    ]?.exerciseId
  );
}
export function previousExercise(
  sessions: SessionRecord[],
  exerciseId: string,
  before: string,
) {
  for (const session of [...sessions].sort(
    (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
  )) {
    if (
      session.status !== "completed" ||
      Date.parse(session.startedAt) >= Date.parse(before)
    )
      continue;
    const sets = session.sets.filter(
      (set) => set.done && exerciseForSet(session, set) === exerciseId,
    );
    if (sets.length) return { startedAt: session.startedAt, sets };
  }
  return undefined;
}
export function trainingInsights(sessions: SessionRecord[], now: number) {
  const completed = sessions.filter(
    (s) => s.status === "completed" && Date.parse(s.startedAt) <= now,
  );
  const recent = completed.filter(
    (s) => Date.parse(s.startedAt) >= now - 7 * DAY,
  );
  const previous = completed.filter(
    (s) =>
      Date.parse(s.startedAt) < now - 7 * DAY &&
      Date.parse(s.startedAt) >= now - 14 * DAY,
  );
  const summarize = (items: SessionRecord[]) => ({
    sessions: items.length,
    sets: items.reduce((n, s) => n + s.sets.filter((x) => x.done).length, 0),
    volume: items.reduce(
      (n, s) =>
        n +
        s.sets
          .filter((x) => x.done)
          .reduce((total, x) => total + x.weight * x.reps, 0),
      0,
    ),
  });
  const byExercise = new Map<
    string,
    { date: string; maxWeight: number; volume: number }[]
  >();
  for (const session of completed) {
    const totals = new Map<string, { maxWeight: number; volume: number }>();
    const day = session.snapshot.days.find((day) => day.id === session.dayId);
    for (const set of session.sets) {
      if (!set.done) continue;
      const exerciseId =
        set.actualExerciseId ?? day?.exercises[set.exerciseIndex]?.exerciseId;
      if (!exerciseId) continue;
      const total = totals.get(exerciseId) ?? { maxWeight: 0, volume: 0 };
      total.maxWeight = Math.max(total.maxWeight, set.weight);
      total.volume += set.weight * set.reps;
      totals.set(exerciseId, total);
    }
    for (const [exerciseId, total] of totals) {
      const points = byExercise.get(exerciseId) ?? [];
      points.push({ date: session.startedAt, ...total });
      byExercise.set(exerciseId, points);
    }
  }
  const trends = [...byExercise].map(([exerciseId, points]) => ({
    exerciseId,
    points: points.sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
  }));
  const pendingReviews = recent.filter(
    (s) => s.followUpRequested && !s.coachReview,
  ).length;
  const hardSessions = recent.filter((s) => s.effort === "hard").length;
  return {
    current: summarize(recent),
    previous: summarize(previous),
    trends,
    pendingReviews,
    hardSessions,
    nextStep: pendingReviews
      ? "بازخوردهای در انتظار را با مربی پیگیری کن."
      : hardSessions >= 2
        ? "چند جلسه را سخت ثبت کرده‌ای؛ پیش از تغییر برنامه با مربی مرور کن."
        : recent.length
          ? "زمان جلسه بعدی را در برنامه‌ات مشخص کن."
          : "برای شروع، یک جلسه از برنامه‌ات انتخاب کن.",
  };
}
