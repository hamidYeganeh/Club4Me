import type { CoachAvailabilityRule } from "@api";
import {
  DAY_KEY_TO_DOW,
  DOW_TO_DAY_KEY,
  WEEKDAYS,
  type WeekAvailability,
} from "../../../packages/ui/src/availability-scheduler/types";

export type AvailabilityDetails = Pick<
  CoachAvailabilityRule,
  "deliveryModes" | "clubId" | "validFrom" | "validUntil"
>;
export type AvailabilityDraft = {
  week: WeekAvailability;
  details: Record<string, AvailabilityDetails>;
};
export const AVAILABILITY_MODES = [
  { value: "club", label: "باشگاه" },
  { value: "online", label: "آنلاین" },
  { value: "home", label: "منزل" },
  { value: "outdoor", label: "فضای باز" },
] as const;

export function availabilityDraft(
  rules: CoachAvailabilityRule[],
): AvailabilityDraft {
  const week = Object.fromEntries(
    WEEKDAYS.map(({ key }) => [key, { enabled: false, ranges: [] }]),
  ) as unknown as WeekAvailability;
  const details: Record<string, AvailabilityDetails> = {};
  for (const rule of rules) {
    const key = DOW_TO_DAY_KEY[rule.dayOfWeek];
    if (!key) continue;
    week[key].enabled = true;
    week[key].ranges.push({
      id: rule.id,
      start: time(rule.startMinute),
      end: time(rule.endMinute),
    });
    details[`${key}:${rule.id}`] = {
      deliveryModes: [...rule.deliveryModes],
      clubId: rule.clubId,
      validFrom: rule.validFrom,
      validUntil: rule.validUntil,
    };
  }
  return { week, details };
}

export function newAvailabilityDetails(): AvailabilityDetails {
  // Calendar date in the coach's local market; UTC can still be yesterday.
  const validFrom = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return {
    deliveryModes: ["online"],
    clubId: null,
    validFrom,
    validUntil: null,
  };
}

export function availabilityPayload(
  draft: AvailabilityDraft,
  defaults: AvailabilityDetails,
) {
  const rules = WEEKDAYS.flatMap(({ key }) =>
    draft.week[key].enabled
      ? draft.week[key].ranges.map((range) => ({
          ...(draft.details[`${key}:${range.id}`] ?? defaults),
          dayOfWeek: DAY_KEY_TO_DOW[key],
          startMinute: minutes(range.start),
          endMinute: minutes(range.end),
        }))
      : [],
  );
  for (const rule of rules) {
    if (!rule.deliveryModes.length)
      throw new Error("برای هر بازه حداقل یک شیوه ارائه انتخاب کنید.");
    if (rule.startMinute >= rule.endMinute)
      throw new Error("ساعت پایان باید بعد از شروع باشد.");
    if (
      !rule.validFrom ||
      (rule.validUntil &&
        rule.validFrom.slice(0, 10) > rule.validUntil.slice(0, 10))
    )
      throw new Error("بازه تاریخ اعتبار را اصلاح کنید.");
  }
  return rules;
}
function time(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
function minutes(value: string) {
  const [h = 0, m = 0] = value.split(":").map(Number);
  return h * 60 + m;
}
