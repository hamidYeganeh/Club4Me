const locale = "fa-IR";

export function formatBytes(bytes: number): string {
  const safe = Math.max(0, bytes);
  const megabytes = safe / (1024 * 1024);

  if (megabytes >= 1) {
    return `${megabytes.toLocaleString(locale, {
      maximumFractionDigits: megabytes >= 10 ? 0 : 1,
    })} مگابایت`;
  }

  const kilobytes = safe / 1024;
  if (kilobytes >= 1) {
    return `${kilobytes.toLocaleString(locale, {
      maximumFractionDigits: 0,
    })} کیلوبایت`;
  }

  return `${safe.toLocaleString(locale)} بایت`;
}

export function formatPercent(value: number): string {
  return `${Math.round(Math.min(100, Math.max(0, value))).toLocaleString(locale)}٪`;
}

export function createUploaderFileId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `file-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
