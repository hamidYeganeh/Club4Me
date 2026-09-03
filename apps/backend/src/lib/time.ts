const UNIT_SECONDS = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24,
} as const;

export function nowIso(): string {
  return new Date().toISOString();
}

export function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function expiresInToSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/i.exec(value.trim());

  if (match) {
    const amount = Number(match[1]);
    const unit = match[2]!.toLowerCase() as keyof typeof UNIT_SECONDS;
    return amount * UNIT_SECONDS[unit];
  }

  const asNumber = Number(value);

  if (Number.isFinite(asNumber) && asNumber > 0) {
    return asNumber;
  }

  throw new Error(`Invalid expiresIn value: ${value}`);
}
