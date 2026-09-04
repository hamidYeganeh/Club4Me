import { INestApplication } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import type { App } from "supertest/types";

import { createAuthTestApp, type AuthTestApp } from "./auth-test-app";

describe("Product telemetry e2e", () => {
  jest.setTimeout(60_000);
  let mongo: MongoMemoryServer;
  let harness: AuthTestApp;
  let app: INestApplication;
  let http: App;
  let connection: Connection;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    harness = await createAuthTestApp(mongo.getUri());
    app = harness.app;
    http = app.getHttpServer() as App;
    connection = app.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongo) await mongo.stop();
  });

  it("accepts identify, group and track without PII and de-duplicates retries", async () => {
    const token = await signup("09121112233");
    const clubId = new Types.ObjectId().toHexString();
    const sessionId = new Types.ObjectId().toHexString();
    const now = new Date().toISOString();

    await request(http)
      .post("/api/v1/telemetry/identify")
      .set("Authorization", `Bearer ${token}`)
      .send({
        eventId: crypto.randomUUID(),
        occurredAt: now,
        platform: "android",
        appVersion: "1.0.0",
        traits: { created_at: now, locale: "fa-IR", platform: "android" },
      })
      .expect(202);

    await request(http)
      .post("/api/v1/telemetry/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({
        eventId: crypto.randomUUID(),
        occurredAt: now,
        platform: "android",
        appVersion: "1.0.0",
        groupType: "session",
        groupId: sessionId,
        traits: {
          parent_group_id: clubId,
          session_type: "class",
          status: "active",
          starts_at: now,
        },
      })
      .expect(202);

    const eventId = crypto.randomUUID();
    const event = {
      eventId,
      occurredAt: now,
      platform: "android",
      appVersion: "1.0.0",
      event: "reservation.created",
      properties: {
        reservation_id: new Types.ObjectId().toHexString(),
        club_id: clubId,
        session_id: sessionId,
        session_type: "class",
        participant_count: 1,
      },
    };
    await request(http)
      .post("/api/v1/telemetry/events")
      .set("Authorization", `Bearer ${token}`)
      .send(event)
      .expect(202);
    await request(http)
      .post("/api/v1/telemetry/events")
      .set("Authorization", `Bearer ${token}`)
      .send(event)
      .expect(202);

    expect(
      await connection.collection("product_telemetry").countDocuments(),
    ).toBe(3);
    const stored = await connection
      .collection("product_telemetry")
      .findOne({ eventId });
    expect(stored).toMatchObject({
      event: "reservation.created",
      groupType: "session",
      platform: "android",
    });
    expect(stored).not.toHaveProperty("phone");
  });

  it("rejects unapproved personal fields", async () => {
    const token = await signup("09121112234");
    const now = new Date().toISOString();
    await request(http)
      .post("/api/v1/telemetry/identify")
      .set("Authorization", `Bearer ${token}`)
      .send({
        eventId: crypto.randomUUID(),
        occurredAt: now,
        platform: "web",
        appVersion: "development",
        traits: {
          created_at: now,
          locale: "fa-IR",
          platform: "web",
          phone: "+989121112234",
        },
      })
      .expect(400);
  });

  async function signup(phone: string): Promise<string> {
    await request(http).post("/api/v1/account/auth/otp").send({ phone });
    const response = await request(http)
      .post("/api/v1/account/auth/otp/confirm")
      .send({ phone, code: harness.sms.last?.code })
      .expect(200);
    return response.body.data.accessToken as string;
  }
});
