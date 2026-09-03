import { MongooseModule, getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Model } from "mongoose";

import { User, type UserDocument } from "./schemas/user.schema";
import { UsersModule } from "./users.module";
import { UsersRepository } from "./users.repository";
import type { PublicUser } from "./mappers/user.mapper";

describe("UsersRepository", () => {
  jest.setTimeout(60_000);
  let mongo: MongoMemoryServer;
  let repository: UsersRepository;
  let userModel: Model<UserDocument>;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const moduleRef = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(mongo.getUri()), UsersModule],
    }).compile();

    await moduleRef.init();
    repository = moduleRef.get(UsersRepository);
    userModel = moduleRef.get<Model<UserDocument>>(getModelToken(User.name));
    await userModel.createIndexes();
  });

  afterAll(async () => {
    if (userModel) {
      await userModel.db.close();
    }
    if (mongo) {
      await mongo.stop();
    }
  });

  afterEach(async () => {
    if (userModel) {
      await userModel.deleteMany({});
    }
  });

  it("enforces a unique phone index", async () => {
    await repository.findOrCreateByPhone("+989121234567");

    await expect(
      userModel.create({
        phone: "+989121234567",
        roles: ["athlete"],
        status: "active",
      }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("handles concurrent user creation for the same phone", async () => {
    const phone = "+989121234580";
    const created = await Promise.all([
      repository.findOrCreateByPhone(phone),
      repository.findOrCreateByPhone(phone),
      repository.findOrCreateByPhone(phone),
    ]);

    expect(new Set(created.map((user: PublicUser) => user.id)).size).toBe(1);
    expect(await userModel.countDocuments({ phone })).toBe(1);
  });

  it("never exposes passwordHash on PublicUser", async () => {
    const created = await repository.findOrCreateByPhone("+989121234581");
    const withPassword = await repository.setPassword(created.id, "password1");

    expect(withPassword).not.toHaveProperty("passwordHash");
    expect(withPassword.hasPassword).toBe(true);
  });
});
