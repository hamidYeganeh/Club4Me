export class AppException extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppException";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class AppError extends AppException {
  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(status, code, message, details);
    this.name = "AppError";
  }
}

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function errorBody(
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
