export function reservationPrice(input: {
  basePrice: number;
  pricingUnit: "per_participant" | "per_session" | "per_court";
  participantCount: number;
  options: Array<{ unitPrice: number; quantity: number }>;
  isTrial?: boolean;
  entitlementId?: string;
  taxPercent?: number;
}) {
  const baseAmount =
    input.basePrice *
    (input.pricingUnit === "per_participant" ? input.participantCount : 1);
  const optionsAmount = input.options.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const coveredAmount = input.entitlementId ? baseAmount : 0;
  const totalPrice = input.isTrial
    ? 0
    : baseAmount + optionsAmount - coveredAmount;
  // Catalog prices are final prices; expose their included tax, never silently add it.
  const taxPercent = input.taxPercent ?? 0;
  const taxAmount = Math.round((totalPrice * taxPercent) / (100 + taxPercent));
  return {
    baseAmount: input.isTrial ? 0 : baseAmount,
    optionsAmount,
    coveredAmount,
    totalPrice,
    taxPercent,
    taxAmount,
    subtotal: totalPrice - taxAmount,
  };
}
