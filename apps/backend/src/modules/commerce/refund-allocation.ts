import { AppError } from "../../common/errors/app.exception";
import type { PaymentIntent } from "./schemas/commerce.schema";

// Split only the remaining balances. Each rounded share is bounded by its
// parent, so even one-rial refunds conserve money and never reverse a negative share.
function share(amount: number, weight: number, total: number) {
  if (!total) return 0;
  return Number(
    (BigInt(amount) * BigInt(weight) * 2n + BigInt(total)) /
      (2n * BigInt(total)),
  );
}

export function allocateRefund(intent: PaymentIntent, amount: number) {
  const gross = intent.grossAmount - intent.refundedAmount;
  const gateway = intent.amount - (intent.refundedGatewayAmount ?? 0);
  const wallet = intent.walletAmount - (intent.refundedWalletAmount ?? 0);
  const providerDiscount =
    (intent.providerFundedDiscount ?? 0) -
    (intent.refundedProviderFundedDiscount ?? 0);
  const platformDiscount =
    (intent.platformFundedDiscount ?? 0) -
    (intent.refundedPlatformFundedDiscount ?? 0);
  const priorFee =
    intent.refundedPlatformFee ??
    share(intent.refundedAmount, intent.platformFee, intent.grossAmount);
  const fee = intent.platformFee - priorFee;
  if (
    ![
      amount,
      gross,
      gateway,
      wallet,
      providerDiscount,
      platformDiscount,
      fee,
    ].every(Number.isSafeInteger) ||
    amount <= 0 ||
    amount > gross ||
    Math.min(gateway, wallet, providerDiscount, platformDiscount, fee) < 0 ||
    gateway + wallet + providerDiscount + platformDiscount !== gross ||
    fee > gross - providerDiscount
  ) {
    throw new AppError(
      409,
      "REFUND_BALANCE_INVALID",
      "مانده‌های پرداخت نیاز به بررسی و تطبیق دارند.",
    );
  }
  const discountReversal = share(
    amount,
    providerDiscount + platformDiscount,
    gross,
  );
  const customerRefund = amount - discountReversal;
  const walletRefund = share(customerRefund, wallet, gateway + wallet);
  const providerDiscountReversal = share(
    discountReversal,
    providerDiscount,
    providerDiscount + platformDiscount,
  );
  const providerBeforeFee = amount - providerDiscountReversal;
  const feeReversal = share(providerBeforeFee, fee, gross - providerDiscount);
  return {
    gatewayRefund: customerRefund - walletRefund,
    walletRefund,
    discountReversal,
    providerDiscountReversal,
    platformDiscountReversal: discountReversal - providerDiscountReversal,
    feeReversal,
    providerReversal: providerBeforeFee - feeReversal,
    refundedPlatformFee: priorFee + feeReversal,
  };
}
