export type RefundTier = {
  hoursBefore: number;
  refundPercent: number;
};

export function calculateRefund(
  totalPrice: number,
  sessionStartsAt: Date,
  cancelledAt: Date,
  tiers: RefundTier[],
): { refundPercent: number; refundAmount: number } {
  const hoursBefore = Math.max(
    0,
    (sessionStartsAt.getTime() - cancelledAt.getTime()) / 3_600_000,
  );
  const tier = [...tiers]
    .sort((a, b) => b.hoursBefore - a.hoursBefore)
    .find((item) => hoursBefore >= item.hoursBefore);
  const refundPercent = tier?.refundPercent ?? 0;
  return {
    refundPercent,
    refundAmount: Math.round((totalPrice * refundPercent) / 100),
  };
}
