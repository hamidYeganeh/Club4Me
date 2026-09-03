import { getModelToken } from "@nestjs/mongoose";
import { INestApplication } from "@nestjs/common";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Model } from "mongoose";
import request from "supertest";
import type { App } from "supertest/types";

import type { UserRole } from "../src/lib/roles";
import {
  User,
  type UserDocument,
} from "../src/modules/users/schemas/user.schema";
import { createAuthTestApp, type AuthTestApp } from "./auth-test-app";

describe("Portal auth e2e", () => {
  jest.setTimeout(60_000);
  let mongo: MongoMemoryServer;
  let harness: AuthTestApp;
  let app: INestApplication;
  let http: App;
  let userModel: Model<UserDocument>;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    harness = await createAuthTestApp(mongo.getUri());
    app = harness.app;
    http = app.getHttpServer() as App;
    userModel = harness.moduleRef.get<Model<UserDocument>>(
      getModelToken(User.name),
    );
  });

  afterAll(async () => {
    await app.close();
    await mongo.stop();
  });

  afterEach(async () => {
    if (!harness) {
      return;
    }

    await harness.redis.flush();
    harness.sms.calls.length = 0;
    harness.sms.last = undefined;
  });

  describe("admin", () => {
    it("logs in with OTP when the user has the admin role", async () => {
      const session = await signup("09121000001");
      await grantRole(session.user.phone, "admin");

      await request(http)
        .post("/api/v1/admin/auth/otp")
        .send({ phone: "09121000001" })
        .expect(201);

      const confirm = await request(http)
        .post("/api/v1/admin/auth/otp/confirm")
        .send({ phone: "09121000001", code: harness.sms.last?.code })
        .expect(200);

      expect(confirm.body.data.accessToken).toEqual(expect.any(String));
      expect(confirm.body.data.user.roles).toContain("admin");
    });

    it("rejects OTP login when the user is not an admin", async () => {
      await signup("09121000002");

      await request(http)
        .post("/api/v1/admin/auth/otp")
        .send({ phone: "09121000002" })
        .expect(403)
        .expect((res) => {
          expect(res.body.error.code).toBe("FORBIDDEN");
        });
    });

    it("does not create a user when an unknown phone requests an admin OTP", async () => {
      await request(http)
        .post("/api/v1/admin/auth/otp")
        .send({ phone: "09121000003" })
        .expect(404)
        .expect((res) => {
          expect(res.body.error.code).toBe("USER_NOT_FOUND");
        });

      expect(await userModel.findOne({ phone: "+989121000003" })).toBeNull();
    });

    it("logs in with a password when the user has the admin role", async () => {
      const session = await signup("09121000004");
      await grantRole(session.user.phone, "admin");

      await request(http)
        .post("/api/v1/account/auth/set-password")
        .set("Authorization", `Bearer ${session.accessToken}`)
        .send({ password: "password1" })
        .expect(200);

      const login = await request(http)
        .post("/api/v1/admin/auth/login")
        .send({ phone: "09121000004", password: "password1" })
        .expect(200);

      expect(login.body.data.user.roles).toContain("admin");
    });

    it("rejects password login when the user is not an admin", async () => {
      const session = await signup("09121000005");

      await request(http)
        .post("/api/v1/account/auth/set-password")
        .set("Authorization", `Bearer ${session.accessToken}`)
        .send({ password: "password1" })
        .expect(200);

      await request(http)
        .post("/api/v1/admin/auth/login")
        .send({ phone: "09121000005", password: "password1" })
        .expect(403)
        .expect((res) => {
          expect(res.body.error.code).toBe("FORBIDDEN");
        });
    });

    it("refreshes and returns /me for an admin session", async () => {
      const session = await signup("09121000006");
      await grantRole(session.user.phone, "admin");

      await request(http)
        .post("/api/v1/admin/auth/otp")
        .send({ phone: "09121000006" })
        .expect(201);

      const confirm = await request(http)
        .post("/api/v1/admin/auth/otp/confirm")
        .send({ phone: "09121000006", code: harness.sms.last?.code })
        .expect(200);

      await request(http)
        .get("/api/v1/admin/me")
        .set("Authorization", `Bearer ${confirm.body.data.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.roles).toContain("admin");
        });

      const rotated = await request(http)
        .post("/api/v1/admin/auth/refresh")
        .send({ refreshToken: confirm.body.data.refreshToken })
        .expect(200);

      expect(rotated.body.data.refreshToken).not.toBe(
        confirm.body.data.refreshToken,
      );
    });

    it("rejects /me with an account token that has no admin role", async () => {
      const session = await signup("09121000007");

      await request(http)
        .get("/api/v1/admin/me")
        .set("Authorization", `Bearer ${session.accessToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.error.code).toBe("FORBIDDEN");
        });
    });
  });

  describe("business", () => {
    it("logs in with OTP when the user has the owner role", async () => {
      const session = await signup("09122000001");
      await grantRole(session.user.phone, "owner");

      await request(http)
        .post("/api/v1/business/auth/otp")
        .send({ phone: "09122000001" })
        .expect(201);

      const confirm = await request(http)
        .post("/api/v1/business/auth/otp/confirm")
        .send({ phone: "09122000001", code: harness.sms.last?.code })
        .expect(200);

      expect(confirm.body.data.user.roles).toContain("owner");
    });

    it("rejects OTP login when the user is not an owner", async () => {
      await signup("09122000002");

      await request(http)
        .post("/api/v1/business/auth/otp")
        .send({ phone: "09122000002" })
        .expect(403)
        .expect((res) => {
          expect(res.body.error.code).toBe("FORBIDDEN");
        });
    });

    it("logs in with a password when the user has the owner role", async () => {
      const session = await signup("09122000003");
      await grantRole(session.user.phone, "owner");

      await request(http)
        .post("/api/v1/account/auth/set-password")
        .set("Authorization", `Bearer ${session.accessToken}`)
        .send({ password: "password1" })
        .expect(200);

      const login = await request(http)
        .post("/api/v1/business/auth/login")
        .send({ phone: "09122000003", password: "password1" })
        .expect(200);

      expect(login.body.data.user.roles).toContain("owner");
    });

    it("resets a password for an owner through the business APIs", async () => {
      const session = await signup("09122000004");
      await grantRole(session.user.phone, "owner");

      await request(http)
        .post("/api/v1/account/auth/set-password")
        .set("Authorization", `Bearer ${session.accessToken}`)
        .send({ password: "password1" })
        .expect(200);

      await request(http)
        .post("/api/v1/business/auth/forgot-password")
        .send({ phone: "09122000004" })
        .expect(200);

      expect(harness.sms.last?.purpose).toBe("reset");

      await request(http)
        .post("/api/v1/business/auth/forgot-password/confirm")
        .send({
          phone: "09122000004",
          code: harness.sms.last?.code,
          password: "password9",
        })
        .expect(200);

      await request(http)
        .post("/api/v1/business/auth/login")
        .send({ phone: "09122000004", password: "password9" })
        .expect(200);
    });
  });

  async function signup(phone: string) {
    await request(http)
      .post("/api/v1/account/auth/otp")
      .send({ phone })
      .expect(201);
    const confirm = await request(http)
      .post("/api/v1/account/auth/otp/confirm")
      .send({ phone, code: harness.sms.last?.code })
      .expect(200);

    return confirm.body.data as {
      accessToken: string;
      refreshToken: string;
      user: { id: string; phone: string; roles: UserRole[] };
    };
  }

  async function grantRole(phone: string, role: UserRole) {
    await userModel.updateOne({ phone }, { $addToSet: { roles: role } });
  }
});
