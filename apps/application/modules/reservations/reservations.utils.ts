import { RESERVATION_ICONS } from "./reservations.constants";
import type {
  ReservationDateOption,
  TimelineReservation,
} from "./reservations.types";

const weekdayFormatter = new Intl.DateTimeFormat("fa-IR", {
  weekday: "short",
});
const dayFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const shortDateFormatter = new Intl.DateTimeFormat("fa-IR", {
  day: "numeric",
  month: "short",
});

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toReservationDateKey(iso: string): string {
  return toDateKey(new Date(iso));
}

export function formatReservationTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatReservationDate(iso: string): string {
  return shortDateFormatter.format(new Date(iso));
}

export function durationMinutes(startsAt: string, endsAt: string): number {
  const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  return Math.max(1, Math.round(ms / 60_000));
}

export function reservationIcon(
  reservation: Pick<TimelineReservation, "source" | "sessionTitle">,
) {
  const iconsBySource = {
    club: "building-2",
    coach: "user",
    class: "users-three",
  } as const;

  if (reservation.source) {
    return iconsBySource[reservation.source];
  }

  const { sessionTitle: title } = reservation;
  let hash = 0;
  for (let index = 0; index < title.length; index += 1) {
    hash =
      (hash + title.charCodeAt(index) * (index + 1)) % RESERVATION_ICONS.length;
  }
  return RESERVATION_ICONS[hash] ?? RESERVATION_ICONS[0];
}

export function buildDateStrip(
  center: Date,
  pastDays: number,
  futureDays: number,
): ReservationDateOption[] {
  const start = addDays(startOfDay(center), -pastDays);
  const total = pastDays + 1 + futureDays;

  return Array.from({ length: total }, (_, index) => {
    const date = addDays(start, index);
    return {
      key: toDateKey(date),
      weekday: weekdayFormatter.format(date),
      day: dayFormatter.format(date),
    };
  });
}

/** Days of the Persian month containing the selected local date, including leap Esfand. */
export function buildMonthDates(center: Date): ReservationDateOption[] {
  const formatter = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "numeric",
  });
  const month = formatter.format(center);
  let start = startOfDay(center);
  while (formatter.format(addDays(start, -1)) === month)
    start = addDays(start, -1);
  let count = 1;
  while (formatter.format(addDays(start, count)) === month) count += 1;
  return buildDateStrip(start, 0, count - 1);
}
