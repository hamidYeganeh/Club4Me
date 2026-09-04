import { calculateRefund } from "../../reservations/refund-policy";

export type CoachCancellationPolicy = {
  title: string;
  tiers: Array<{ hoursBefore: number; refundPercent: number }>;
  reservationCutoffMinutes: number;
  rescheduleCutoffMinutes: number;
  noShowRefundPercent: number;
  ownerCancellationRefundPercent: number;
};

export function normalizeCoachCancellationPolicy(
  value: Record<string, unknown> | null | undefined,
): CoachCancellationPolicy {
  const source = value ?? {};
  const tiers = Array.isArray(source.tiers)
    ? source.tiers.flatMap((tier) => {
        if (!tier || typeof tier !== "object") return [];
        const item = tier as Record<string, unknown>;
        if (
          typeof item.hoursBefore !== "number" ||
          typeof item.refundPercent !== "number"
        ) {
          return [];
        }
        return [
          {
            hoursBefore: Math.max(0, item.hoursBefore),
            refundPercent: clampPercent(item.refundPercent),
          },
        ];
      })
    : [];
  if (!tiers.some((tier) => tier.hoursBefore === 0)) {
    tiers.push({ hoursBefore: 0, refundPercent: 0 });
  }
  return {
    title:
      typeof source.title === "string" && source.title.trim()
        ? source.title.trim()
        : "قانون لغو مربی",
    tiers: tiers.sort((left, right) => right.hoursBefore - left.hoursBefore),
    reservationCutoffMinutes: nonNegative(source.reservationCutoffMinutes, 0),
    rescheduleCutoffMinutes: nonNegative(source.rescheduleCutoffMinutes, 0),
    noShowRefundPercent: clampPercent(source.noShowRefundPercent, 0),
    ownerCancellationRefundPercent: clampPercent(
      source.ownerCancellationRefundPercent,
      100,
    ),
  };
}

export function calculateCoachBookingRefund(
  amount: number,
  sessionStartsAt: Date,
  cancelledAt: Date,
  policy: CoachCancellationPolicy,
) {
  return calculateRefund(amount, sessionStartsAt, cancelledAt, policy.tiers);
}

function nonNegative(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : fallback;
}

function clampPercent(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : fallback;
}
