import assert from "node:assert/strict";
import test from "node:test";
import { keyboardGeometry } from "../../lib/keyboard-geometry";
import { filterReservationList } from "../../lib/reservation-list";

const base = {
  layoutHeight: 800,
  baselineHeight: 800,
  viewportHeight: 800,
  viewportOffsetTop: 0,
  pluginHeight: 0,
  editable: true,
};
test("native resize does not subtract the keyboard twice", () => {
  assert.deepEqual(
    keyboardGeometry({
      ...base,
      layoutHeight: 500,
      viewportHeight: 500,
      pluginHeight: 300,
    }),
    { height: 300, inset: 0 },
  );
});
test("overlay keyboard reserves only the occluded area", () => {
  assert.deepEqual(
    keyboardGeometry({ ...base, viewportHeight: 500, pluginHeight: 300 }),
    { height: 300, inset: 300 },
  );
});
test("partial native resize reserves the remainder", () => {
  assert.deepEqual(
    keyboardGeometry({
      ...base,
      layoutHeight: 600,
      viewportHeight: 500,
      pluginHeight: 300,
    }),
    { height: 300, inset: 100 },
  );
});
test("content-resizing browser detects keyboard without plugin", () => {
  assert.deepEqual(
    keyboardGeometry({ ...base, layoutHeight: 500, viewportHeight: 500 }),
    { height: 300, inset: 0 },
  );
});
test("browser bars and pinch zoom do not open keyboard mode", () => {
  assert.deepEqual(keyboardGeometry({ ...base, viewportHeight: 750 }), {
    height: 0,
    inset: 0,
  });
  assert.deepEqual(
    keyboardGeometry({ ...base, viewportHeight: 400, scale: 2 }),
    { height: 0, inset: 0 },
  );
});
test("keyboard dismissal restores the layout", () => {
  assert.deepEqual(keyboardGeometry({ ...base, editable: false }), {
    height: 0,
    inset: 0,
  });
});
const items = [
  {
    id: "course",
    source: "class",
    status: "reserved",
    sessionStartsAt: "2026-09-01T12:00:00",
    sessionEndsAt: "2026-09-30T12:00:00",
  },
  {
    id: "cancelled",
    status: "cancelled",
    sessionStartsAt: "2026-09-15T12:00:00",
    sessionEndsAt: "2026-09-15T13:00:00",
  },
  {
    id: "past",
    status: "completed",
    sessionStartsAt: "2026-09-01T12:00:00",
    sessionEndsAt: "2026-09-01T13:00:00",
  },
  {
    id: "next",
    status: "reserved",
    sessionStartsAt: "2026-09-15T12:00:00",
    sessionEndsAt: "2026-09-15T13:00:00",
  },
];
test("upcoming includes active courses, excludes cancelled and completed", () => {
  assert.deepEqual(
    filterReservationList(
      items,
      "upcoming",
      "2026-09-10",
      new Date("2026-09-10").getTime(),
    ).map((x) => x.id),
    ["course", "next"],
  );
});
test("course remains visible between its first and last session dates", () => {
  assert.deepEqual(
    filterReservationList(items, "date", "2026-09-10", 0).map((x) => x.id),
    ["course"],
  );
});
test("all reservations includes cancelled and past records", () => {
  assert.equal(
    filterReservationList(items, "history", "2026-09-10", 0).length,
    4,
  );
});
