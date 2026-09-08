import { ClubAccessService } from "./club-access.service";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Connection, Model, Types, createConnection } from "mongoose";
import { Club, ClubSchema, type ClubDocument } from "./schemas/club.schema";
import { ClubsRepository } from "./clubs.repository";
import { ClubFieldsSchema } from "./dto/club-fields.dto";
import {
  Reservation,
  ReservationSchema,
  type ReservationDocument,
} from "../reservations/schemas/reservation.schema";
import {
  ClubReview,
  ClubReviewSchema,
  type ClubReviewDocument,
} from "../reviews/schemas/club-review.schema";
import { ClubReviewsService } from "../reviews/club-reviews.service";
import { ResourcesService } from "../resources/resources.service";
import { ClubsService } from "./clubs.service";
import type { MediaService } from "../media/media.service";
import type { ClubMembershipsService } from "./club-memberships.service";
import type { NotificationsService } from "../notifications/notifications.service";

describe("club profile persistence and trial concurrency", () => {
  let mongo: MongoMemoryServer;
  let connection: Connection;
  let clubs: ClubsRepository;
  let reservations: Model<ReservationDocument>;
  const owner = new Types.ObjectId().toHexString();
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    connection = await createConnection(mongo.getUri()).asPromise();
    clubs = new ClubsRepository(
      connection.model(Club.name, ClubSchema) as unknown as Model<ClubDocument>,
      new ClubAccessService(connection),
    );
    reservations = connection.model(
      Reservation.name,
      ReservationSchema,
    ) as unknown as Model<ReservationDocument>;
    await reservations.createIndexes();
  });
  afterAll(async () => {
    await connection?.close();
    await mongo?.stop();
  });

  it("round-trips structured details and keeps busy-hour freshness separate from unrelated edits", async () => {
    const input = ClubFieldsSchema.parse({
      name: "باشگاه تست",
      profile: {
        spaces: [
          {
            name: "پدل",
            floorType: "چمن مصنوعی",
            roofType: "covered",
            courtCount: 2,
          },
        ],
        firstVisit: { arrivalMinutesBefore: 15 },
      },
      trialBookingEnabled: true,
      busyHours: [{ dayOfWeek: 6, hour: 18, level: "busy" }],
      gallery: [
        {
          mediaId: new Types.ObjectId().toHexString(),
          category: "training",
          takenOn: "2025-01-01",
        },
      ],
    });
    const result = await clubs.create(owner, input);
    expect(result).toMatchObject({
      profile: input.profile,
      trialBookingEnabled: true,
      busyHours: input.busyHours,
      busyHoursSource: "owner_reported",
    });
    expect(result.gallery[0]).toMatchObject({
      category: "training",
      takenOn: "2025-01-01",
    });
    const update = await clubs.update(owner, result.id, {
      description: "توضیح جدید",
      busyHours: input.busyHours,
    });
    expect(update.busyHoursUpdatedAt).toBe(result.busyHoursUpdatedAt);
    const changed = await clubs.update(owner, result.id, {
      busyHours: [],
      trialBookingEnabled: false,
      profile: {},
    });
    expect(changed).toMatchObject({
      busyHours: [],
      trialBookingEnabled: false,
      profile: {},
    });
    expect(changed.busyHoursUpdatedAt).not.toBe(result.busyHoursUpdatedAt);
    await expect(
      clubs.update(new Types.ObjectId().toHexString(), result.id, {
        trialBookingEnabled: true,
      }),
    ).rejects.toMatchObject({ code: "CLUB_NOT_FOUND" });
    const verified = await clubs.verify(result.id, owner, "identity", true);
    expect(verified.verifications.identity?.verifiedAt).toBeDefined();
    expect(verified.verifications.identity).not.toHaveProperty("verifiedBy");
    expect(
      (await clubs.verify(result.id, owner, "identity", false)).verifications
        .identity,
    ).toBeUndefined();
  });

  it("accepts only admin catalog IDs, resolves renames and preserves inactive saved selections", async () => {
    const resources = new ResourcesService(connection);
    const service = new ClubsService(
      clubs,
      resources,
      { assertOwnedReady: async () => undefined } as unknown as MediaService,
      {
        ensureOwner: async () => undefined,
      } as unknown as ClubMembershipsService,
      {} as NotificationsService,
    );
    const roof = await resources.create("facilities", "roof-type", {
      name: "سقف ثابت",
      code: "TEST_FIXED_ROOF",
    });
    const id = String(roof.id);
    const result = await service.create(owner, {
      name: "باشگاه گزینه‌ها",
      profile: { spaces: [{ name: "سالن", roofTypeId: id }] },
    });
    await resources.update("facilities", "roof-type", id, {
      name: "سقف ثابت جدید",
      isActive: false,
    });
    expect(
      (await service.get(owner, result.id)).profileResources?.[id],
    ).toEqual({
      name: "سقف ثابت جدید",
      isActive: false,
    });
    await expect(
      service.update(owner, result.id, { profile: result.profile }),
    ).resolves.toHaveProperty("id", result.id);
    await expect(
      service.create(owner, { name: "باشگاه دوم", profile: result.profile }),
    ).rejects.toMatchObject({ code: "RESOURCE_RELATION_INACTIVE" });
    await expect(
      service.update(owner, result.id, {
        profile: { spaces: [{ name: "سالن", roofType: "covered" }] },
      }),
    ).rejects.toMatchObject({ code: "CLUB_PROFILE_CATALOG_REQUIRED" });
    await expect(
      service.update(owner, result.id, {
        profile: { spaces: [{ name: "سالن", floorTypeId: id }] },
      }),
    ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" });
    await expect(
      resources.delete("facilities", "roof-type", id),
    ).rejects.toMatchObject({ code: "RESOURCE_IN_USE" });
    await expect(
      service.update(owner, result.id, { tags: ["تگ بدون تعریف ادمین"] }),
    ).rejects.toMatchObject({ code: "CLUB_TAG_CATALOG_REQUIRED" });
  });

  it("allows exactly one concurrent trial per club/user and releases eligibility after cancellation", async () => {
    const base = {
      clubId: new Types.ObjectId(),
      userId: new Types.ObjectId(),
      isTrial: true,
      sessionType: "class",
      sessionTitle: "آزمایشی",
      sessionStartsAt: new Date("2035-01-01"),
      sessionEndsAt: new Date("2035-01-02"),
      participantCount: 1,
      totalPrice: 0,
      paymentStatus: "not_required",
      cancellationPolicy: {
        title: "عادی",
        tiers: [{ hoursBefore: 0, refundPercent: 0 }],
      },
    };
    const results = await Promise.allSettled(
      Array.from({ length: 3 }, () =>
        reservations.create({ ...base, sessionId: new Types.ObjectId() }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(2);
    const successful = results.find((r) => r.status === "fulfilled");
    if (successful?.status !== "fulfilled") throw new Error("Missing trial");
    await reservations.updateOne(
      { _id: successful.value._id },
      { $set: { status: "cancelled" } },
    );
    const replacement = await reservations.create({
      ...base,
      sessionId: new Types.ObjectId(),
    });
    await reservations.updateOne(
      { _id: replacement._id },
      { $set: { status: "completed" } },
    );
    await expect(
      reservations.create({ ...base, sessionId: new Types.ObjectId() }),
    ).rejects.toMatchObject({ code: 11000 });
    await expect(
      reservations.create({
        ...base,
        isTrial: false,
        sessionId: new Types.ObjectId(),
        totalPrice: 100,
      }),
    ).resolves.toBeDefined();
  });

  it("uses only active admin criteria and aggregates each score without counting unscored reviews", async () => {
    const resources = new ResourcesService(connection);
    const cleanliness = await resources.create("clubs", "review-criterion", {
      code: "cleanliness",
      name: "نظافت",
      isActive: true,
    } as never);
    const equipment = await resources.create("clubs", "review-criterion", {
      code: "equipment",
      name: "تجهیزات",
      isActive: true,
    } as never);
    const clubId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    await reservations.create({
      clubId,
      userId,
      sessionId: new Types.ObjectId(),
      sessionType: "class",
      sessionTitle: "جلسه",
      sessionStartsAt: new Date(),
      sessionEndsAt: new Date(),
      participantCount: 1,
      totalPrice: 0,
      status: "completed",
      cancellationPolicy: {
        title: "عادی",
        tiers: [{ hoursBefore: 0, refundPercent: 0 }],
      },
    });
    const reviewModel = connection.model(ClubReview.name, ClubReviewSchema);
    const service = new ClubReviewsService(
      reviewModel as unknown as Model<ClubReviewDocument>,
      { getPublic: async () => ({ ownerId: owner }) } as never,
      { updateRatingStats: async () => {} } as never,
      reservations,
      { assertOwnedReady: async () => {} } as never,
      resources,
    );
    const review = await service.create(String(userId), String(clubId), {
      rating: 4,
      body: "خوب",
      ratings: { [String(cleanliness.id)]: 5 },
      mediaIds: [],
    });
    expect(review).toMatchObject({
      isVerifiedBooking: true,
      criterionLabels: { [String(cleanliness.id)]: "نظافت" },
    });
    const summary = await service.list(String(clubId));
    expect(summary.criteriaSummary).toEqual(
      expect.arrayContaining([
        {
          id: String(cleanliness.id),
          name: "نظافت",
          averageRating: 5,
          reviewsCount: 1,
        },
        {
          id: String(equipment.id),
          name: "تجهیزات",
          averageRating: 0,
          reviewsCount: 0,
        },
      ]),
    );
    await resources.update("clubs", "review-criterion", String(equipment.id), {
      isActive: false,
    } as never);
    await expect(
      service.create(String(userId), String(clubId), {
        rating: 4,
        body: "",
        ratings: { [String(equipment.id)]: 4 },
        mediaIds: [],
      }),
    ).rejects.toMatchObject({ code: "RESOURCE_RELATION_INACTIVE" });
    expect(
      (await service.list(String(clubId))).criteria.map((c) => c.id),
    ).not.toContain(equipment.id);
  });
});
