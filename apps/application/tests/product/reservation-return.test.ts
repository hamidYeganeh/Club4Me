import assert from "node:assert/strict";
import test from "node:test";
import {
  readReservationSelection,
  writeReservationSelection,
} from "../../lib/reservation-return-selection";

test("login return preserves participant and extra selections without encoding a trusted price", () => {
  const params = new URLSearchParams("court=one&date=2026-09-07");
  const selection = {
    sessionId: "session-one",
    participantCount: 4,
    quantities: { racket: 2 },
  };
  writeReservationSelection(params, selection);
  assert.deepEqual(readReservationSelection(params), selection);
  assert.equal(params.get("court"), "one");
  assert.equal(params.has("price"), false);
});
test("malformed and unbounded return selections are ignored", () => {
  assert.deepEqual(
    readReservationSelection(
      new URLSearchParams("participants=-1&extras={broken"),
    ),
    { sessionId: "", participantCount: 1, quantities: {} },
  );
  const params = new URLSearchParams({
    participants: "2.5",
    extras: JSON.stringify({
      negative: -1,
      fraction: 1.5,
      huge: 1001,
      safe: 2,
      constructor: "invalid",
    }),
  });
  assert.deepEqual(readReservationSelection(params).quantities, { safe: 2 });
  assert.equal(readReservationSelection(params).participantCount, 1);
});
