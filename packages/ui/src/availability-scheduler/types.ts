export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type TimeRange = { id: string; start: string; end: string };
export type DayAvailability = { enabled: boolean; ranges: TimeRange[] };
export type WeekAvailability = Record<DayKey, DayAvailability>;
export type TimeOption = { value: string; label: string };

export const WEEKDAYS: { key: DayKey; label: string }[] = [
  { key: "sat", label: "شنبه" },
  { key: "sun", label: "یکشنبه" },
  { key: "mon", label: "دوشنبه" },
  { key: "tue", label: "سه‌شنبه" },
  { key: "wed", label: "چهارشنبه" },
  { key: "thu", label: "پنجشنبه" },
  { key: "fri", label: "جمعه" },
];

/** JS `Date.getDay()` mapping: 0=Sun … 6=Sat */
export const DAY_KEY_TO_DOW: Record<DayKey, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export const DOW_TO_DAY_KEY: Record<number, DayKey> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

// ─── panels ──────────────────────────────────────────────────────────────────

/**
 * Names one time field week-wide, because the scheduler holds a single open
 * panel for the whole week. Range ids belong to the value and are only unique
 * within a day, so the day is part of the name — and the scheduler builds the
 * same keys to ask whether the panel it is holding is still on screen.
 */
export const panelKey = (day: DayKey, rangeId: string, edge: "start" | "end") =>
  `${day}:${rangeId}:${edge}`;

// ─── time helpers ────────────────────────────────────────────────────────────

export const toMinutes = (v: string) => {
  const parts = v.split(":").map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  return h * 60 + m;
};

export const toValue = (mins: number) => {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, mins));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const labelTime = (v: string) => v;

export function buildOptions(step: number): TimeOption[] {
  const out: TimeOption[] = [];
  for (let m = 0; m < 24 * 60; m += step) {
    const value = toValue(m);
    out.push({ value, label: labelTime(value) });
  }
  return out;
}

function snapToOption(mins: number, slots: number[]) {
  let best = slots[0] ?? 0;
  for (const slot of slots) {
    if (Math.abs(slot - mins) < Math.abs(best - mins)) best = slot;
  }
  return best;
}

function withCurrentOption(
  filtered: TimeOption[],
  all: TimeOption[],
  current?: string,
) {
  if (!current || filtered.some((o) => o.value === current)) return filtered;
  const extra =
    all.find((o) => o.value === current) ??
    ({ value: current, label: labelTime(current) } satisfies TimeOption);
  return [...filtered, extra].sort(
    (a, b) => toMinutes(a.value) - toMinutes(b.value),
  );
}

/**
 * Same-day ranges only. A valid pair is left alone so an off-grid persisted
 * end (17:00 with `step={720}`) is not rewritten. When the invariant fails,
 * the just-selected endpoint stays and only the opposite side moves onto a
 * neighboring generated option.
 */
export function clampRange(
  start: string,
  end: string,
  options: TimeOption[],
  changed: "start" | "end" = "start",
): { start: string; end: string } {
  const slots = options.map((o) => toMinutes(o.value));
  if (slots.length === 0) return { start, end };

  const startM = toMinutes(start);
  const endM = toMinutes(end);
  if (endM > startM) return { start, end };

  const keepOrSnap = (value: string) => {
    const mins = toMinutes(value);
    return slots.includes(mins) ? mins : snapToOption(mins, slots);
  };

  if (changed === "end") {
    const e = keepOrSnap(end);
    const earlier = [...slots].reverse().find((slot) => slot < e);
    if (earlier === undefined && slots.length > 1) {
      // Midnight cannot end a positive same-day range, so use the first pair.
      return {
        start: toValue(slots[0] ?? 0),
        end: toValue(slots[1] ?? 60),
      };
    }
    return {
      start: toValue(earlier ?? keepOrSnap(start)),
      end: toValue(e),
    };
  }

  const s = keepOrSnap(start);
  const later = slots.find((slot) => slot > s);
  if (later === undefined && slots.length > 1) {
    // The last slot cannot start a positive range, so use the final pair.
    return {
      start: toValue(slots[slots.length - 2] ?? 0),
      end: toValue(slots[slots.length - 1] ?? 60),
    };
  }
  return {
    start: toValue(s),
    end: toValue(later ?? keepOrSnap(end)),
  };
}

export function startOptions(
  options: TimeOption[],
  end: string,
  current?: string,
) {
  const filtered = options.filter(
    (o) => toMinutes(o.value) < toMinutes(end),
  );
  // An invalid midnight end has no earlier option; expose midnight so choosing
  // it can move the end forward through clampRange instead of trapping the row.
  const recovery = filtered.length === 0 ? options.slice(0, 1) : filtered;
  return withCurrentOption(
    recovery,
    options,
    current,
  );
}

export function endOptions(
  options: TimeOption[],
  start: string,
  current?: string,
) {
  const filtered = options.filter(
    (o) => toMinutes(o.value) > toMinutes(start),
  );
  // An invalid last-slot start has no later option; expose the last slot so
  // choosing it can move the start backward through clampRange.
  const recovery = filtered.length === 0 ? options.slice(-1) : filtered;
  return withCurrentOption(
    recovery,
    options,
    current,
  );
}

// Default: Mon–Fri 9–5, weekend off. Fixed ids so SSR and first client render
// agree (new ranges get counter ids afterwards).
export function defaultWeek(): WeekAvailability {
  const workday = (day: DayKey): DayAvailability => ({
    enabled: true,
    ranges: [{ id: `${day}-0`, start: "09:00", end: "17:00" }],
  });
  const off = (day: DayKey): DayAvailability => ({
    enabled: false,
    ranges: [{ id: `${day}-0`, start: "09:00", end: "17:00" }],
  });
  return {
    mon: workday("mon"),
    tue: workday("tue"),
    wed: workday("wed"),
    thu: workday("thu"),
    fri: workday("fri"),
    sat: off("sat"),
    sun: off("sun"),
  };
}
