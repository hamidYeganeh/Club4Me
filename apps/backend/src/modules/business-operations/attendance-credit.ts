import { AppError } from "../../common/errors/app.exception";

type AttendanceStatus = "present" | "absent" | "excused";
export function attendanceCredit(
  remaining: number | null,
  total: number | null,
  previous: AttendanceStatus | undefined,
  next: AttendanceStatus,
): number | null {
  if (remaining === null || previous === next) return remaining;
  if (next === "present") {
    if (remaining <= 0)
      throw new AppError(
        409,
        "CLASS_CREDIT_EXHAUSTED",
        "No class sessions remain",
      );
    return remaining - 1;
  }
  return previous === "present"
    ? Math.min(total ?? Infinity, remaining + 1)
    : remaining;
}
export function attendanceAudit(
  actorId: string,
  previous: AttendanceStatus | undefined,
  next: AttendanceStatus,
  beforeCredits: number | null,
  afterCredits: number | null,
) {
  return previous === next
    ? {}
    : {
        $push: {
          changes: {
            actorId,
            at: new Date(),
            before: previous ?? "unrecorded",
            after: next,
            beforeCredits,
            afterCredits,
          },
        },
      };
}
