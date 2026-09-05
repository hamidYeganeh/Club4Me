import { ApiError } from "@api";

export type AccountApiErrorKey =
  | "genericError"
  | "networkError"
  | "rateLimited"
  | "otpInvalid"
  | "otpExpired"
  | "smsFailed"
  | "idCardMismatch"
  | "idCardVerificationFailed"
  | "idCardVerificationUnavailable"
  | "invalidCredentials"
  | "passwordNotSet"
  | "userNotFound"
  | "alreadyGranted"
  | "roleRequestInvalid";

export function getAccountApiErrorMessage(
  error: unknown,
  t: (key: AccountApiErrorKey) => string,
): string {
  if (error instanceof ApiError) {
    if (error.code === "RATE_LIMITED") {
      return t("rateLimited");
    }

    if (error.code === "NETWORK_ERROR") {
      return t("networkError");
    }

    if (error.code === "OTP_INVALID") {
      return t("otpInvalid");
    }

    if (error.code === "OTP_EXPIRED") {
      return t("otpExpired");
    }

    if (error.code === "SMS_FAILED" || error.code === "SMS_NOT_CONFIGURED") {
      return t("smsFailed");
    }

    if (error.code === "ID_CARD_MISMATCH") {
      return t("idCardMismatch");
    }

    if (
      error.code === "ID_CARD_VERIFICATION_FAILED" ||
      error.code === "ID_CARD_VERIFICATION_KEY_MISSING"
    ) {
      return t("idCardVerificationFailed");
    }

    if (error.code === "INVALID_CREDENTIALS") {
      return t("invalidCredentials");
    }

    if (error.code === "PASSWORD_NOT_SET") {
      return t("passwordNotSet");
    }

    if (error.code === "USER_NOT_FOUND") {
      return t("userNotFound");
    }

    if (error.code === "ROLE_ALREADY_GRANTED") {
      return t("alreadyGranted");
    }

    if (error.code === "ROLE_REQUEST_INVALID") {
      return t("roleRequestInvalid");
    }

    return error.message || t("genericError");
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return t("genericError");
}
