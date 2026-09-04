import { RESERVATION_ICONS } from "./reservations.constants";
import type { ReservationDateOption } from "./reservations.types";

const weekdayFormatter = new Intl.DateTimeFormat("fa-IR", {
  weekday: "narrow",
});
const dayFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
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

export function durationMinutes(startsAt: string, endsAt: string): number {
  const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  return Math.max(1, Math.round(ms / 60_000));
}

export function reservationIcon(title: string) {
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
