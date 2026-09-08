import {
  CalendarDate,
  PersianCalendar,
  GregorianCalendar,
  parseDate,
  parseDateTime,
  toCalendar,
  toZoned,
  fromDate,
} from "@internationalized/date";

export const IRAN_TIME_ZONE = "Asia/Tehran";
const persian = new PersianCalendar();
const gregorian = new GregorianCalendar();
export function asciiDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632));
}
export function iranDateInputValue(value: string, withTime = false) {
  if (!value) return "";
  try {
    const civil = withTime ? parseDateTime(value) : parseDate(value);
    const date = toCalendar(civil, persian);
    const dateText = `${date.year}/${String(date.month).padStart(2, "0")}/${String(date.day).padStart(2, "0")}`;
    return dateText + (withTime ? ` ${value.slice(11, 16)}` : "");
  } catch {
    return "";
  }
}
export function parseIranDateInput(
  value: string,
  withTime = false,
): string | null {
  const normalized = asciiDigits(value.trim());
  const match = normalized.match(
    withTime
      ? /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})[ T](\d{1,2}):(\d{2})$/
      : /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/,
  );
  if (!match) return null;
  const year = Number(match[1]),
    month = Number(match[2]),
    day = Number(match[3]);
  if (year < 1200 || year > 1600) return null;
  const date = new CalendarDate(persian, year, month, day);
  if (date.year !== year || date.month !== month || date.day !== day)
    return null;
  const civil = toCalendar(date, gregorian).toString();
  if (!withTime) return civil;
  const hour = Number(match[4]),
    minute = Number(match[5]);
  if (hour > 23 || minute > 59) return null;
  return `${civil}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
// Interpret service input in Tehran regardless of the device's timezone.
export function tehranLocalDate(value: string): Date {
  try {
    return toZoned(
      parseDateTime(asciiDigits(value)),
      IRAN_TIME_ZONE,
      "reject",
    ).toDate();
  } catch {
    return new Date(NaN);
  }
}
export function tehranLocalValue(value?: string): string {
  if (!value) return "";
  try {
    const date = fromDate(new Date(value), IRAN_TIME_ZONE);
    return `${String(date.year).padStart(4, "0")}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}T${String(date.hour).padStart(2, "0")}:${String(date.minute).padStart(2, "0")}`;
  } catch {
    return "";
  }
}
