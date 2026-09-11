import { z } from "zod";

export const recommendationPreferencesSchema = z
  .object({
    weekdays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
    timeFrom: z
      .string()
      .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/)
      .default(""),
    timeTo: z
      .string()
      .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/)
      .default(""),
    maxPrice: z.number().int().min(0).max(1e12).nullable().default(null),
    radiusKm: z.number().min(0.5).max(100).nullable().default(null),
    level: z.string().trim().max(80).default(""),
    sport: z.string().trim().max(120).default(""),
    availableOnly: z.boolean().default(true),
  })
  .refine(
    (p) => !p.timeFrom || !p.timeTo || p.timeFrom <= p.timeTo,
    "بازه ساعت معتبر نیست",
  );
export type RecommendationPreferences = z.infer<
  typeof recommendationPreferencesSchema
>;
const normalize = (s: string) =>
  s.trim().replace(/[يى]/g, "ی").replace(/ك/g, "ک").toLowerCase();
const parts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tehran",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const days = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
export function recommendationMismatches(
  item: {
    price: number;
    currency: string;
    level: string;
    sport: string;
    remainingCapacity: number;
    distanceKm: number | null;
    sessions: {
      startsAt: Date | string;
      endsAt: Date | string;
      status: string;
    }[];
  },
  p: RecommendationPreferences,
  now = Date.now(),
) {
  const reasons: string[] = [];
  if (
    p.maxPrice !== null &&
    (item.currency !== "IRR" || item.price > p.maxPrice)
  )
    reasons.push("خارج از بودجه انتخابی");
  if (
    p.radiusKm !== null &&
    (item.distanceKm === null || item.distanceKm > p.radiusKm)
  )
    reasons.push(
      item.distanceKm === null
        ? "فاصله مشخص نیست؛ موقعیت پیش‌فرض را بررسی کنید"
        : "دورتر از محدوده انتخابی",
    );
  if (p.level && normalize(item.level) !== normalize(p.level))
    reasons.push("سطح متفاوت");
  if (p.sport && !normalize(item.sport).includes(normalize(p.sport)))
    reasons.push("رشته متفاوت");
  if (p.availableOnly && item.remainingCapacity <= 0)
    reasons.push("فقط لیست انتظار");
  if (p.weekdays.length || p.timeFrom || p.timeTo) {
    const upcoming = item.sessions.filter(
      (s) => s.status === "scheduled" && +new Date(s.startsAt) > now,
    );
    // Every remaining session must fit, so a multi-day course is not recommended for one matching day alone.
    if (
      !upcoming.length ||
      !upcoming.every((s) => {
        const start = Object.fromEntries(
          parts
            .formatToParts(new Date(s.startsAt))
            .map((p) => [p.type, p.value]),
        );
        const end = Object.fromEntries(
          parts.formatToParts(new Date(s.endsAt)).map((p) => [p.type, p.value]),
        );
        return (
          (!p.weekdays.length ||
            p.weekdays.includes(days.indexOf(start.weekday!))) &&
          (!p.timeFrom || `${start.hour}:${start.minute}` >= p.timeFrom) &&
          (!p.timeTo ||
            (start.weekday === end.weekday &&
              `${end.hour}:${end.minute}` <= p.timeTo))
        );
      })
    )
      reasons.push("زمان برگزاری با برنامه شما هماهنگ نیست");
  }
  return reasons;
}
