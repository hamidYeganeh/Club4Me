import test from "node:test";
import assert from "node:assert/strict";
import {
  validateActivityWeek,
  readActivityWeek,
  authorizeActivity,
  type ActivityHealthBridge,
} from "../../lib/activity-health";
const now = Date.parse("2026-09-15T12:00:00Z");
const week = Array.from({ length: 7 }, (_, index) => ({
  date: `2026-09-${String(9 + index).padStart(2, "0")}`,
  steps: index === 0 ? null : index * 100,
}));
test("health totals retain missing data and order days without double counting", () => {
  assert.deepEqual(validateActivityWeek([...week].reverse(), now), week);
  assert.equal(validateActivityWeek(week, now)[0]!.steps, null);
});
test("health totals reject duplicate days, future dates and invalid measurements", () => {
  for (const rows of [
    [...week.slice(1), week[1]!],
    [...week.slice(1), { date: "2026-09-16", steps: 1 }],
    week.map((row, index) => (index === 0 ? { ...row, steps: -1 } : row)),
    week.map((row, index) => (index === 0 ? { ...row, steps: NaN } : row)),
  ])
    assert.throws(() => validateActivityWeek(rows, now));
});
test("authorization is explicit and denial does not initiate reading", async () => {
  let reads = 0;
  const adapter: ActivityHealthBridge = {
    status: async () => ({ available: true, provider: "health-connect" }),
    authorize: async () => {
      throw Object.assign(new Error("denied"), { code: "HEALTH_DENIED" });
    },
    readWeek: async () => {
      reads++;
      return { days: week };
    },
  };
  await assert.rejects(authorizeActivity(adapter), { code: "HEALTH_DENIED" });
  assert.equal(reads, 0);
  await assert.rejects(
    readActivityWeek({
      ...adapter,
      readWeek: async () => {
        throw Object.assign(new Error("revoked"), { code: "HEALTH_DENIED" });
      },
    }),
    { code: "HEALTH_DENIED" },
  );
});
