import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import * as Sentry from "@sentry/node";
import type { Request, Response } from "express";

import { AppException, errorBody } from "../errors/app.exception";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof AppException) {
      response
        .status(exception.status)
        .json(errorBody(exception.code, exception.message, exception.details));
      return;
    }

    if (exception instanceof SyntaxError || isInvalidJson(exception, request)) {
      response.status(400).json(errorBody("INVALID_JSON", "Invalid JSON body"));
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const message =
        typeof payload === "string"
          ? payload
          : getHttpMessage(payload, exception.message);

      response
        .status(status)
        .json(
          errorBody(
            status === HttpStatus.UNAUTHORIZED
              ? "UNAUTHORIZED"
              : status === HttpStatus.TOO_MANY_REQUESTS
                ? "RATE_LIMITED"
                : "HTTP_ERROR",
            message,
          ),
        );
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.message : "Unknown error",
      exception instanceof Error ? exception.stack : undefined,
    );
    Sentry.withScope((scope) => {
      scope.setTag("http.method", request.method);
      scope.setContext("request", {
        method: request.method,
        path: request.path,
      });
      Sentry.captureException(exception);
    });

    response
      .status(500)
      .json(errorBody("INTERNAL_ERROR", "Internal server error"));
  }
}

function isInvalidJson(exception: unknown, request: Request): boolean {
  if (typeof exception !== "object" || exception === null) {
    return false;
  }

  const error = exception as {
    type?: unknown;
    status?: unknown;
    body?: unknown;
  };
  return (
    error.type === "entity.parse.failed" ||
    (request.readableEnded === false && error.status === 400 && "body" in error)
  );
}

function getHttpMessage(payload: unknown, fallback: string): string {
  if (typeof payload !== "object" || payload === null) {
    return fallback;
  }

  if (
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string"
  ) {
    return (payload as { message: string }).message;
  }

  return fallback;
}
