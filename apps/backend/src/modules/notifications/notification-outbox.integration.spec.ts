import { createConnection, type Connection, Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { atomicOperation } from "../../infrastructure/database/atomic-operation";
import { NotificationOutboxService } from "./notification-outbox.service";
import { NotificationsService } from "./notifications.service";
import {
  Notification,
  NotificationSchema,
} from "./schemas/notification.schema";

describe("durable notification outbox", () => {
  jest.setTimeout(60_000);
  let db: Connection, mongo: MongoMemoryReplSet;
  const push = { getPreferences: jest.fn(), sendToUsers: jest.fn() };
  const sms = { sendMessage: jest.fn(), sendTemplate: jest.fn() };
  const users = {
    findById: jest.fn().mockResolvedValue({ phone: "09120000000" }),
  };
  const config = { env: { NODE_ENV: "test" } };
  const userId = new Types.ObjectId();
  const worker = () =>
    new NotificationOutboxService(
      db.model(Notification.name) as never,
      push as never,
      sms as never,
      users as never,
      config as never,
    );
  const enqueue = (extra = {}) =>
    db.model(Notification.name).create({
      userId,
      type: "booking_confirmed",
      title: "رزرو",
      body: "تأیید شد",
      pushDelivery: {},
      smsDelivery: {},
      ...extra,
    });
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({
      replSet: { count: 1, args: ["--oplogSize", "16"] },
    });
    db = await createConnection(mongo.getUri()).asPromise();
    await db.model(Notification.name, NotificationSchema).init();
  });
  beforeEach(async () => {
    await db.model(Notification.name).deleteMany({});
    jest.clearAllMocks();
    push.getPreferences.mockResolvedValue({
      bookingUpdates: true,
      reminders: true,
      discovery: true,
      marketing: false,
    });
    push.sendToUsers.mockResolvedValue("accepted");
    sms.sendMessage.mockResolvedValue(undefined);
  });
  afterAll(async () => {
    await db?.close();
    await mongo?.stop();
  });

  it("delivers committed records after restart, ignores legacy records, and isolates concurrent workers", async () => {
    const item = await enqueue();
    await enqueue({ pushDelivery: null, smsDelivery: null });
    await Promise.all([worker().run(), worker().run()]);
    await worker().run();
    expect(push.sendToUsers).toHaveBeenCalledTimes(1);
    expect(sms.sendMessage).toHaveBeenCalledTimes(1);
    const saved = await db.model(Notification.name).findById(item._id);
    expect(saved.pushDelivery.state).toBe("accepted");
    expect(saved.smsDelivery.state).toBe("accepted");
    expect(push.sendToUsers.mock.calls[0]?.[0].deliveryId).toBe(
      String(item._id),
    );
  });

  it("rolls back both in-app notification and delivery on failed commerce transactions", async () => {
    const outbox = worker();
    const notifications = new NotificationsService(
      db.model(Notification.name) as never,
      {} as never,
      config as never,
      outbox,
    );
    await expect(
      atomicOperation(db, async () => {
        await notifications.notifyBookingConfirmed({
          userId,
          bookingId: new Types.ObjectId(),
          title: "کلاس",
        });
        throw new Error("transaction interrupted");
      }),
    ).rejects.toThrow("transaction interrupted");
    expect(await db.model(Notification.name).countDocuments()).toBe(0);
    expect(push.sendToUsers).not.toHaveBeenCalled();
    expect(sms.sendMessage).not.toHaveBeenCalled();
    await atomicOperation(db, () =>
      notifications.notifyBookingConfirmed({
        userId,
        bookingId: new Types.ObjectId(),
        title: "کلاس",
      }),
    );
    expect(push.sendToUsers).toHaveBeenCalledTimes(1);
  });

  it("retries failed channels without resending a successful channel and recovers expired leases", async () => {
    const item = await enqueue();
    sms.sendMessage.mockRejectedValueOnce(new Error("provider unavailable"));
    await worker().run();
    let saved = await db.model(Notification.name).findById(item._id);
    expect(saved.smsDelivery.state).toBe("pending");
    expect(saved.smsDelivery.errorCode).toBe("DELIVERY_FAILED");
    await db.model(Notification.name).updateOne(
      { _id: item._id },
      {
        $set: {
          "smsDelivery.state": "processing",
          "smsDelivery.leaseToken": "crashed-process",
          "smsDelivery.leaseUntil": new Date(0),
        },
      },
    );
    await worker().run();
    saved = await db.model(Notification.name).findById(item._id);
    expect(saved.smsDelivery.state).toBe("accepted");
    expect(sms.sendMessage).toHaveBeenCalledTimes(2);
    expect(push.sendToUsers).toHaveBeenCalledTimes(1);
  });

  it("honors changed preferences before external delivery and retains the in-app message", async () => {
    await enqueue({ type: "booking_reminder" });
    push.getPreferences.mockResolvedValue({ reminders: false });
    await worker().run();
    expect(push.sendToUsers).not.toHaveBeenCalled();
    expect(sms.sendMessage).not.toHaveBeenCalled();
    const saved = await db.model(Notification.name).findOne();
    expect(saved.pushDelivery.state).toBe("skipped");
    expect(saved.smsDelivery.state).toBe("skipped");
  });

  it("reports exhausted deliveries without sensitive payloads and permits an explicit retry", async () => {
    const item = await enqueue({ smsDelivery: { attempts: 7 } });
    sms.sendMessage.mockRejectedValueOnce(
      new Error("provider secret response"),
    );
    const outbox = worker();
    await outbox.run();
    const report = await outbox.report();
    expect(report.failed).toHaveLength(1);
    expect(JSON.stringify(report)).not.toContain("09120000000");
    expect(JSON.stringify(report)).not.toContain("provider secret response");
    await outbox.retry(String(item._id));
    await worker().run();
    expect((await outbox.report()).failed).toHaveLength(0);
    expect(push.sendToUsers).toHaveBeenCalledTimes(1);
    await expect(outbox.retry(String(item._id))).rejects.toThrow();
  });
});
