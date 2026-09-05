import { MongooseModule, getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Model } from "mongoose";

import { User, type UserDocument } from "../users/schemas/user.schema";
import { UsersModule } from "../users/users.module";
import { UsersRepository } from "../users/users.repository";
import type { PublicRoleRequest } from "./mappers/role-request.mapper";
import { RoleRequestsRepository } from "./role-requests.repository";
import { RoleRequestsService } from "./role-requests.service";
import {
  RoleRequest,
  RoleRequestSchema,
  type RoleRequestDocument,
} from "./schemas/role-request.schema";

describe("RoleRequestsService", () => {
  const coachDetails = {
    displayName: "مربی تست",
    city: "تهران",
    experienceYears: 5,
    specialty: "بدنسازی",
    description: "سابقه کافی برای درخواست نقش مربی دارم.",
  };
  const ownerDetails = {
    displayName: "مالک تست",
    city: "تهران",
    businessName: "باشگاه تست",
    businessType: "باشگاه ورزشی",
    description: "مدیریت یک مجموعه ورزشی فعال را بر عهده دارم.",
  };
  jest.setTimeout(60_000);
  let mongo: MongoMemoryServer;
  let usersRepository: UsersRepository;
  let roleRequestsRepository: RoleRequestsRepository;
  let roleRequestsService: RoleRequestsService;
  let userModel: Model<UserDocument>;
  let roleRequestModel: Model<RoleRequestDocument>;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongo.getUri()),
        UsersModule,
        MongooseModule.forFeature([
          { name: RoleRequest.name, schema: RoleRequestSchema },
        ]),
      ],
      providers: [RoleRequestsRepository, RoleRequestsService],
    }).compile();

    await moduleRef.init();
    usersRepository = moduleRef.get(UsersRepository);
    roleRequestsRepository = moduleRef.get(RoleRequestsRepository);
    roleRequestsService = moduleRef.get(RoleRequestsService);
    userModel = moduleRef.get<Model<UserDocument>>(getModelToken(User.name));
    roleRequestModel = moduleRef.get<Model<RoleRequestDocument>>(
      getModelToken(RoleRequest.name),
    );
    await userModel.createIndexes();
    await roleRequestModel.createIndexes();
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
    if (roleRequestModel) {
      await roleRequestModel.deleteMany({});
    }
  });

  it("creates a pending coach request for an athlete", async () => {
    const user = await usersRepository.findOrCreateByPhone("+989121234567");
    const request = await roleRequestsService.requestRole(
      user.id,
      "coach",
      coachDetails,
    );

    expect(request).toMatchObject({
      userId: user.id,
      phone: user.phone,
      role: "coach",
      status: "pending",
    } satisfies Partial<PublicRoleRequest>);
    expect(await roleRequestModel.countDocuments()).toBe(1);
  });

  it("reuses an existing pending request instead of duplicating it", async () => {
    const user = await usersRepository.findOrCreateByPhone("+989121234568");
    const first = await roleRequestsRepository.createForUser({
      userId: user.id,
      phone: user.phone,
      role: "owner",
      details: ownerDetails,
    });
    const second = await roleRequestsService.requestRole(
      user.id,
      "owner",
      ownerDetails,
    );

    expect(second.id).toBe(first.id);
    expect(await roleRequestModel.countDocuments()).toBe(1);
  });

  it("rejects athlete role requests", async () => {
    const user = await usersRepository.findOrCreateByPhone("+989121234569");

    await expect(
      roleRequestsService.requestRole(user.id, "athlete", ownerDetails),
    ).rejects.toMatchObject({
      status: 400,
      code: "ROLE_REQUEST_INVALID",
    });
  });

  it("approves an owner request and grants the owner role", async () => {
    const user = await usersRepository.findOrCreateByPhone("+989121234570");
    const request = await roleRequestsService.requestRole(
      user.id,
      "owner",
      ownerDetails,
    );

    const reviewed = await roleRequestsService.decideForAdmin(
      ["admin"],
      request.id,
      "approved",
    );

    expect(reviewed.status).toBe("approved");
    expect((await usersRepository.findById(user.id)).roles).toEqual([
      "athlete",
      "owner",
    ]);
  });

  it("rejects an owner request without granting the role", async () => {
    const user = await usersRepository.findOrCreateByPhone("+989121234571");
    const request = await roleRequestsService.requestRole(
      user.id,
      "owner",
      ownerDetails,
    );

    const reviewed = await roleRequestsService.decideForAdmin(
      ["admin"],
      request.id,
      "rejected",
    );

    expect(reviewed.status).toBe("rejected");
    expect((await usersRepository.findById(user.id)).roles).toEqual([
      "athlete",
    ]);
  });

  it("does not allow a reviewed request to be decided again", async () => {
    const user = await usersRepository.findOrCreateByPhone("+989121234572");
    const request = await roleRequestsService.requestRole(
      user.id,
      "owner",
      ownerDetails,
    );
    await roleRequestsService.decideForAdmin(["admin"], request.id, "approved");

    await expect(
      roleRequestsService.decideForAdmin(["admin"], request.id, "rejected"),
    ).rejects.toMatchObject({
      status: 409,
      code: "ROLE_REQUEST_ALREADY_REVIEWED",
    });
  });

  it("requires the admin role to review requests", async () => {
    const user = await usersRepository.findOrCreateByPhone("+989121234573");
    const request = await roleRequestsService.requestRole(
      user.id,
      "owner",
      ownerDetails,
    );

    await expect(
      roleRequestsService.decideForAdmin(["athlete"], request.id, "approved"),
    ).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("restores a request to pending when granting the role fails", async () => {
    const user = await usersRepository.findOrCreateByPhone("+989121234574");
    const request = await roleRequestsService.requestRole(
      user.id,
      "owner",
      ownerDetails,
    );
    await userModel.deleteOne({ _id: user.id });

    await expect(
      roleRequestsService.decideForAdmin(["admin"], request.id, "approved"),
    ).rejects.toMatchObject({ status: 404, code: "USER_NOT_FOUND" });

    expect((await roleRequestModel.findById(request.id).lean())?.status).toBe(
      "pending",
    );
  });
});
