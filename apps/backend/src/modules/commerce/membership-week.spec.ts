import { membershipWeekKey } from "./membership-week";

describe("membership week boundaries", () => {
  it("changes at Saturday midnight Tehran, not UTC midnight", () => {
    expect(
      membershipWeekKey(new Date("2026-09-11T20:29:59.999Z"), "iran_saturday"),
    ).toBe("ir-2026-09-05");
    expect(
      membershipWeekKey(new Date("2026-09-11T20:30:00Z"), "iran_saturday"),
    ).toBe("ir-2026-09-12");
    expect(
      membershipWeekKey(new Date("2026-09-14T00:00:00Z"), "iran_saturday"),
    ).toBe("ir-2026-09-12");
  });
  it("handles year boundaries and the historical Tehran daylight offset", () => {
    expect(
      membershipWeekKey(new Date("2027-01-01T12:00:00Z"), "iran_saturday"),
    ).toBe("ir-2026-12-26");
    expect(
      membershipWeekKey(new Date("2027-01-01T20:30:00Z"), "iran_saturday"),
    ).toBe("ir-2027-01-02");
    expect(
      membershipWeekKey(new Date("2022-07-01T19:30:00Z"), "iran_saturday"),
    ).toBe("ir-2022-07-02");
  });
  it("retains legacy ISO year and UTC Monday boundaries", () => {
    expect(membershipWeekKey(new Date("2021-01-01T00:00:00Z"))).toBe("2020-53");
    expect(membershipWeekKey(new Date("2026-09-13T23:59:59Z"), "iso_utc")).toBe(
      "2026-37",
    );
    expect(membershipWeekKey(new Date("2026-09-14T00:00:00Z"), "iso_utc")).toBe(
      "2026-38",
    );
  });
});
