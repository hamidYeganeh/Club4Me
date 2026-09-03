import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ObjectId } from "mongodb";

import { AppError } from "./errors.js";
import type { AppEnv } from "../types.js";

export const CURRENT_API_VERSION = "v1" as const;
export const API_VERSIONS = ["v1"] as const;

export type ApiSuccess<T> = {
  data: T;
  meta: {
    version: (typeof API_VERSIONS)[number];
  };
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function ok<T>(
  c: Context<AppEnv>,
  data: T,
  status: ContentfulStatusCode = 200,
) {
  return c.json(
    {
      data,
      meta: { version: CURRENT_API_VERSION },
    } satisfies ApiSuccess<T>,
    status,
  );
}

export function toObjectId(id: string, field = "id"): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", `Invalid ${field}`);
  }

  return new ObjectId(id);
}

export function idOf(id: ObjectId): string {
  return id.toHexString();
}

export function iso(date: Date): string {
  return date.toISOString();
}
