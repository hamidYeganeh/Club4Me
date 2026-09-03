import {
  intervalsOverlap,
  normalizeText,
  zonedDateAtMinute,
} from "./coaching.utils";

describe("coaching utilities", () => {
  it("normalizes Arabic and Persian variants for search", () => {
    expect(normalizeText("  مربي   كاراته  ")).toBe("مربی کاراته");
  });

  it("converts Tehran wall-clock time to UTC", () => {
    const result = zonedDateAtMinute(
      new Date("2026-09-03T00:00:00.000Z"),
      18 * 60,
      "Asia/Tehran",
    );
    expect(result.toISOString()).toBe("2026-09-03T14:30:00.000Z");
  });

  it("treats touching sessions as non-overlapping", () => {
    const firstStart = new Date("2026-09-03T10:00:00.000Z");
    const firstEnd = new Date("2026-09-03T11:00:00.000Z");
    expect(
      intervalsOverlap(
        firstStart,
        firstEnd,
        new Date("2026-09-03T11:00:00.000Z"),
        new Date("2026-09-03T12:00:00.000Z"),
      ),
    ).toBe(false);
    expect(
      intervalsOverlap(
        firstStart,
        firstEnd,
        new Date("2026-09-03T10:59:00.000Z"),
        new Date("2026-09-03T12:00:00.000Z"),
      ),
    ).toBe(true);
  });
});
