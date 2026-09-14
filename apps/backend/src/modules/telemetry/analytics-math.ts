import { EVENTS } from "./events";
export const DAY = 86400_000;
export type AnalyticsEvent = {
  actorId?: unknown;
  anonymousHash?: string | null;
  event?: string;
  occurredAt: Date;
  properties?: Record<string, unknown>;
  source?: string;
  appVersion?: string;
  platform?: string;
};
export function percent(n: number, d: number): number | null {
  return d > 0 ? Math.round((n / d) * 1000) / 10 : null;
}
export function metric(
  key: string,
  label: string,
  value: number,
  previous: number,
  unit = "",
) {
  return {
    key,
    label,
    value,
    previous,
    changePercent: previous
      ? Math.round(((value - previous) / previous) * 1000) / 10
      : null,
    unit,
  };
}
export function analyticsPeriod(
  daysInput?: string,
  endInput?: string,
  now = new Date(),
) {
  const days = Math.min(90, Math.max(7, Math.floor(Number(daysInput) || 30)));
  // Input dates are Tehran calendar-day boundaries; presentation uses the Persian calendar.
  const end =
    endInput && /^\d{4}-\d{2}-\d{2}$/.test(endInput)
      ? new Date(`${endInput}T00:00:00+03:30`)
      : now;
  if (
    !Number.isFinite(end.getTime()) ||
    end > now ||
    end.getTime() < now.getTime() - 90 * DAY
  )
    throw new Error("INVALID_ANALYTICS_DATE");
  return {
    days,
    start: new Date(end.getTime() - days * DAY),
    end,
    previousStart: new Date(end.getTime() - days * 2 * DAY),
  };
}
export function buildBehavior(
  events: AnalyticsEvent[],
  start: Date,
  end: Date,
) {
  const identity = (e: AnalyticsEvent) =>
    e.actorId
      ? `user:${String(e.actorId)}`
      : e.anonymousHash
        ? `anon:${e.anonymousHash}`
        : null;
  const current = events.filter(
    (e) => e.occurredAt >= start && e.occurredAt < end,
  );
  const stages = [
    {
      key: "discovery",
      label: "بازدید یا جست‌وجو",
      events: [
        EVENTS.SEARCH_PERFORMED,
        EVENTS.DISCOVERY_CLUB_VIEWED,
        EVENTS.DISCOVERY_ENTITY_VIEWED,
      ],
    },
    { key: "checkout", label: "شروع رزرو", events: [EVENTS.CHECKOUT_STARTED] },
    {
      key: "reservation",
      label: "ثبت رزرو",
      events: [EVENTS.RESERVATION_CREATED],
    },
    {
      key: "payment",
      label: "پرداخت رزرو",
      events: [EVENTS.PAYMENT_SUCCEEDED],
    },
  ];
  const progress = new Map<string, number>();
  const counts = [0, 0, 0, 0];
  for (const e of [...current].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  )) {
    const id = identity(e);
    if (!id) continue;
    if (
      e.event === EVENTS.PAYMENT_SUCCEEDED &&
      e.properties?.reference_type !== "reservation"
    )
      continue;
    const stage = progress.get(id) ?? 0;
    if (
      (stages[stage]?.events as string[] | undefined)?.includes(e.event ?? "")
    ) {
      counts[stage]!++;
      progress.set(id, stage + 1);
    }
  }
  // Cohorts intentionally start at the first observed reservation within the stored history.
  const reservations = events.filter(
    (e) => e.event === EVENTS.RESERVATION_CREATED && e.source === "server",
  );
  const activity = new Map<string, Date[]>();
  for (const e of reservations) {
    const id = identity(e);
    if (id) activity.set(id, [...(activity.get(id) ?? []), e.occurredAt]);
  }
  const cohorts = new Map<string, Array<Set<string>>>();
  for (const [id, dates] of activity) {
    const first = new Date(Math.min(...dates.map((d) => d.getTime())));
    if (first < start || first >= end) continue;
    const week = tehranWeek(first);
    const key = week.toISOString();
    const buckets =
      cohorts.get(key) ?? Array.from({ length: 5 }, () => new Set<string>());
    for (const date of dates) {
      const i = Math.floor((date.getTime() - week.getTime()) / (7 * DAY));
      if (date < end && i >= 0 && i < 5) buckets[i]!.add(id);
    }
    cohorts.set(key, buckets);
  }
  const unique = (list: AnalyticsEvent[]) =>
    new Set(
      list
        .filter((e) => e.event !== EVENTS.REQUEST_COMPLETED)
        .map(identity)
        .filter(Boolean),
    ).size;
  const searches = current.filter((e) => e.event === EVENTS.SEARCH_PERFORMED);
  const breakdown = (property: string) =>
    [
      ...current.reduce((map, e) => {
        const v = e.properties?.[property];
        if (typeof v === "string" && v) map.set(v, (map.get(v) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
    ]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([key, count]) => ({ key, count }));
  return {
    activeUsers: unique(current),
    dailyActiveUsers: unique(
      events.filter(
        (e) =>
          e.occurredAt < end && e.occurredAt.getTime() >= end.getTime() - DAY,
      ),
    ),
    weeklyActiveUsers: unique(
      events.filter(
        (e) =>
          e.occurredAt < end &&
          e.occurredAt.getTime() >= end.getTime() - 7 * DAY,
      ),
    ),
    monthlyActiveUsers: unique(
      events.filter(
        (e) =>
          e.occurredAt < end &&
          e.occurredAt.getTime() >= end.getTime() - 30 * DAY,
      ),
    ),
    views: current.filter((e) =>
      [EVENTS.DISCOVERY_CLUB_VIEWED, EVENTS.DISCOVERY_ENTITY_VIEWED].includes(
        e.event as never,
      ),
    ).length,
    searchCount: searches.length,
    emptySearches: searches.filter((e) => e.properties?.result_count === 0)
      .length,
    funnel: stages.map((stage, i) => ({
      key: stage.key,
      label: stage.label,
      users: counts[i]!,
      conversionPercent: percent(counts[i]!, counts[0]!) ?? 0,
      stepConversionPercent: i ? percent(counts[i]!, counts[i - 1]!) : null,
    })),
    cohorts: [...cohorts]
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 13)
      .map(([week, buckets]) => ({
        week,
        users: buckets[0]!.size,
        retention: buckets.map((bucket, i) =>
          new Date(week).getTime() + (i + 1) * 7 * DAY > end.getTime()
            ? null
            : percent(bucket.size, buckets[0]!.size),
        ),
      })),
    breakdowns: {
      acquisitionChannel: breakdown("acquisition_channel"),
      sport: breakdown("sport_id"),
      serviceType: breakdown("service_type"),
    },
    versions: [
      ...current.reduce((m, e) => {
        if (e.source !== "server") {
          const key = `${e.platform ?? "web"} / ${e.appVersion ?? "unknown"}`;
          m.set(key, (m.get(key) ?? 0) + 1);
        }
        return m;
      }, new Map<string, number>()),
    ].map(([key, count]) => ({ key, count })),
  };
}
function tehranWeek(date: Date) {
  const shifted = new Date(date.getTime() + 3.5 * 3600_000);
  const start = new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    ),
  );
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 1) % 7));
  return new Date(start.getTime() - 3.5 * 3600_000);
}
