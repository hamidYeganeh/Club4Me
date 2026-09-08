import { createConnection, type Connection, Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { PushNotificationsService } from "./push-notifications.service";
import { NotificationPreferencesSchema } from "./schemas/notification-preferences.schema";

describe("notification preference persistence", () => {
  jest.setTimeout(60_000);
  let mongo: MongoMemoryServer;
  let db: Connection;
  let service: PushNotificationsService;
  const user = new Types.ObjectId();
  const other = new Types.ObjectId();
  const freshService = () => {
    // Exercise real persistence without initializing Firebase or sending push.
    const instance = Object.create(
      PushNotificationsService.prototype,
    ) as PushNotificationsService;
    Object.assign(instance, {
      preferences: db.model("NotificationPreferences"),
    });
    return instance;
  };
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    db = await createConnection(mongo.getUri()).asPromise();
    await db
      .model("NotificationPreferences", NotificationPreferencesSchema)
      .init();
    service = freshService();
  });
  afterAll(async () => {
    await db?.close();
    await mongo?.stop();
  });
  it("persists partial updates, retains other options and isolates accounts", async () => {
    expect(await service.getPreferences(String(user))).toEqual({
      bookingUpdates: true,
      reminders: true,
      discovery: true,
      marketing: false,
    });
    await service.updatePreferences(String(user), { reminders: false });
    await service.updatePreferences(String(user), {
      discovery: false,
      marketing: true,
    });
    expect(await freshService().getPreferences(String(user))).toEqual({
      bookingUpdates: true,
      reminders: false,
      discovery: false,
      marketing: true,
    });
    expect(await service.getPreferences(String(other))).toEqual({
      bookingUpdates: true,
      reminders: true,
      discovery: true,
      marketing: false,
    });
    expect(
      await db
        .collection("notification_preferences")
        .countDocuments({ userId: user }),
    ).toBe(1);
  });
  it("excludes users who disabled a push category without sending notifications", async () => {
    await service.updatePreferences(String(user), { reminders: false });
    const recipientSelector = service as unknown as {
      allowedUserIds(
        ids: Types.ObjectId[],
        category: string,
      ): Promise<Types.ObjectId[]>;
    };
    const recipients = await recipientSelector.allowedUserIds(
      [user, other],
      "reminders",
    );
    expect(recipients.map(String)).toEqual([String(other)]);
  });
});
