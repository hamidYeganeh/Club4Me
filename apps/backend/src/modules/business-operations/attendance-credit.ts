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
  event?: "checked_out",
) {
  return previous === next && !event
    ? {}
    : {
        $push: {
          changes: {
            actorId,
            at: new Date(),
            before: previous ?? "unrecorded",
            after: event ?? next,
            beforeCredits,
            afterCredits,
          },
        },
      };
}

/** Repeated marks preserve arrival/departure times; departure requires a recorded arrival. */
export function attendanceTimes(
  previous: {
    status: string;
    checkedInAt?: Date | null;
    checkedOutAt?: Date | null;
    checkInMethod?: string;
  } | null,
  status: AttendanceStatus,
  checkedOut = false,
  now = new Date(),
) {
  if (
    checkedOut &&
    (status !== "present" ||
      previous?.status !== "present" ||
      !previous.checkedInAt)
  ) {
    throw new AppError(
      409,
      "ATTENDANCE_CHECKOUT_REQUIRES_CHECKIN",
      "Record arrival before departure",
    );
  }
  return {
    checkedInAt: status === "present" ? (previous?.checkedInAt ?? now) : null,
    checkedOutAt:
      status === "present"
        ? (previous?.checkedOutAt ?? (checkedOut ? now : null))
        : null,
    checkInMethod:
      status === "present" && previous?.status === "present"
        ? (previous.checkInMethod ?? "manual")
        : "manual",
  };
}
