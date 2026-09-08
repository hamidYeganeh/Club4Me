import { reservationPrice } from "./reservation-price";
describe("reservation pricing", () => {
  const input = { basePrice: 6_000_000, participantCount: 4, options: [] };
  it("charges a whole court once and a per-person rate for each participant", () => {
    expect(
      reservationPrice({ ...input, pricingUnit: "per_court" }).totalPrice,
    ).toBe(6_000_000);
    expect(
      reservationPrice({ ...input, pricingUnit: "per_participant" }).totalPrice,
    ).toBe(24_000_000);
  });
  it("keeps final catalog price stable while disclosing its included tax", () => {
    const quote = reservationPrice({
      ...input,
      pricingUnit: "per_session",
      taxPercent: 10,
    });
    expect(quote.totalPrice).toBe(6_000_000);
    expect(quote.subtotal + quote.taxAmount).toBe(quote.totalPrice);
  });
  it("only covers the base with membership; extras remain payable", () => {
    expect(
      reservationPrice({
        ...input,
        participantCount: 1,
        pricingUnit: "per_participant",
        entitlementId: "membership",
        options: [{ unitPrice: 50_000, quantity: 2 }],
      }),
    ).toMatchObject({
      coveredAmount: 6_000_000,
      optionsAmount: 100_000,
      totalPrice: 100_000,
    });
  });
  it("a trial has no payable amount or included tax", () =>
    expect(
      reservationPrice({
        ...input,
        pricingUnit: "per_session",
        isTrial: true,
        taxPercent: 10,
      }),
    ).toMatchObject({ totalPrice: 0, taxAmount: 0 }));
});
