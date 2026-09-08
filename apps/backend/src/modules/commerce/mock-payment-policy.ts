import { AppError } from "../../common/errors/app.exception";

/** A production demo must explicitly opt in to simulated money. */
export function assertMockPaymentsEnabled(
  environment = process.env.NODE_ENV,
  mode = process.env.PAYMENT_MODE,
) {
  if (
    mode === "disabled" ||
    (environment === "production" && mode !== "simulation")
  ) {
    throw new AppError(
      503,
      "MOCK_PAYMENT_DISABLED",
      "پرداخت آزمایشی در محیط عملیاتی غیرفعال است.",
    );
  }
}
