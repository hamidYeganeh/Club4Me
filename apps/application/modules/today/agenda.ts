import type { SessionReservation } from "@api/domains/reservations/reservations.dto";
import type { CoachBooking } from "@api/domains/coaching/coaching";

export type AgendaItem = {
  id: string;
  source: "club" | "coach";
  title: string;
  startsAt: string;
  endsAt: string;
  paymentPending: boolean;
  href: string;
};
export function upcomingAgenda(reservations: SessionReservation[], bookings: CoachBooking[], now: number): AgendaItem[] {
  return [
    ...reservations.filter((item) => item.status === "reserved").map((item) => ({ ...item, source: "club" as const })),
    ...bookings.filter((item) => item.status === "confirmed" || item.status === "pending").map((item) => ({ ...item, source: "coach" as const })),
  ].filter((item) => {
    if (["failed", "refunded"].includes(item.paymentStatus)) return false;
    if (item.paymentStatus === "pending" && item.paymentExpiresAt && Date.parse(item.paymentExpiresAt) <= now) return false;
    return Number.isFinite(Date.parse(item.sessionStartsAt)) && Date.parse(item.sessionEndsAt) > now;
  }).map((item) => ({
    id: item.id, source: item.source, title: item.sessionTitle,
    startsAt: item.sessionStartsAt, endsAt: item.sessionEndsAt,
    paymentPending: item.paymentStatus === "pending",
    href: `/athlete/reservations/${encodeURIComponent(item.id)}?source=${item.source}`,
  })).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}
export const tehranDay = (value: string | number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
export const sessionTime = (value: string) => new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
export const sessionDate = (value: string | number) => new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", weekday: "long", day: "numeric", month: "long" }).format(new Date(value));
