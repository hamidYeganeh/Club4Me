import { createConnection, type Connection, Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ReservationsService } from "./reservations.service";
import { CreateCourtDto, UpdateCourtDto } from "./dto/reservation.dto";
import { Court, CourtSchema } from "./schemas/court.schema";
import {
  ReservableSession,
  ReservableSessionSchema,
} from "./schemas/reservable-session.schema";
import { Reservation, ReservationSchema } from "./schemas/reservation.schema";
import { AppError } from "../../common/errors/app.exception";
import { MediaService } from "../media/media.service";
import { MediaSchema } from "../media/schemas/media.schema";

describe("court editing and sales availability", () => {
  jest.setTimeout(60_000);
  let mongo: MongoMemoryServer;
  let db: Connection;
  let service: ReservationsService;
  let media: MediaService;
  const owner = String(new Types.ObjectId());
  const clubId = String(new Types.ObjectId());
  const otherClub = String(new Types.ObjectId());
  const resources = { requireActive: jest.fn().mockResolvedValue({}) };
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    db = await createConnection(mongo.getUri()).asPromise();
    const courts = db.model(Court.name, CourtSchema);
    const sessions = db.model(ReservableSession.name, ReservableSessionSchema);
    const reservations = db.model(Reservation.name, ReservationSchema);
    const files = db.model("Media", MediaSchema);
    media = new MediaService(files as never, {} as never);
    service = new ReservationsService(
      courts as never,
      sessions as never,
      reservations as never,
      {
        get: async (user: string) => {
          if (user !== owner) throw new AppError(403, "FORBIDDEN", "Forbidden");
          return {};
        },
        getPublic: async () => ({ operationalStatus: "active" }),
      } as never,
      resources as never,
      {} as never,
      {} as never,
      {} as never,
      media,
      {} as never,
      {} as never,
      {} as never,
    );
    await Promise.all([
      courts.init(),
      sessions.init(),
      reservations.init(),
      files.init(),
    ]);
  });
  afterAll(async () => {
    await db?.close();
    await mongo?.stop();
  });
  afterEach(async () => {
    await Promise.all(
      Object.values(db.collections).map((collection) =>
        collection.deleteMany({}),
      ),
    );
  });
  const create = (extra = {}) =>
    service.createCourt(
      owner,
      clubId,
      CreateCourtDto.schema.parse({ name: "زمین تنیس", capacity: 8, ...extra }),
    );
  const file = async (user = owner, hash = "image") =>
    db.model("Media").create({
      ownerId: new Types.ObjectId(user),
      hash,
      byteSize: 1,
      url: "https://example.com/court.png",
      mimeType: "image/png",
      status: "ready",
    });
  const session = async (courtId: string) =>
    db.model(ReservableSession.name).create({
      clubId: new Types.ObjectId(clubId),
      courtId: new Types.ObjectId(courtId),
      title: "سانس زمین",
      capacity: 8,
      startsAt: new Date("2035-01-01"),
      endsAt: new Date("2035-01-01T01:00:00Z"),
      basePrice: 1000,
      currency: "IRR",
      pricingUnit: "per_session",
      status: "active",
      cancellationPolicy: {
        title: "لغو",
        tiers: [{ hoursBefore: 0, refundPercent: 100 }],
      },
    });

  it("does not apply creation defaults on a partial edit and preserves gallery, dimensions and sports", async () => {
    expect(UpdateCourtDto.schema.parse({ name: "نام جدید" })).toEqual({
      name: "نام جدید",
    });
    const image = await file();
    const court = await create({
      sportIds: [String(new Types.ObjectId())],
      galleryMediaIds: [String(image._id)],
      widthMeters: 12,
      lengthMeters: 24,
      environment: "outdoor",
      minimumReservationMinutes: 90,
    });
    const updated = await service.updateCourt(owner, clubId, court.id, {
      name: "نام جدید",
      expectedUpdatedAt: court.updatedAt,
    });
    expect(updated).toMatchObject({
      name: "نام جدید",
      sportIds: court.sportIds,
      galleryMediaIds: court.galleryMediaIds,
      widthMeters: 12,
      lengthMeters: 24,
      environment: "outdoor",
      minimumReservationMinutes: 90,
    });
    const cleared = await service.updateCourt(owner, clubId, court.id, {
      widthMeters: null,
      surfaceTypeId: null,
      galleryMediaIds: [],
    });
    expect(cleared.widthMeters).toBeUndefined();
    expect(cleared.galleryMediaIds).toEqual([]);
  });
  it("rejects foreign club IDs and media before changing the court", async () => {
    const court = await create();
    const foreign = await file(String(new Types.ObjectId()));
    await expect(
      service.updateCourt(owner, otherClub, court.id, { name: "غیرمجاز" }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      service.updateCourt(String(new Types.ObjectId()), clubId, court.id, {
        name: "غیرمجاز",
      }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service.updateCourt(owner, clubId, court.id, {
        galleryMediaIds: [String(foreign._id)],
      }),
    ).rejects.toThrow();
    expect((await service.listCourts(owner, clubId)).items[0]?.name).toBe(
      "زمین تنیس",
    );
  });
  it("rejects stale concurrent edits and merged invalid duration", async () => {
    const court = await create();
    await db
      .model(Court.name)
      .updateOne(
        { _id: court.id },
        { $set: { name: "ویرایش همکار", updatedAt: new Date("2030-01-01") } },
        { timestamps: false },
      );
    await expect(
      service.updateCourt(owner, clubId, court.id, {
        name: "ویرایش قدیمی",
        expectedUpdatedAt: court.updatedAt,
      }),
    ).rejects.toMatchObject({ code: "COURT_CHANGED" });
    await expect(
      service.updateCourt(owner, clubId, court.id, {
        minimumReservationMinutes: 500,
      }),
    ).rejects.toMatchObject({ code: "COURT_DURATION_INVALID" });
  });
  it("pauses new sales while keeping sessions and reservations, and blocks unsafe capacity reduction", async () => {
    const court = await create();
    const slot = await session(court.id);
    await expect(
      service.updateCourt(owner, clubId, court.id, { capacity: 2 }),
    ).rejects.toMatchObject({ code: "COURT_CAPACITY_IN_USE" });
    expect((await service.listPublicSessions(clubId)).items).toHaveLength(1);
    await service.updateCourt(owner, clubId, court.id, { isReservable: false });
    expect((await service.listPublicSessions(clubId)).items).toHaveLength(0);
    await expect(
      service.quote(owner, {
        sessionId: String(slot._id),
        participantCount: 1,
      }),
    ).rejects.toMatchObject({ code: "COURT_NOT_RESERVABLE" });
    expect(
      await db
        .model(ReservableSession.name)
        .countDocuments({ status: "active" }),
    ).toBe(1);
    await service.updateCourt(owner, clubId, court.id, { isReservable: true });
    expect((await service.listPublicSessions(clubId)).items).toHaveLength(1);
  });
  it("retrieves selected old media beyond the newest 100 without exposing another owner's files", async () => {
    const oldest = await file(owner, "oldest");
    await db
      .model("Media")
      .updateOne(
        { _id: oldest._id },
        { $set: { createdAt: new Date("2020-01-01") } },
        { timestamps: false },
      );
    await Promise.all(
      Array.from({ length: 101 }, (_, index) => file(owner, `new-${index}`)),
    );
    const foreign = await file(String(new Types.ObjectId()), "foreign");
    expect(
      (await media.list(owner)).items.some(
        (item) => item.id === String(oldest._id),
      ),
    ).toBe(false);
    expect(
      (await media.list(owner, `${oldest._id},${foreign._id}`)).items.map(
        (item) => item.id,
      ),
    ).toEqual([String(oldest._id)]);
    await expect(media.list(owner, "invalid")).rejects.toMatchObject({
      status: 400,
    });
  });
});
