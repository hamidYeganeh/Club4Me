import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  analyticsPeriod,
  buildBehavior,
  metric,
  percent,
} from "./analytics-math";
import { EVENTS } from "./events";
const start = new Date("2026-08-01T00:00:00Z"),
  end = new Date("2026-09-01T00:00:00Z");
const event = (actor: string, name: string, at: string, properties = {}) => ({
  actorId: actor,
  event: name,
  occurredAt: new Date(at),
  properties,
  source: "server",
});
describe("analytics definitions", () => {
  it("counts only chronologically ordered funnel entrants", () => {
    const rows = [
      event("a", EVENTS.PAYMENT_SUCCEEDED, "2026-08-02", {
        reference_type: "reservation",
      }),
      event("a", EVENTS.DISCOVERY_CLUB_VIEWED, "2026-08-03"),
      event("a", EVENTS.CHECKOUT_STARTED, "2026-08-04"),
      event("a", EVENTS.RESERVATION_CREATED, "2026-08-05"),
      event("a", EVENTS.PAYMENT_SUCCEEDED, "2026-08-06", {
        reference_type: "reservation",
      }),
      event("b", EVENTS.CHECKOUT_STARTED, "2026-08-04"),
      event("b", EVENTS.RESERVATION_CREATED, "2026-08-05"),
      event("b", EVENTS.PAYMENT_SUCCEEDED, "2026-08-06", {
        reference_type: "reservation",
      }),
    ];
    expect(buildBehavior(rows, start, end).funnel.map((s) => s.users)).toEqual([
      1, 1, 1, 1,
    ]);
    expect(
      buildBehavior(rows, start, end).funnel.every(
        (s) => s.conversionPercent <= 100,
      ),
    ).toBe(true);
  });
  it("does not mix membership payments into the reservation funnel", () => {
    const rows = [
      event("a", EVENTS.DISCOVERY_CLUB_VIEWED, "2026-08-03"),
      event("a", EVENTS.CHECKOUT_STARTED, "2026-08-04"),
      event("a", EVENTS.RESERVATION_CREATED, "2026-08-05"),
      event("a", EVENTS.PAYMENT_SUCCEEDED, "2026-08-06", {
        reference_type: "benefit_purchase",
      }),
    ];
    expect(buildBehavior(rows, start, end).funnel[3]?.users).toBe(0);
  });
  it("marks unobserved future weeks null and excludes previously observed customers from new cohorts", () => {
    const rows = [
      event("old", EVENTS.RESERVATION_CREATED, "2026-07-20"),
      event("old", EVENTS.RESERVATION_CREATED, "2026-08-30"),
      event("new", EVENTS.RESERVATION_CREATED, "2026-08-30"),
    ];
    const cohorts = buildBehavior(rows, start, end).cohorts;
    expect(cohorts).toHaveLength(1);
    expect(cohorts[0]?.users).toBe(1);
    expect(cohorts[0]?.retention).toEqual([null, null, null, null, null]);
  });
  it("uses half-open periods and no fabricated zero-baseline percentage", () => {
    expect(
      buildBehavior(
        [event("a", EVENTS.APP_OPENED, end.toISOString())],
        start,
        end,
      ).activeUsers,
    ).toBe(0);
    expect(percent(0, 0)).toBeNull();
    expect(metric("a", "a", 20, 0).changePercent).toBeNull();
    const period = analyticsPeriod("30", "2026-08-31", end);
    expect(period.end.toISOString()).toBe("2026-08-30T20:30:00.000Z");
    expect(() => analyticsPeriod("30", "2027-01-01", end)).toThrow();
  });
});

it("keeps backend and frontend event registries synchronized", () => {
  const source = readFileSync(
    resolve(__dirname, "../../../../../packages/api/src/tracking/events.ts"),
    "utf8",
  );
  const pairs = [...source.matchAll(/([A-Z_]+):\s*"([^"]+)"/g)].map((m) => [
    m[1],
    m[2],
  ]);
  expect(EVENTS).toEqual(Object.fromEntries(pairs));
});
