import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { Model, Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { ClubsService } from "../clubs/clubs.service";
import { EntitlementsService } from "./entitlements.service";
import {
  BenefitProduct,
  BenefitProductDocument,
  BenefitProductSchema,
  BenefitPurchase,
  BenefitPurchaseSchema,
  EntitlementUsage,
  EntitlementUsageSchema,
  UserEntitlement,
  UserEntitlementSchema,
} from "./schemas/entitlement.schema";

describe("EntitlementsService integration", () => {
  jest.setTimeout(60_000);
  let mongo: MongoMemoryServer;
  let service: EntitlementsService;
  let products: Model<BenefitProductDocument>;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongo.getUri()),
        MongooseModule.forFeature([
          { name: BenefitProduct.name, schema: BenefitProductSchema },
          { name: BenefitPurchase.name, schema: BenefitPurchaseSchema },
          { name: UserEntitlement.name, schema: UserEntitlementSchema },
          { name: EntitlementUsage.name, schema: EntitlementUsageSchema },
        ]),
      ],
      providers: [
        EntitlementsService,
        { provide: ClubsService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(EntitlementsService);
    products = moduleRef.get(getModelToken(BenefitProduct.name));
  });

  afterAll(async () => {
    await products.db.close();
    await mongo.stop();
  });

  it("allows only one concurrent reservation to consume the last pack session", async () => {
    const userId = new Types.ObjectId().toHexString();
    const clubId = new Types.ObjectId();
    const product = await products.create({
      clubId,
      title: "بسته تک‌جلسه",
      description: "آزمون مصرف اتمیک",
      type: "session_pack",
      price: 100_000,
      sessionCount: 1,
      validityDays: 30,
      weeklyLimit: null,
      sessionTypes: ["class"],
      status: "active",
    });
    const purchase = await service.createPurchase(userId, String(product._id));
    const entitlement = await service.finalizePurchase(
      new Types.ObjectId(purchase.id),
      true,
    );
    expect(entitlement).toBeTruthy();

    const reserve = () =>
      service.reserveForReservation({
        entitlementId: String(entitlement!._id),
        reservationId: new Types.ObjectId(),
        userId,
        clubId,
        sessionType: "class",
        sessionStartsAt: new Date(Date.now() + 86_400_000),
      });
    const results = await Promise.allSettled([reserve(), reserve()]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    const mine = await service.listMine(userId);
    expect(mine.items[0]).toMatchObject({
      remainingSessions: 0,
      status: "exhausted",
    });
  });
});
