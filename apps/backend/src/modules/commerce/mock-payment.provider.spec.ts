import { MockPaymentProvider } from "./mock-payment.provider";

describe("MockPaymentProvider", () => {
  const provider = new MockPaymentProvider({
    env: { MOCK_PAYMENT_CALLBACK_SECRET: "test-payment-secret-123456" },
  } as never);

  it("accepts an authentic callback and rejects tampering", () => {
    const callback = provider.createCallback({
      intentId: "507f1f77bcf86cd799439011",
      authority: "mock_authority_123456",
      amount: 250_000,
      status: "paid",
    });

    expect(provider.assertSignature(callback.payload, callback.signature)).toBe(
      true,
    );
    expect(
      provider.assertSignature(
        { ...callback.payload, amount: callback.payload.amount + 1 },
        callback.signature,
      ),
    ).toBe(false);
  });

  it("rejects replay payloads outside the callback time window", () => {
    const callback = provider.createCallback({
      intentId: "507f1f77bcf86cd799439011",
      authority: "mock_authority_123456",
      amount: 250_000,
      status: "paid",
    });
    const expired = {
      ...callback.payload,
      timestamp: Date.now() - 6 * 60_000,
    };

    expect(provider.assertSignature(expired, provider.sign(expired))).toBe(
      false,
    );
  });
});
