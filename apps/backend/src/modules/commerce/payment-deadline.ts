/** Price/capacity holds use the same server deadline across products. */
export function paymentDeadline(
  start?: Date,
  now = Date.now(),
  minutes = Number(process.env.PAYMENT_HOLD_MINUTES ?? 15),
) {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 120)
    throw new Error("PAYMENT_HOLD_MINUTES must be an integer from 1 to 120");
  return new Date(
    Math.min(now + minutes * 60_000, start?.getTime() ?? Infinity),
  );
}
