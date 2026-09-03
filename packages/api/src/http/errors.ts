import axios from "axios";

export class ApiError extends Error {
  readonly status?: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    options: { status?: number; code: string; details?: unknown },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiErrorBody(
  value: unknown,
): value is { error: { code: string; message: string; details?: unknown } } {
  if (!isRecord(value) || !isRecord(value.error)) {
    return false;
  }

  return (
    typeof value.error.code === "string" &&
    typeof value.error.message === "string"
  );
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;

    if (isApiErrorBody(data)) {
      return new ApiError(data.error.message, {
        status: error.response?.status,
        code: data.error.code,
        details: data.error.details,
      });
    }

    return new ApiError(error.message || "Request failed", {
      status: error.response?.status,
      code: "NETWORK_ERROR",
    });
  }

  if (error instanceof Error) {
    return new ApiError(error.message, { code: "UNKNOWN" });
  }

  return new ApiError("Unknown error", { code: "UNKNOWN" });
}
