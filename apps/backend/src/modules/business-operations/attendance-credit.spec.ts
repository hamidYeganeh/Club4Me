import { attendanceCredit, attendanceAudit } from "./attendance-credit";
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
