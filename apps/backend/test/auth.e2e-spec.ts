import { INestApplication } from "@nestjs/common";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import type { App } from "supertest/types";

import { challengeKey } from "../src/modules/auth/services/otp.service";
import { createAuthTestApp, type AuthTestApp } from "./auth-test-app";

describe("Auth e2e", () => {
  jest.setTimeout(60_000);
  let mongo: MongoMemoryServer;
  let harness: AuthTestApp;
  let app: INestApplication;
  let http: App;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    harness = await createAuthTestApp(mongo.getUri());
    app = harness.app;
    http = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
    await mongo.stop();
  });

  afterEach(async () => {
    await harness.redis.flush();
    harness.sms.calls.length = 0;
    harness.sms.last = undefined;
  });

  it("requests and confirms a login OTP", async () => {
    const otpResponse = await request(http)
      .post("/api/v1/account/auth/otp")
      .send({ phone: "09121234567" })
      .expect(201);

    expect(otpResponse.body).toEqual({
      data: { expiresIn: 300 },
      meta: { version: "v1" },
    });
    expect(otpResponse.body.data).not.toHaveProperty("code");

    const confirm = await request(http)
      .post("/api/v1/account/auth/otp/confirm")
      .send({ phone: "09121234567", code: harness.sms.last?.code })
      .expect(200);

    expect(confirm.body.data.accessToken).toEqual(expect.any(String));
    expect(confirm.body.data.refreshToken).toEqual(expect.any(String));
    expect(confirm.body.data.expiresIn).toBe(15 * 60);
    expect(confirm.body.data.user.phone).toBe("+989121234567");
    expect(confirm.body.data.user).not.toHaveProperty("passwordHash");
  });

  it("accepts snake_case aliases", async () => {
    await request(http)
      .post("/api/v1/account/auth/otp")
      .send({ phone_number: "09120000001" })
      .expect(201);

    const confirm = await request(http)
      .post("/api/v1/account/auth/otp/confirm")
      .send({ phone_number: "09120000001", otp: harness.sms.last?.code })
      .expect(200);

    expect(confirm.body.meta.version).toBe("v1");
  });

  it("logs in with a password after it is set", async () => {
    const session = await signup("09120000002");

    await request(http)
      .post("/api/v1/account/auth/set-password")
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ password: "password1" })
      .expect(200);

    const login = await request(http)
      .post("/api/v1/account/auth/login")
      .send({ phone: "09120000002", password: "password1" })
      .expect(200);

    expect(login.body.data.user.hasPassword).toBe(true);

    await request(http)
      .post("/api/v1/account/auth/login")
      .send({ phone: "09120000002", password: "wrong-pass" })
      .expect(401)
      .expect((res) => {
        expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
      });
  });

  it("requires the current password when changing an existing password", async () => {
    const session = await signup("09120000003");

    await request(http)
      .post("/api/v1/account/auth/set-password")
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ password: "password1" })
      .expect(200);

    await request(http)
      .post("/api/v1/account/auth/set-password")
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ password: "password2" })
      .expect(400)
      .expect((res) => {
        expect(res.body.error.code).toBe("CURRENT_PASSWORD_REQUIRED");
      });

    const changed = await request(http)
      .post("/api/v1/account/auth/set-password")
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ password: "password2", current_password: "password1" })
      .expect(200);

    expect(changed.body.data.hasPassword).toBe(true);
    expect(changed.body.data).not.toHaveProperty("passwordHash");
  });

  it("resets a password with a dedicated OTP purpose", async () => {
    const session = await signup("09120000004");
    await request(http)
      .post("/api/v1/account/auth/set-password")
      .set("Authorization", `Bearer ${session.accessToken}`)
      .send({ password: "password1" })
      .expect(200);

    await request(http)
      .post("/api/v1/account/auth/forgot-password")
      .send({ phone: "09120000004" })
      .expect(200);

    expect(harness.sms.last?.purpose).toBe("reset");

    const reset = await request(http)
      .post("/api/v1/account/auth/forgot-password/confirm")
      .send({
        phone: "09120000004",
        code: harness.sms.last?.code,
        password: "password9",
      })
      .expect(200);

    await request(http)
      .post("/api/v1/account/auth/login")
      .send({ phone: "09120000004", password: "password9" })
      .expect(200);

    expect(reset.body.data.accessToken).toEqual(expect.any(String));
  });

  it("rotates refresh tokens and rejects replay", async () => {
    const session = await signup("09120000005");

    const rotated = await request(http)
      .post("/api/v1/account/auth/refresh")
      .send({ refresh_token: session.refreshToken })
      .expect(200);

    expect(rotated.body.data.refreshToken).not.toBe(session.refreshToken);

    await request(http)
      .post("/api/v1/account/auth/refresh")
      .send({ refreshToken: session.refreshToken })
      .expect(401)
      .expect((res) => {
        expect(res.body.error.code).toBe("UNAUTHORIZED");
      });

    await request(http)
      .post("/api/v1/account/auth/refresh")
      .send({ refreshToken: session.accessToken })
      .expect(401);
  });

  it("logs out every refresh session and keeps /me working until access expires", async () => {
    const session = await signup("09120000006");

    await request(http)
      .post("/api/v1/account/auth/logout")
      .set("Authorization", `Bearer ${session.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          data: { success: true },
          meta: { version: "v1" },
        });
      });

    await request(http)
      .post("/api/v1/account/auth/refresh")
      .send({ refreshToken: session.refreshToken })
      .expect(401);

    await request(http)
      .get("/api/v1/account/me")
      .set("Authorization", `Bearer ${session.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.phone).toBe("+989120000006");
        expect(res.body.data).not.toHaveProperty("passwordHash");
      });
  });

  it("rejects a refresh token on authenticated routes", async () => {
    const session = await signup("09120000007");

    await request(http)
      .get("/api/v1/account/me")
      .set("Authorization", `Bearer ${session.refreshToken}`)
      .expect(401);
  });

  it("returns the stable error envelope for validation failures", async () => {
    const response = await request(http)
      .post("/api/v1/account/auth/login")
      .send({ phone: "123", password: "short" })
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request",
        details: expect.any(Array),
      },
    });
  });

  it("expires OTP challenges stored in Redis", async () => {
    await request(http)
      .post("/api/v1/account/auth/otp")
      .send({ phone: "09120000008" })
      .expect(201);

    const key = challengeKey("login", "+989120000008");
    const ttl = await harness.redis.pttl(key);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(300_000);
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
      user: { id: string; phone: string };
    };
  }
});
