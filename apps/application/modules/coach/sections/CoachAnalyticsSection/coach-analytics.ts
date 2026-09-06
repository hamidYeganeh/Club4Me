import type { CoachBooking, CoachClass, CoachEnrollment } from "@api";

export const numberFormat = new Intl.NumberFormat("fa-IR");
const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tehran",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const labelFormat = new Intl.DateTimeFormat("fa-IR", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});
const DAY = 86_400_000;

function dayNumber(value: string | Date) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return NaN;
  const parts = dayFormat.formatToParts(date);
  const part = (type: string) =>
    Number(parts.find((item) => item.type === type)?.value);
  return Date.UTC(part("year"), part("month") - 1, part("day")) / DAY;
}

type Payment = Pick<
  CoachBooking,
  "priceSnapshot" | "paymentStatus" | "refundAmount"
>;

// Refunded records may retain part of a payment after a partial refund.
export function retainedPayment(item: Payment) {
  if (item.paymentStatus !== "paid" && item.paymentStatus !== "refunded")
    return 0;
  const amount = Math.max(0, item.priceSnapshot.amount);
  const refund =
    item.refundAmount ?? (item.paymentStatus === "refunded" ? amount : 0);
  return Math.max(0, amount - Math.max(0, refund));
}

export function buildCoachAnalytics(
  classes: CoachClass[],
  bookings: CoachBooking[],
  enrollments: CoachEnrollment[],
  days: number,
  currency: string,
  now = new Date(),
) {
  const today = dayNumber(now);
  const start = today - days + 1;
  const bucketSize = Math.ceil(days / 6);
  const trend = Array.from(
    { length: Math.ceil(days / bucketSize) },
    (_, index) => {
      const first = start + index * bucketSize;
      const last = Math.min(today, first + bucketSize - 1);
      return {
        label: labelFormat.format(new Date(first * DAY)),
        fullLabel: `${labelFormat.format(new Date(first * DAY))} تا ${labelFormat.format(new Date(last * DAY))}`,
        bookings: 0,
        enrollments: 0,
        income: 0,
      };
    },
  );
  const statuses = [
    { label: "در انتظار", value: 0 },
    { label: "تأییدشده", value: 0 },
    { label: "انجام‌شده", value: 0 },
    { label: "لغو / رد", value: 0 },
    { label: "عدم حضور", value: 0 },
  ];
  const add = (
    item: CoachBooking | CoachEnrollment,
    kind: "bookings" | "enrollments",
    date: string,
  ) => {
    const day = dayNumber(date);
    if (!Number.isFinite(day) || day < start || day > today) return;
    const bucket = trend[Math.floor((day - start) / bucketSize)];
    bucket[kind] += 1;
    if (item.priceSnapshot.currency === currency)
      bucket.income += retainedPayment(item);
    const index =
      item.status === "pending"
        ? 0
        : item.status === "confirmed" || item.status === "active"
          ? 1
          : item.status === "completed"
            ? 2
            : item.status === "no_show"
              ? 4
              : 3;
    statuses[index].value += 1;
  };
  bookings.forEach((item) => add(item, "bookings", item.bookedAt));
  enrollments.forEach((item) => add(item, "enrollments", item.registeredAt));
  const activeClasses = classes.filter((item) =>
    ["published", "registration_closed", "in_progress"].includes(item.status),
  );
  const capacity = activeClasses.reduce((sum, item) => sum + item.capacity, 0);
  const occupied = activeClasses.reduce(
    (sum, item) => sum + item.enrollmentCount,
    0,
  );
  const occupancy = [...activeClasses]
    .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
    .slice(0, 6)
    .map((item, index) => ({
      label: numberFormat.format(index + 1),
      fullLabel: item.title,
      enrolled: item.enrollmentCount,
      available: Math.max(0, item.capacity - item.enrollmentCount),
    }));
  return {
    trend,
    statuses,
    occupancy,
    activeClasses: activeClasses.length,
    occupancyPercent: capacity ? Math.round((occupied / capacity) * 100) : 0,
    capacity,
    occupied,
    income: trend.reduce((sum, item) => sum + item.income, 0),
    reservations: trend.reduce(
      (sum, item) => sum + item.bookings + item.enrollments,
      0,
    ),
  };
}
