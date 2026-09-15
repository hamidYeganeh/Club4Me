import { Capacitor, registerPlugin } from "@capacitor/core";

export type ActivityDay = { date: string; steps: number | null };
export type ActivityAvailability = {
  available: boolean;
  provider: "healthkit" | "health-connect" | "web";
};
export interface ActivityHealthBridge {
  status(): Promise<ActivityAvailability>;
  authorize(): Promise<void>;
  readWeek(): Promise<{ days: ActivityDay[] }>;
}
const bridge = registerPlugin<ActivityHealthBridge>("NativeActivityHealth");
export async function activityAvailability(): Promise<ActivityAvailability> {
  if (!Capacitor.isNativePlatform())
    return { available: false, provider: "web" };
  return bridge.status();
}
export function validateActivityWeek(
  days: ActivityDay[],
  now = Date.now(),
): ActivityDay[] {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const expected = Array.from({ length: 7 }, (_, offset) =>
    formatter.format(new Date(now - (6 - offset) * 86400000)),
  );
  if (
    !Array.isArray(days) ||
    days.length !== 7 ||
    days.some((day) => !day || typeof day.date !== "string") ||
    new Set(days.map((day) => day.date)).size !== 7 ||
    days.some(
      (day) =>
        !expected.includes(day.date) ||
        (day.steps !== null &&
          (!Number.isSafeInteger(day.steps) || day.steps < 0)),
    )
  )
    throw new Error("داده فعالیت معتبر دریافت نشد؛ دوباره تلاش کن.");
  return expected.map((date) => ({
    date,
    steps: days.find((day) => day.date === date)!.steps,
  }));
}
export async function readActivityWeek(
  adapter: ActivityHealthBridge = bridge,
): Promise<ActivityDay[]> {
  return validateActivityWeek((await adapter.readWeek()).days);
}
export async function authorizeActivity(
  adapter: ActivityHealthBridge = bridge,
): Promise<void> {
  await adapter.authorize();
}
export function activityError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "HEALTH_DENIED")
    return "دسترسی به قدم‌ها داده نشده یا لغو شده است. دسترسی را در تنظیمات سلامت دستگاه بررسی کن.";
  if (code === "HEALTH_UNAVAILABLE" || code === "UNIMPLEMENTED")
    return "خواندن فعالیت در این نسخه یا دستگاه در دسترس نیست.";
  return "دریافت فعالیت انجام نشد. دوباره تلاش کن یا دسترسی سلامت دستگاه را بررسی کن.";
}
