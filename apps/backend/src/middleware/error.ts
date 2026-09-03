import type { ErrorHandler, NotFoundHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { HTTPException } from "hono/http-exception";

import { AppError } from "../lib/errors.js";
import type { ApiErrorBody } from "../lib/http.js";
import type { AppEnv } from "../types.js";

function errorBody(
  code: string,
  message: string,
  details?: unknown,
): ApiErrorBody {
  return {
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };
}

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  if (err instanceof AppError) {
    return c.json(
      errorBody(err.code, err.message, err.details),
      err.status as ContentfulStatusCode,
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      errorBody("HTTP_ERROR", err.message),
      err.status as ContentfulStatusCode,
    );
  }

  if (err instanceof SyntaxError) {
    return c.json(errorBody("INVALID_JSON", "Invalid JSON body"), 400);
  }

  console.error(err);

  return c.json(errorBody("INTERNAL_ERROR", "Internal server error"), 500);
};

export const notFoundHandler: NotFoundHandler<AppEnv> = (c) => {
  return c.json(errorBody("NOT_FOUND", "Route not found"), 404);
};
