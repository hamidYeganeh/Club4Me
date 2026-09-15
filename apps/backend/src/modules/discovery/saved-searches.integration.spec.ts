import mongoose, { type Connection } from "mongoose";
import { MongoMemoryReplSet } from "../../../test/mongo-memory";
import { SavedSearchesService } from "./saved-searches";
import type { DiscoveryFeedService } from "./discovery.service";
import type { NotificationsService } from "../notifications/notifications.service";
import type { AppConfigService } from "../../config/app-config.service";

describe("saved search subscriptions", () => {
  let mongo: MongoMemoryReplSet, db: Connection, service: SavedSearchesService;
  const userId = new mongoose.Types.ObjectId().toHexString();
  const search = jest.fn(),
    notify = jest.fn();
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    db = await mongoose.createConnection(mongo.getUri()).asPromise();
    service = new SavedSearchesService(
      db,
      { searchPublicCatalog: search } as unknown as DiscoveryFeedService,
      { notifyDiscoveryMatch: notify } as unknown as NotificationsService,
      { env: { NODE_ENV: "test" } } as AppConfigService,
    );
    await service.onModuleInit();
  });
  afterAll(async () => {
    service?.onModuleDestroy();
    await db?.close();
    await mongo?.stop();
  });
  it("enforces quota across concurrent requests", async () => {
    search.mockResolvedValue({
      clubs: [],
      coaches: [],
      classes: [],
      businessClasses: [],
    });
    const owner = new mongoose.Types.ObjectId().toHexString();
    for (let i = 0; i < 19; i++)
      await service.save(owner, {
        title: "جست‌وجو",
        alerts: false,
        filters: { q: String(i) },
      });
    const results = await Promise.allSettled(
      [20, 21].map((i) =>
        service.save(owner, {
          title: "جست‌وجو",
          alerts: false,
          filters: { q: String(i) },
        }),
      ),
    );
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect((await service.list(owner)).items).toHaveLength(20);
    await db
      .collection("saved_discovery_searches")
      .deleteMany({ userId: new mongoose.Types.ObjectId(owner) });
  });
  it("does not announce baseline results; alerts only after a new match and cannot remove another account's search", async () => {
    search.mockResolvedValue({
      clubs: [{ id: "first" }],
      coaches: [],
      classes: [],
      businessClasses: [],
    });
    const saved = await service.save(userId, {
      title: "باشگاه",
      alerts: true,
      filters: { q: "باشگاه", kind: "club" },
    });
    await service.save(userId, {
      title: "باشگاه نزدیک",
      alerts: true,
      filters: { kind: "club", q: "باشگاه" },
    });
    expect((await service.list(userId)).items).toHaveLength(1);
    await service.remove(new mongoose.Types.ObjectId().toHexString(), saved.id);
    expect((await service.list(userId)).items).toHaveLength(1);
    await db
      .collection("saved_discovery_searches")
      .updateMany({}, { $set: { nextCheckAt: new Date(0) } });
    await service.scan();
    expect(notify).not.toHaveBeenCalled();
    search.mockResolvedValue({
      clubs: [{ id: "second" }, { id: "first" }],
      coaches: [],
      classes: [],
      businessClasses: [],
    });
    await db
      .collection("saved_discovery_searches")
      .updateMany({}, { $set: { nextCheckAt: new Date(0) } });
    await Promise.all([service.scan(), service.scan()]);
    expect(notify).toHaveBeenCalledTimes(1);
    await service.remove(userId, saved.id);
    expect((await service.list(userId)).items).toHaveLength(0);
  });
});
