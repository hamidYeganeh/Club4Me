export const defaultLocale = "fa" as const;

export const locales = [defaultLocale] as const;

export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  fa: "فارسی",
};

/** Iran timezone for next-intl date/time formatting */
export const timeZone = "Asia/Tehran";
