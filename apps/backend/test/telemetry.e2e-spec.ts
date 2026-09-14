import { INestApplication } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { MongoMemoryServer } from "./mongo-memory";
import request from "supertest";
import type { App } from "supertest/types";

import { AnalyticsReportService } from "../src/modules/telemetry/analytics-report.service";
import { OutcomeSyncService } from "../src/modules/telemetry/outcome-sync.service";
import { PRIVACY_POLICY_VERSION } from "../src/modules/auth/privacy.service";
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
    const profile = await request(http)
      .get("/api/v1/account/me")
      .set("Authorization", `Bearer ${token}`);
    await connection.collection("clubs").insertOne({
      _id: new Types.ObjectId(clubId),
      ownerId: new Types.ObjectId(profile.body.data.id),
      name: "Analytics test",
    });

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
      event: "discovery.club_viewed",
      properties: { club_id: clubId },
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
      event: "discovery.club_viewed",
      groupType: "club",
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

  it("ignores client payment outcomes and honors a declined consent", async () => {
    const token = await signup("09121112235");
    const eventId = crypto.randomUUID();
    await request(http)
      .post("/api/v1/telemetry/events")
      .set("Authorization", `Bearer ${token}`)
      .send({
        eventId,
        occurredAt: new Date().toISOString(),
        platform: "web",
        appVersion: "test",
        event: "payment.succeeded",
        properties: {
          reservation_id: new Types.ObjectId().toHexString(),
          club_id: new Types.ObjectId().toHexString(),
        },
      })
      .expect(202);
    expect(
      await connection
        .collection("product_telemetry")
        .countDocuments({ eventId }),
    ).toBe(0);
    const profile = await request(http)
      .get("/api/v1/account/me")
      .set("Authorization", `Bearer ${token}`);
    await connection.collection("data_consents").updateOne(
      {
        userId: new Types.ObjectId(profile.body.data.id),
        purpose: "analytics",
      },
      { $set: { granted: false } },
    );
    await request(http)
      .post("/api/v1/telemetry/events")
      .set("Authorization", `Bearer ${token}`)
      .send({
        eventId,
        occurredAt: new Date().toISOString(),
        platform: "web",
        appVersion: "test",
        event: "app.opened",
        properties: { screen: "discovery" },
      })
      .expect(202);
    expect(
      await connection
        .collection("product_telemetry")
        .countDocuments({ eventId }),
    ).toBe(0);
  });

  it("isolates club reports and computes financial totals from committed records", async () => {
    const owner = new Types.ObjectId(),
      club = new Types.ObjectId(),
      other = new Types.ObjectId();
    await connection
      .collection("clubs")
      .insertOne({ _id: club, ownerId: owner, name: "Scoped club" });
    const now = new Date();
    await connection.collection("session_reservations").insertMany([
      {
        clubId: club,
        userId: owner,
        createdAt: now,
        status: "reserved",
        paymentStatus: "paid",
      },
      {
        clubId: other,
        userId: owner,
        createdAt: now,
        status: "reserved",
        paymentStatus: "paid",
      },
    ]);
    await connection.collection("payment_intents").insertMany([
      {
        clubId: club,
        userId: owner,
        createdAt: now,
        paidAt: now,
        status: "paid",
        amount: 1000,
        walletAmount: 100,
        refundedGatewayAmount: 0,
        refundedWalletAmount: 0,
      },
      {
        clubId: other,
        userId: owner,
        createdAt: now,
        paidAt: now,
        status: "paid",
        amount: 99000,
      },
    ]);
    await connection.collection("ledger_entries").insertOne({
      ownerId: club,
      account: "provider_payable",
      direction: "credit",
      amount: 900,
      sourceType: "payment",
      createdAt: now,
    });
    const reports = app.get(AnalyticsReportService);
    const report = await reports.business(String(owner), String(club), "30");
    expect(report.metrics.find((m) => m.key === "reservations")?.value).toBe(1);
    expect(report.metrics.find((m) => m.key === "received")?.value).toBe(1100);
    expect(report.metrics.find((m) => m.key === "revenue")?.value).toBe(900);
    expect(report.integration).toBeUndefined();
    await expect(
      reports.business(String(owner), String(other), "30"),
    ).rejects.toThrow("This club operation is not permitted");
    const noMoney = await reports.report("30", undefined, String(club), false);
    expect(
      noMoney.metrics.some((m) =>
        ["received", "revenue", "refunds", "payingCustomers"].includes(m.key),
      ),
    ).toBe(false);
  });

  it("reconciles server payment outcomes once across repeated runs", async () => {
    const token = await signup("09121112236");
    const profile = await request(http)
      .get("/api/v1/account/me")
      .set("Authorization", `Bearer ${token}`);
    const userId = new Types.ObjectId(profile.body.data.id),
      clubId = new Types.ObjectId(),
      id = new Types.ObjectId();
    const past = new Date(Date.now() - 3 * 86400000),
      at = new Date(Date.now() - 120000);
    await connection
      .collection("data_consents")
      .updateOne(
        { userId, purpose: "analytics" },
        { $set: { decidedAt: past } },
      );
    await connection
      .collection("analytics_sync_state")
      .updateOne(
        { _id: "outcomes:test:v1" as never },
        { $set: { startedAt: past, through: past } },
        { upsert: true },
      );
    await connection.collection("payment_intents").insertOne({
      _id: id,
      userId,
      clubId,
      referenceId: new Types.ObjectId(),
      referenceType: "reservation",
      provider: "mock",
      status: "paid",
      amount: 1000,
      createdAt: at,
      updatedAt: at,
      paidAt: at,
    });
    const sync = app.get(OutcomeSyncService);
    await sync.run();
    await sync.run();
    const rows = await connection
      .collection("product_telemetry")
      .find({ "properties.payment_id": String(id) })
      .toArray();
    expect(rows.map((r) => r.event).sort()).toEqual([
      "payment.started",
      "payment.succeeded",
    ]);
    expect(rows.every((r) => r.source === "server")).toBe(true);
  });

  async function signup(phone: string): Promise<string> {
    await request(http).post("/api/v1/account/auth/otp").send({ phone });
    const response = await request(http)
      .post("/api/v1/account/auth/otp/confirm")
      .send({ phone, code: harness.sms.last?.code })
      .expect(200);
    const token = response.body.data.accessToken as string;
    const profile = await request(http)
      .get("/api/v1/account/me")
      .set("Authorization", `Bearer ${token}`);
    await connection.collection("data_consents").updateOne(
      {
        userId: new Types.ObjectId(profile.body.data.id),
        purpose: "analytics",
      },
      {
        $set: {
          granted: true,
          version: PRIVACY_POLICY_VERSION,
          decidedAt: new Date(),
        },
      },
      { upsert: true },
    );
    return token;
  }
});
