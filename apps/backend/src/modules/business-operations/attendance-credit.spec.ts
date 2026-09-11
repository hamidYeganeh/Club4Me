import {
  attendanceCredit,
  attendanceAudit,
  attendanceTimes,
} from "./attendance-credit";
describe("attendance credit", () => {
  it("consumes once, restores once and rejects exhausted new attendance", () => {
    expect(attendanceCredit(1, 8, undefined, "present")).toBe(0);
    expect(attendanceCredit(0, 8, "present", "present")).toBe(0);
    expect(() => attendanceCredit(0, 8, "absent", "present")).toThrow(
      expect.objectContaining({ code: "CLASS_CREDIT_EXHAUSTED" }),
    );
    expect(attendanceCredit(0, 8, "present", "absent")).toBe(1);
    expect(attendanceCredit(1, 8, "absent", "excused")).toBe(1);
    expect(attendanceCredit(8, 8, "present", "absent")).toBe(8);
    expect(attendanceCredit(null, null, undefined, "present")).toBeNull();
  });
  it("keeps idempotent repeats out of change history", () => {
    expect(attendanceAudit("actor", "present", "present", 0, 0)).toEqual({});
    expect(attendanceAudit("actor", "present", "absent", 0, 1)).toMatchObject({
      $push: {
        changes: {
          actorId: "actor",
          before: "present",
          after: "absent",
          beforeCredits: 0,
          afterCredits: 1,
        },
      },
    });
  });
});

describe("attendance arrival and departure", () => {
  const arrival = new Date("2030-01-01T10:00:00Z");
  const departure = new Date("2030-01-01T11:00:00Z");
  it("preserves the first arrival and departure on retries", () => {
    const previous = {
      status: "present",
      checkedInAt: arrival,
      checkInMethod: "qr",
    };
    expect(attendanceTimes(previous, "present", false, departure)).toEqual({
      checkedInAt: arrival,
      checkInMethod: "qr",
      checkedOutAt: null,
    });
    const exited = attendanceTimes(previous, "present", true, departure);
    expect(exited.checkedInAt).toEqual(arrival);
    expect(exited.checkedOutAt).toEqual(departure);
    expect(
      attendanceTimes(
        { status: "present", ...exited },
        "present",
        true,
        new Date("2030-01-01T12:00:00Z"),
      ),
    ).toEqual(exited);
  });
  it("rejects departure without arrival and clears times for absence", () => {
    expect(() => attendanceTimes(null, "present", true)).toThrow(
      expect.objectContaining({ code: "ATTENDANCE_CHECKOUT_REQUIRES_CHECKIN" }),
    );
    expect(
      attendanceTimes({ status: "present", checkedInAt: arrival }, "absent"),
    ).toMatchObject({ checkedInAt: null, checkedOutAt: null });
  });
});
