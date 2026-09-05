import { Types } from "mongoose";

import { CommerceService } from "./commerce.service";
import { MockPaymentProvider } from "./mock-payment.provider";

describe("CommerceService business class payments", () => {
  it("activates a class enrollment after a signed mock payment", async () => {
    const intent = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(),
      clubId: new Types.ObjectId(),
      referenceType: "business_class_enrollment",
      referenceId: new Types.ObjectId(),
      provider: "mock",
      authority: "mock_authority_business_class",
      checkoutUrl: "/payments/mock/mock_authority_business_class",
      amount: 90_000,
      grossAmount: 100_000,
      discountAmount: 10_000,
      platformFundedDiscount: 5_000,
      providerFundedDiscount: 5_000,
      walletAmount: 0,
      walletReservationKey: "payment-wallet-class-test",
      platformFee: 10_000,
      refundedAmount: 0,
      idempotencyKey: "class-payment-test",
      returnUrl: "https://example.test/class",
      status: "pending",
      paidAt: null,
      reconciledAt: null,
      createdAt: new Date(),
    };
    const paid = { ...intent, status: "paid", paidAt: new Date() };
    const intents = {
      findOne: jest.fn().mockResolvedValue(intent),
      findOneAndUpdate: jest.fn().mockResolvedValue(paid),
      findById: jest.fn(),
    };
    const callbacks = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    };
    const ledger = { insertMany: jest.fn() };
    const notifications = {
      notifyBookingConfirmed: jest.fn(),
      notifyPaymentFailed: jest.fn(),
    };
    const classPortal = {
      finalizeEnrollmentPayment: jest.fn().mockResolvedValue({
        title: "کلاس بدنسازی",
      }),
    };
    const provider = new MockPaymentProvider({
      env: { MOCK_PAYMENT_CALLBACK_SECRET: "test-payment-secret-123456" },
    } as never);
    const service = new CommerceService(
      intents as never,
      callbacks as never,
      ledger as never,
      {} as never,
      {} as never,
      { updateOne: jest.fn() } as never,
      provider,
      notifications as never,
      { finalizePayment: jest.fn(), settleReferral: jest.fn() } as never,
      {} as never,
      classPortal as never,
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
    expect(classPortal.finalizeEnrollmentPayment).toHaveBeenCalledWith(
      intent.referenceId,
      true,
    );
    expect(notifications.notifyBookingConfirmed).toHaveBeenCalledWith(
      expect.objectContaining({ title: "کلاس بدنسازی" }),
    );
    const entries = ledger.insertMany.mock.calls[0]?.[0] as Array<{
      direction: "debit" | "credit";
      amount: number;
    }>;
    const total = (direction: "debit" | "credit") =>
      entries
        .filter((entry) => entry.direction === direction)
        .reduce((sum, entry) => sum + entry.amount, 0);
    expect(total("debit")).toBe(total("credit"));
  });
});
