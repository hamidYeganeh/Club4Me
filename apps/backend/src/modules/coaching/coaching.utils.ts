import { Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";

export function objectId(
  value: string,
  code = "RESOURCE_NOT_FOUND",
): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, code, "Resource not found");
  }
  return new Types.ObjectId(value);
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("fa")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");
}

export function uniqueObjectIds(ids: string[]): Types.ObjectId[] {
  return [...new Set(ids)].map((id) => objectId(id));
}

export function toPublicDocument<
  T extends { toObject: (options?: object) => unknown },
>(document: T): Record<string, unknown> {
  return normalizeMongoValue(
    document.toObject({ versionKey: false }),
  ) as Record<string, unknown>;
}

function normalizeMongoValue(value: unknown): unknown {
  if (value instanceof Types.ObjectId) return value.toHexString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeMongoValue);
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(source)) {
      if (key === "__v") continue;
      result[key === "_id" ? "id" : key] = normalizeMongoValue(child);
    }
    return result;
  }
  return value;
}

export function intervalsOverlap(
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date,
): boolean {
  return firstStart < secondEnd && secondStart < firstEnd;
}

export function zonedDateAtMinute(
  date: Date,
  minuteOfDay: number,
  timezone: string,
): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const desiredWallClock = Date.UTC(year, month, day, hour, minute, 0, 0);
  let candidate = desiredWallClock;

  for (let iteration = 0; iteration < 2; iteration += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(candidate));
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    const renderedWallClock = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );
    candidate -= renderedWallClock - desiredWallClock;
  }

  return new Date(candidate);
}
