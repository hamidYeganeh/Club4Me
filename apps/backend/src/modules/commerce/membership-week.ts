export type MembershipWeekCalendar = "iso_utc" | "iran_saturday";

const tehranDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tehran",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Existing contracts retain their original counters; new contracts start Saturday in Tehran.
export function membershipWeekKey(
  value: Date,
  calendar?: MembershipWeekCalendar,
) {
  if (calendar !== "iran_saturday") return isoWeekKey(value);
  const parts = tehranDate.formatToParts(value);
  const part = (name: string) =>
    Number(parts.find((p) => p.type === name)!.value);
  const date = new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 1) % 7));
  return `ir-${date.toISOString().slice(0, 10)}`;
}

export function isoWeekKey(value: Date) {
  const date = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${date.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}
