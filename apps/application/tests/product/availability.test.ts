import assert from "node:assert/strict";
import test from "node:test";
import {
  availabilityDraft,
  availabilityPayload,
} from "../../lib/coach-availability";
const rule = {
  id: "existing",
  dayOfWeek: 6,
  startMinute: 540,
  endMinute: 1440,
  deliveryModes: ["club", "outdoor"] as ("club" | "outdoor")[],
  clubId: "507f1f77bcf86cd799439011",
  validFrom: "2026-09-01T00:00:00.000Z",
  validUntil: "2026-10-01T00:00:00.000Z",
};
const defaults = {
  deliveryModes: ["online"] as "online"[],
  validFrom: "2026-09-06",
  validUntil: null,
  clubId: null,
};
test("empty schedule does not invent weekdays or hours", () =>
  assert.deepEqual(availabilityPayload(availabilityDraft([]), defaults), []));
test("editing hours retains venue, modes, validity and midnight without adding default periods", () => {
  const draft = availabilityDraft([rule]);
  draft.week.sat.ranges[0]!.start = "10:00";
  const expected = structuredClone(rule);
  delete (expected as Partial<typeof rule>).id;
  assert.deepEqual(availabilityPayload(draft, defaults), [
    { ...expected, startMinute: 600 },
  ]);
});
test("disabled days are removed, new periods use explicit supported defaults", () => {
  const draft = availabilityDraft([rule]);
  draft.week.sat.enabled = false;
  draft.week.sun = {
    enabled: true,
    ranges: [{ id: "new", start: "11:00", end: "12:00" }],
  };
  assert.deepEqual(availabilityPayload(draft, defaults), [
    { ...defaults, dayOfWeek: 0, startMinute: 660, endMinute: 720 },
  ]);
});
test("empty delivery modes and backwards dates are rejected before replacing existing rules", () => {
  const draft = availabilityDraft([rule]);
  draft.details["sat:existing"]!.deliveryModes = [];
  assert.throws(() => availabilityPayload(draft, defaults));
  draft.details["sat:existing"] = { ...defaults, validUntil: "2026-09-01" };
  assert.throws(() => availabilityPayload(draft, defaults));
});
