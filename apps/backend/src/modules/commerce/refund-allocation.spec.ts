import { allocateRefund } from "./refund-allocation";
import type { PaymentIntent } from "./schemas/commerce.schema";

describe("refund conservation", () => {
  it("conserves every balance across one-rial and uneven refunds, including mixed funding", () => {
    for (let gross = 1; gross <= 24; gross++) {
      for (let wallet = 0; wallet < gross; wallet++) {
        for (let discount = 0; discount < gross - wallet; discount++) {
          for (const step of [1, 3, 7]) {
            const providerDiscount = Math.floor(discount / 2);
            const fee = Math.min(
              Math.round(gross / 10),
              gross - providerDiscount,
            );
            const intent = {
              amount: gross - wallet - discount,
              grossAmount: gross,
              walletAmount: wallet,
              discountAmount: discount,
              platformFundedDiscount: discount - providerDiscount,
              providerFundedDiscount: providerDiscount,
              platformFee: fee,
              refundedAmount: 0,
              refundedGatewayAmount: 0,
              refundedWalletAmount: 0,
              refundedDiscountAmount: 0,
              refundedPlatformFundedDiscount: 0,
              refundedProviderFundedDiscount: 0,
              refundedPlatformFee: null,
            } as PaymentIntent;
            let providerTotal = 0;
            while (intent.refundedAmount < gross) {
              const amount = Math.min(step, gross - intent.refundedAmount);
              const r = allocateRefund(intent, amount);
              expect(
                Object.values(r).every(
                  (n) => Number.isSafeInteger(n) && n >= 0,
                ),
              ).toBe(true);
              expect(
                r.gatewayRefund + r.walletRefund + r.discountReversal,
              ).toBe(amount);
              expect(r.providerReversal + r.feeReversal).toBe(
                r.gatewayRefund + r.walletRefund + r.platformDiscountReversal,
              );
              intent.refundedAmount += amount;
              intent.refundedGatewayAmount += r.gatewayRefund;
              intent.refundedWalletAmount += r.walletRefund;
              intent.refundedDiscountAmount += r.discountReversal;
              intent.refundedPlatformFundedDiscount +=
                r.platformDiscountReversal;
              intent.refundedProviderFundedDiscount +=
                r.providerDiscountReversal;
              intent.refundedPlatformFee = r.refundedPlatformFee;
              providerTotal += r.providerReversal;
            }
            expect([
              intent.refundedGatewayAmount,
              intent.refundedWalletAmount,
              intent.refundedDiscountAmount,
              intent.refundedPlatformFee,
              providerTotal,
            ]).toEqual([
              intent.amount,
              wallet,
              discount,
              fee,
              gross - providerDiscount - fee,
            ]);
          }
        }
      }
    }
  });

  it("rejects inconsistent historical balances instead of posting negative entries", () => {
    expect(() =>
      allocateRefund(
        {
          grossAmount: 2,
          amount: 1,
          walletAmount: 1,
          refundedAmount: 1,
          refundedGatewayAmount: 1,
          refundedWalletAmount: 1,
          platformFee: 0,
        } as PaymentIntent,
        1,
      ),
    ).toThrow();
  });
});
