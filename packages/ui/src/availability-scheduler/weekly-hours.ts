import {
  DAY_KEY_TO_DOW,
  DOW_TO_DAY_KEY,
  type DayKey,
  defaultWeek,
  type WeekAvailability,
  WEEKDAYS,
} from "./types";

export type ClubWeeklyHour = {
  dayOfWeek: number;
  periods: Array<{ opensAt: string; closesAt: string }>;
  isClosed: boolean;
};

/** Convert API `weeklyHours` into scheduler state. Empty input → default week. */
export function weeklyHoursToWeekAvailability(
  weeklyHours: ClubWeeklyHour[],
): WeekAvailability {
  if (!weeklyHours.length) return defaultWeek();

  const byDow = new Map(weeklyHours.map((item) => [item.dayOfWeek, item]));
  const week = {} as WeekAvailability;

  for (const { key } of WEEKDAYS) {
    const dow = DAY_KEY_TO_DOW[key];
    const day = byDow.get(dow);
    if (!day || day.isClosed) {
      week[key] = {
        enabled: false,
        ranges: [{ id: `${key}-0`, start: "09:00", end: "17:00" }],
      };
      continue;
    }
    const periods = day.periods.slice(0, 4);
    week[key] = {
      enabled: periods.length > 0,
      ranges:
        periods.length > 0
          ? periods.map((period, index) => ({
              id: `${key}-${index}`,
              start: period.opensAt,
              end: period.closesAt,
            }))
          : [{ id: `${key}-0`, start: "09:00", end: "17:00" }],
    };
  }

  return week;
}

/** Convert scheduler state into API `weeklyHours` (always 7 days). */
export function weekAvailabilityToWeeklyHours(
  week: WeekAvailability,
): ClubWeeklyHour[] {
  return (Object.keys(DAY_KEY_TO_DOW) as DayKey[])
    .map((key) => {
      const day = week[key];
      const dayOfWeek = DAY_KEY_TO_DOW[key];
      if (!day.enabled || day.ranges.length === 0) {
        return { dayOfWeek, periods: [], isClosed: true };
      }
      return {
        dayOfWeek,
        isClosed: false,
        periods: day.ranges.slice(0, 4).map((range) => ({
          opensAt: range.start,
          closesAt: range.end,
        })),
      };
    })
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

export function ensureDayKey(dayOfWeek: number): DayKey {
  return DOW_TO_DAY_KEY[dayOfWeek] ?? "sat";
}
