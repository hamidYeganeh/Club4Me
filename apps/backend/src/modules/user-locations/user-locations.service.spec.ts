import { MongooseModule, getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Model, Types } from "mongoose";

import type { CreateUserLocationDto } from "./dto/create-user-location.dto";
import {
  UserLocation,
  UserLocationSchema,
  type UserLocationDocument,
} from "./schemas/user-location.schema";
import { UserLocationsRepository } from "./user-locations.repository";
import { UserLocationsService } from "./user-locations.service";

describe("UserLocationsService", () => {
  jest.setTimeout(60_000);
  let mongo: MongoMemoryServer;
  let model: Model<UserLocationDocument>;
  let service: UserLocationsService;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongo.getUri()),
        MongooseModule.forFeature([
          { name: UserLocation.name, schema: UserLocationSchema },
        ]),
      ],
      providers: [UserLocationsRepository, UserLocationsService],
    }).compile();

    await moduleRef.init();
    model = moduleRef.get(getModelToken(UserLocation.name));
    service = moduleRef.get(UserLocationsService);
    await model.createIndexes();
  });

  afterEach(async () => model.deleteMany({}));

  afterAll(async () => {
    if (model) await model.db.close();
    if (mongo) await mongo.stop();
  });

  it("automatically defaults the first location and keeps exactly one default", async () => {
    const userId = new Types.ObjectId().toHexString();
    const first = await service.create(userId, input("خانه", 51.4, 35.7));
    const second = await service.create(userId, {
      ...input("محل کار", 51.5, 35.8),
      isDefault: true,
    });

    expect(first.isDefault).toBe(true);
    expect(second.isDefault).toBe(true);
    const locations = (await service.list(userId)).items;
    expect(locations.filter((location) => location.isDefault)).toHaveLength(1);
    expect(locations.find((location) => location.isDefault)?.id).toBe(
      second.id,
    );
  });

  it("rejects a sixth location", async () => {
    const userId = new Types.ObjectId().toHexString();
    for (let index = 0; index < 5; index += 1) {
      await service.create(userId, input(`مکان ${index}`, 51 + index / 10, 35));
    }

    await expect(
      service.create(userId, input("مکان ششم", 52, 36)),
    ).rejects.toMatchObject({ status: 409, code: "LOCATION_LIMIT_REACHED" });
  });

  it("enforces the limit during concurrent creation", async () => {
    const userId = new Types.ObjectId().toHexString();
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, (_, index) =>
        service.create(userId, input(`هم‌زمان ${index}`, 51 + index / 100, 35)),
      ),
    );

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(5);
    expect(await model.countDocuments({})).toBe(5);
  });

  it("does not expose or mutate another user's location", async () => {
    const ownerId = new Types.ObjectId().toHexString();
    const strangerId = new Types.ObjectId().toHexString();
    const location = await service.create(
      ownerId,
      input("خانه من", 51.4, 35.7),
    );

    expect((await service.list(strangerId)).items).toEqual([]);
    await expect(
      service.update(strangerId, location.id, { title: "تصاحب" }),
    ).rejects.toMatchObject({ status: 404, code: "LOCATION_NOT_FOUND" });
    await expect(service.remove(strangerId, location.id)).rejects.toMatchObject(
      { status: 404, code: "LOCATION_NOT_FOUND" },
    );
  });

  it("promotes a remaining location after deleting the default", async () => {
    const userId = new Types.ObjectId().toHexString();
    const first = await service.create(userId, input("خانه", 51.4, 35.7));
    await service.create(userId, input("باشگاه", 51.5, 35.8));

    await service.remove(userId, first.id);

    const locations = (await service.list(userId)).items;
    expect(locations).toHaveLength(1);
    expect(locations[0]?.isDefault).toBe(true);
  });

  it("stores coordinates in GeoJSON longitude-latitude order", async () => {
    const userId = new Types.ObjectId().toHexString();
    await service.create(userId, input("خانه", 51.4123, 35.7123));
    const stored = await model.findOne({});

    expect(stored?.location).toMatchObject({
      type: "Point",
      coordinates: [51.4123, 35.7123],
    });
  });
});

function input(
  title: string,
  longitude: number,
  latitude: number,
): CreateUserLocationDto {
  return {
    title,
    countryId: new Types.ObjectId().toHexString(),
    provinceId: new Types.ObjectId().toHexString(),
    cityId: new Types.ObjectId().toHexString(),
    address: "تهران، یک آدرس نمونه",
    longitude,
    latitude,
  };
}
