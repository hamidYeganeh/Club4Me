export const COACH_REVIEW_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "suspended",
] as const;
export type CoachReviewStatus = (typeof COACH_REVIEW_STATUSES)[number];

export const COACH_VISIBILITIES = ["hidden", "public"] as const;
export type CoachVisibility = (typeof COACH_VISIBILITIES)[number];

export const DELIVERY_MODES = ["club", "online", "home", "outdoor"] as const;
export type DeliveryMode = (typeof DELIVERY_MODES)[number];

export const OFFERING_TYPES = [
  "private",
  "semi_private",
  "group",
  "assessment",
] as const;
export type OfferingType = (typeof OFFERING_TYPES)[number];

export const OFFERING_STATUSES = ["draft", "published", "archived"] as const;
export type OfferingStatus = (typeof OFFERING_STATUSES)[number];

export const CLASS_STATUSES = [
  "draft",
  "published",
  "registration_closed",
  "in_progress",
  "completed",
  "cancelled",
  "archived",
] as const;
export type TrainingClassStatus = (typeof CLASS_STATUSES)[number];

export const SESSION_STATUSES = [
  "scheduled",
  "open_for_booking",
  "full",
  "started",
  "completed",
  "cancelled",
  "rescheduled",
] as const;
export type TrainingSessionStatus = (typeof SESSION_STATUSES)[number];

export const ENROLLMENT_STATUSES = [
  "pending",
  "active",
  "rejected",
  "cancelled",
  "completed",
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "rejected",
  "cancelled_by_athlete",
  "cancelled_by_coach",
  "completed",
  "no_show",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "excused",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "not_required",
  "pending",
  "paid",
  "refunded",
  "failed",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const IRAN_TIMEZONE = "Asia/Tehran";
