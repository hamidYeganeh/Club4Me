import { Types } from "mongoose";

import { BenefitsService } from "./benefits.service";

describe("BenefitsService discounts", () => {
  it("applies scoped discounts and snapshots mixed funding exactly", async () => {
    const clubId = new Types.ObjectId();
    const campaignId = new Types.ObjectId();
    const campaigns = {
      findOne: jest.fn().mockResolvedValue({
        _id: campaignId,
        code: "MIXED20",
        kind: "percent",
        value: 20,
        maxDiscount: null,
        minOrderAmount: 0,
        budgetRemaining: 1_000_000,
        perUserLimit: 2,
        usageLimit: 10,
        usageCount: 1,
        clubIds: [],
        scopeType: "club",
        scopeIds: [String(clubId)],
        funding: [
          { source: "platform", percentage: 30 },
          { source: "provider", percentage: 70 },
        ],
        eligibleUserIds: [],
        firstPurchaseOnly: false,
        referredOnly: false,
      }),
    };
    const redemptions = { countDocuments: jest.fn().mockResolvedValue(0) };
    const service = new BenefitsService(
      {} as never,
      {} as never,
      campaigns as never,
      redemptions as never,
      {} as never,
      { exists: jest.fn() } as never,
      {} as never,
      {} as never,
      { exists: jest.fn() } as never,
    );

    const quote = await service.quoteDiscountForContext(
      String(new Types.ObjectId()),
      "mixed20",
      {
        referenceType: "reservation",
        referenceId: new Types.ObjectId(),
        grossAmount: 100_000,
        scopeValues: {
          club: [String(clubId)],
          coach: [],
          class: [],
          sport: [],
          product: [],
          session_type: ["court"],
        },
      },
    );

    expect(quote.amount).toBe(20_000);
    expect(quote.platformFundedAmount).toBe(6_000);
    expect(quote.providerFundedAmount).toBe(14_000);
    expect(quote.platformFundedAmount + quote.providerFundedAmount).toBe(
      quote.amount,
    );
  });
});
