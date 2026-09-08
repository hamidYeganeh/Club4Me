import { createConnection, type Connection, Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { AvailabilityService } from "./availability.service";
import {
  CoachAvailabilityRule,
  CoachAvailabilityRuleSchema,
  CoachAvailabilityException,
  CoachAvailabilityExceptionSchema,
  CoachAvailabilityPlan,
  CoachAvailabilityPlanSchema,
} from "../schemas/coaching.schemas";
import type { ReplaceAvailabilityDto } from "../dto/coaching.dto";

describe("atomic coach availability replacement", () => {
  jest.setTimeout(60_000);
  let mongo: MongoMemoryServer;
  let db: Connection;
  let service: AvailabilityService;
  const coachId = new Types.ObjectId();
  const rule = (
    dayOfWeek: number,
    startMinute = 600,
  ): ReplaceAvailabilityDto["rules"][number] => ({
    dayOfWeek,
    startMinute,
    endMinute: startMinute + 60,
    deliveryModes: ["online"],
    validFrom: new Date("2026-01-01"),
  });
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    db = await createConnection(mongo.getUri()).asPromise();
    const rules = db.model(
      CoachAvailabilityRule.name,
      CoachAvailabilityRuleSchema,
    );
    const exceptions = db.model(
      CoachAvailabilityException.name,
      CoachAvailabilityExceptionSchema,
    );
    const plans = db.model(
      CoachAvailabilityPlan.name,
      CoachAvailabilityPlanSchema,
    );
    await Promise.all([rules.init(), exceptions.init(), plans.init()]);
    service = new AvailabilityService(
      rules as never,
      exceptions as never,
      {
        requireOwnedCoach: async () => ({ _id: coachId }),
      } as never,
      plans as never,
    );
  });
  afterAll(async () => {
    await db?.close();
    await mongo?.stop();
  });
  beforeEach(async () => {
    await db.model(CoachAvailabilityPlan.name).deleteMany({});
    await db.model(CoachAvailabilityRule.name).deleteMany({});
  });
  it("reads legacy rules until the first edit and an empty plan does not resurrect them", async () => {
    await db.model(CoachAvailabilityRule.name).create({ ...rule(1), coachId });
    expect((await service.get("user")).rules).toHaveLength(1);
    await service.replace("user", []);
    expect((await service.get("user")).rules).toEqual([]);
    expect(await db.model(CoachAvailabilityRule.name).countDocuments()).toBe(1);
  });
  it("concurrent first and later writes leave exactly one complete plan", async () => {
    const plans = Array.from({ length: 12 }, (_, index) => [
      rule(index % 7, 60 + index * 10),
      rule((index + 1) % 7, 900),
    ]);
    for (let iteration = 0; iteration < 3; iteration++) {
      await Promise.all(plans.map((plan) => service.replace("user", plan)));
      const { rules } = await service.get("user");
      expect(rules).toHaveLength(2);
      const actual = rules
        .map((item) => [item.dayOfWeek, item.startMinute])
        .sort();
      expect(
        plans.some(
          (plan) =>
            JSON.stringify(
              plan.map((item) => [item.dayOfWeek, item.startMinute]).sort(),
            ) === JSON.stringify(actual),
        ),
      ).toBe(true);
      expect(
        rules.every(
          (item) =>
            typeof item.id === "string" && item.coachId === String(coachId),
        ),
      ).toBe(true);
    }
    expect(await db.model(CoachAvailabilityPlan.name).countDocuments()).toBe(1);
  });
  it("rejects overlapping rules without replacing the saved plan; separate date windows are valid", async () => {
    await service.replace("user", [rule(1)]);
    await expect(
      service.replace("user", [rule(2), rule(2, 630)]),
    ).rejects.toMatchObject({ code: "AVAILABILITY_RULES_OVERLAP" });
    expect((await service.get("user")).rules[0]).toMatchObject({
      dayOfWeek: 1,
    });
    await service.replace("user", [
      { ...rule(3), validUntil: new Date("2026-03-01") },
      { ...rule(3), validFrom: new Date("2026-04-01") },
    ]);
    expect((await service.get("user")).rules).toHaveLength(2);
  });
});
