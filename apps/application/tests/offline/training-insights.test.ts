import { test } from "node:test";
import assert from "node:assert/strict";
import {
  trainingInsights,
  mergeTrainingSessions,
  previousExercise,
} from "../../../../packages/api/src/domains/training/insights";
import type { SessionRecord } from "../../../../packages/api/src/domains/training";

const make = (date: string, actualExerciseId?: string): SessionRecord => ({
  clientId: date,
  assignmentId: "assignment",
  dayId: "day",
  revision: 1,
  startedAt: date,
  finishedAt: date,
  status: "completed",
  note: "",
  snapshot: {
    title: "plan",
    description: "",
    days: [
      {
        id: "day",
        title: "day",
        weekday: 0,
        exercises: [
          {
            exerciseId: "squat",
            sets: 1,
            reps: 10,
            weight: 20,
            restSeconds: 60,
            note: "",
          },
        ],
      },
    ],
  },
  sets: [
    {
      exerciseIndex: 0,
      setIndex: 0,
      reps: 10,
      weight: 20,
      done: true,
      actualExerciseId,
    },
  ],
});

test("trends use actual exercises, sort unordered input, and exclude future and unfinished sessions", () => {
  const early = make("2026-09-10T08:00:00Z", "goblet-squat");
  const late = make("2026-09-14T08:00:00Z", "goblet-squat");
  const report = trainingInsights(
    [
      late,
      make("2027-01-01T08:00:00Z"),
      early,
      { ...make("2026-09-12T08:00:00Z"), status: "active", finishedAt: null },
    ],
    Date.parse("2026-09-15T08:00:00Z"),
  );
  assert.equal(report.current.sessions, 2);
  assert.equal(report.current.volume, 400);
  assert.deepEqual(
    report.trends[0]?.points.map((point) => point.date),
    [early.startedAt, late.startedAt],
  );
  assert.equal(report.trends[0]?.exerciseId, "goblet-squat");
  assert.equal(
    previousExercise([early, late], "goblet-squat", late.startedAt)?.startedAt,
    early.startedAt,
  );
});

test("merging retains unsynced edits while preserving the coach's server feedback", () => {
  const server = {
    ...make("2026-09-14T08:00:00Z"),
    coachReview: {
      text: "review",
      reviewedAt: "2026-09-15T08:00:00Z",
      revision: 1,
    },
  };
  const merged = mergeTrainingSessions(
    [server],
    [{ ...server, note: "local edit", coachReview: undefined }],
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.note, "local edit");
  assert.equal(merged[0]?.coachReview?.text, "review");
});
