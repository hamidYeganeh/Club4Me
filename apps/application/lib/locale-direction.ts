export type LocaleDirection = "ltr" | "rtl";

const RTL_LOCALE_PREFIXES = ["ar", "fa", "he", "ku", "ps", "ur"];

export function getLocaleDirection(locale: string): LocaleDirection {
  const normalizedLocale = locale.toLowerCase();

  return RTL_LOCALE_PREFIXES.some((prefix) =>
    normalizedLocale === prefix || normalizedLocale.startsWith(`${prefix}-`),
  )
    ? "rtl"
    : "ltr";
}
