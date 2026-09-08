import test from "node:test";
import assert from "node:assert/strict";
import {
  iranDateInputValue,
  parseIranDateInput,
  tehranLocalDate,
  tehranLocalValue,
} from "../../../../packages/ui/src/iran-date";

test("Jalali date accepts Persian and Arabic digits, preserves civil dates", () => {
  for (const text of ["۱۴۰۵/۰۶/۲۱", "١٤٠٥/٠٦/٢١", "1405-06-21"])
    assert.equal(parseIranDateInput(text), "2026-09-12");
  assert.equal(iranDateInputValue("2026-09-12"), "1405/06/21");
  assert.equal(
    parseIranDateInput("۱۴۰۵/۰۶/۲۱ ۱۸:۳۰", true),
    "2026-09-12T18:30",
  );
});
test("rejects clamped days, non-leap Esfand, Gregorian input and invalid times", () => {
  for (const text of [
    "1404/12/30",
    "1405/07/31",
    "1405/13/01",
    "1405/00/01",
    "2026/09/12",
  ])
    assert.equal(parseIranDateInput(text), null);
  assert.equal(parseIranDateInput("1403/12/30"), "2025-03-20");
  assert.equal(parseIranDateInput("1405/06/21 24:00", true), null);
  assert.equal(parseIranDateInput("1405/06/21 12:60", true), null);
});
test("service time round trips in Tehran across device timezones and historical DST", () => {
  const original = process.env.TZ;
  try {
    for (const timezone of ["UTC", "America/Los_Angeles", "Asia/Tokyo"]) {
      process.env.TZ = timezone;
      assert.equal(
        tehranLocalDate("2026-09-12T18:30").toISOString(),
        "2026-09-12T15:00:00.000Z",
      );
      assert.equal(
        tehranLocalValue("2026-09-12T15:00:00.000Z"),
        "2026-09-12T18:30",
      );
      assert.equal(
        tehranLocalDate("2022-07-02T18:30").toISOString(),
        "2022-07-02T14:00:00.000Z",
      );
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
  assert.ok(Number.isNaN(tehranLocalDate("invalid").getTime()));
  assert.ok(Number.isNaN(tehranLocalDate("2022-03-22T00:30").getTime()));
});
