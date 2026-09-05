import { ApiError } from "@api";

export type RequestFailureKind =
  | "offline"
  | "timeout"
  | "permission-denied"
  | "server-error"
  | "unknown";

export type RequestFailurePresentation = {
  kind: RequestFailureKind;
  title: string;
  description: string;
};

export function getRequestFailurePresentation(
  error: unknown,
  online = getBrowserOnlineState(),
): RequestFailurePresentation {
  const code = readErrorCode(error);
  const status = readErrorStatus(error);

  if (online === false) {
    return {
      kind: "offline",
      title: "اینترنت قطع است",
      description: "اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.",
    };
  }

  if (
    code === "REQUEST_TIMEOUT" ||
    code === "TIMEOUT" ||
    /timed?\s*out|timeout/i.test(readErrorMessage(error))
  ) {
    return {
      kind: "timeout",
      title: "پاسخ‌گویی بیش از حد طول کشید",
      description: "ممکن است اتصال کند باشد؛ چند لحظه دیگر دوباره تلاش کنید.",
    };
  }

  if (
    status === 401 ||
    status === 403 ||
    code === "PERMISSION_DENIED" ||
    code === "FORBIDDEN" ||
    code === "denied"
  ) {
    return {
      kind: "permission-denied",
      title: "دسترسی لازم داده نشده است",
      description:
        "مجوز حساب یا دستگاه را بررسی کنید و سپس دوباره تلاش کنید.",
    };
  }

  if (
    (typeof status === "number" && status >= 500) ||
    code === "NETWORK_ERROR"
  ) {
    return {
      kind: "server-error",
      title: "سرویس موقتاً در دسترس نیست",
      description: "اطلاعات شما از بین نرفته است؛ کمی بعد دوباره تلاش کنید.",
    };
  }

  return {
    kind: "unknown",
    title: "دریافت اطلاعات انجام نشد",
    description: "دوباره تلاش کنید؛ اگر مشکل ادامه داشت با پشتیبانی تماس بگیرید.",
  };
}

function getBrowserOnlineState(): boolean | undefined {
  return typeof navigator === "undefined" ? undefined : navigator.onLine;
}

function readErrorCode(error: unknown): string | undefined {
  if (error instanceof ApiError) return error.code;
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  const code = error.code;
  return typeof code === "string" ? code : undefined;
}

function readErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiError) return error.status;
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }
  const status = error.status;
  return typeof status === "number" ? status : undefined;
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "";
}
