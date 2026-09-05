import { Types } from "mongoose";

import { CommerceService } from "./commerce.service";
import { MockPaymentProvider } from "./mock-payment.provider";

describe("CommerceService", () => {
  it("captures a signed callback once and posts a balanced ledger", async () => {
    const intent = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(),
      clubId: new Types.ObjectId(),
      referenceType: "reservation",
      referenceId: new Types.ObjectId(),
      provider: "mock",
      authority: "mock_authority_123456",
      amount: 100_000,
      grossAmount: 100_000,
      discountAmount: 0,
      platformFundedDiscount: 0,
      providerFundedDiscount: 0,
      walletAmount: 0,
      walletReservationKey: "",
      platformFee: 10_000,
      refundedAmount: 0,
      idempotencyKey: "checkout-key-123",
      returnUrl: "https://example.test/return",
      status: "pending",
      paidAt: null,
      reconciledAt: null,
      createdAt: new Date(),
    };
    const paid = { ...intent, status: "paid", paidAt: new Date() };
    const callbacks = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    };
    const ledger = { insertMany: jest.fn() };
    const intents = {
      findOne: jest.fn().mockResolvedValue(intent),
      findOneAndUpdate: jest.fn().mockResolvedValue(paid),
      findById: jest.fn(),
    };
    const reservation = {
      _id: intent.referenceId,
      userId: intent.userId,
      sessionTitle: "فوتسال",
    };
    const reservations = {
      findOneAndUpdate: jest.fn().mockResolvedValue(reservation),
    };
    const notifications = { notifyBookingConfirmed: jest.fn() };
    const provider = new MockPaymentProvider({
      env: { MOCK_PAYMENT_CALLBACK_SECRET: "test-payment-secret-123456" },
    } as never);
    const service = new CommerceService(
      intents as never,
      callbacks as never,
      ledger as never,
      reservations as never,
      {} as never,
      { updateOne: jest.fn() } as never,
      provider,
      notifications as never,
      { finalizePayment: jest.fn(), settleReferral: jest.fn() } as never,
      {
        payablePurchase: jest.fn(),
        finalizePurchase: jest.fn(),
        refundPurchase: jest.fn(),
        finalizeReservation: jest.fn(),
      } as never,
      { finalizeEnrollmentPayment: jest.fn() } as never,
    );
    const callback = provider.createCallback({
      intentId: String(intent._id),
      authority: intent.authority,
      amount: intent.amount,
      status: "paid",
    });

    const result = await service.processCallback(
      callback.payload,
      callback.signature,
    );

    expect(result.status).toBe("paid");
    const entries = ledger.insertMany.mock.calls[0]?.[0] as Array<{
      direction: "debit" | "credit";
      amount: number;
    }>;
    const sum = (direction: "debit" | "credit") =>
      entries
        .filter((entry) => entry.direction === direction)
        .reduce((total, entry) => total + entry.amount, 0);
    expect(sum("debit")).toBe(100_000);
    expect(sum("credit")).toBe(100_000);
    expect(callbacks.create).toHaveBeenCalledTimes(1);
    expect(notifications.notifyBookingConfirmed).toHaveBeenCalledTimes(1);
  });
});
