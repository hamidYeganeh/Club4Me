import { EnrollmentsService } from "../coaching/services/enrollments.service";
import {
  ClassEnrollment,
  ClassEnrollmentSchema,
  TrainingClass,
  TrainingClassSchema,
} from "../coaching/schemas/coaching.schemas";
import { MongoMemoryReplSet } from "../../../test/mongo-memory";
import { Connection, createConnection, Types } from "mongoose";
import { ClubReviewsService } from "./club-reviews.service";
import { ClubReview, ClubReviewSchema } from "./schemas/club-review.schema";
import { Coach, CoachSchema } from "../coaching/schemas/coaching.schemas";
import { DiscoveryFeedService } from "../discovery/discovery.service";
import { ClassBillingService } from "../business-operations/class-billing.service";
import {
  BusinessClassEnrollment,
  BusinessClassEnrollmentSchema,
  BusinessTrainingClass,
  BusinessTrainingClassSchema,
} from "../business-operations/schemas/training-class.schema";
import {
  ClubManualPayment,
  ClubManualPaymentSchema,
} from "../business-operations/schemas/payment.schema";

const oid = () => new Types.ObjectId();
describe("September audit regressions", () => {
  jest.setTimeout(90000);
  let mongo: MongoMemoryReplSet;
  let db: Connection;
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({
      instanceOpts: [{ launchTimeout: 60000 }],
      replSet: { count: 1, args: ["--oplogSize", "16"] },
    });
    db = await createConnection(mongo.getUri()).asPromise();
  });
  afterEach(async () => {
    if (db)
      await Promise.all(
        Object.values(db.collections).map((collection) =>
          collection.deleteMany({}),
        ),
      );
  });
  afterAll(async () => {
    if (db) await db.close();
    if (mongo) await mongo.stop();
  });

  it("retrieves old reviews and filters on the server, independently of public visibility", async () => {
    const model = db.model(ClubReview.name, ClubReviewSchema);
    const clubId = oid();
    const getPublic = jest.fn().mockRejectedValue(new Error("private club"));
    const get = jest.fn().mockResolvedValue({ id: String(clubId) });
    const service = new ClubReviewsService(
      model as never,
      { getPublic, get } as never,
      {} as never,
      {} as never,
      {} as never,
      { list: async () => ({ items: [], totalPages: 1 }) } as never,
    );
    await model.insertMany(
      Array.from({ length: 105 }, (_, index) => ({
        clubId,
        userId: oid(),
        rating: index === 0 ? 1 : 5,
        title: index === 0 ? "old [review]" : "new",
        body: "review",
        status: "published",
        createdAt: new Date(2026, 0, index + 1),
        ownerResponse:
          index === 0
            ? null
            : { body: "answer", respondedAt: new Date(), respondedBy: oid() },
      })),
    );
    const page = await service.listForBusiness("owner", String(clubId), {
      page: "6",
      limit: "20",
    });
    expect(page).toMatchObject({ total: 105, totalPages: 6, page: 6 });
    expect(page.items).toHaveLength(5);
    expect(page.items.some((item) => item.title === "old [review]")).toBe(true);
    const search = await service.listForBusiness("owner", String(clubId), {
      q: "[review]",
      hasResponse: "no",
      rating: "1",
    });
    expect(search.total).toBe(1);
    expect(search.distribution).toEqual([104, 0, 0, 0, 1]);
    expect(get).toHaveBeenCalledWith("owner", String(clubId), "club.read");
    expect(getPublic).not.toHaveBeenCalled();
    await expect(service.list(String(clubId))).rejects.toThrow("private club");
    get.mockRejectedValueOnce(new Error("permission denied"));
    await expect(
      service.listForBusiness("outsider", String(clubId)),
    ).rejects.toThrow("permission denied");
    await expect(
      service.listForBusiness("owner", String(clubId), { page: "0" }),
    ).rejects.toThrow();
  });

  it("filters coaches by real distance and matching service budget before pagination", async () => {
    const coaches = db.model(Coach.name, CoachSchema);
    await coaches.createIndexes();
    const near = oid(),
      far = oid(),
      noPoint = oid();
    await coaches.collection.insertMany([
      {
        _id: near,
        userId: oid(),
        slug: "near",
        displayName: "near",
        reviewStatus: "approved",
        visibility: "public",
        location: { type: "Point", coordinates: [51.4, 35.7] },
      },
      {
        _id: far,
        userId: oid(),
        slug: "far",
        displayName: "far",
        reviewStatus: "approved",
        visibility: "public",
        location: { type: "Point", coordinates: [59.6, 36.3] },
      },
      {
        _id: noPoint,
        userId: oid(),
        slug: "unknown",
        displayName: "unknown",
        reviewStatus: "approved",
        visibility: "public",
      },
    ]);
    await db.collection("coach_services").insertMany([
      {
        coachId: near,
        status: "published",
        pricingType: "package",
        sessionCount: 5,
        price: { amount: 150, currency: "IRR" },
      },
      {
        coachId: far,
        status: "published",
        price: { amount: 150, currency: "IRR" },
      },
      {
        coachId: noPoint,
        status: "published",
        price: { amount: 500, currency: "IRR" },
      },
    ]);
    const service = new DiscoveryFeedService(
      {} as never,
      {} as never,
      coaches as never,
      {} as never,
      {} as never,
      {} as never,
      { getReadyByIds: async () => [] } as never,
      {} as never,
      {} as never,
    );
    const nearby = await service.listPublicCoaches({
      latitude: "35.7",
      longitude: "51.4",
      radiusKm: "25",
      minPrice: "100",
      maxPrice: "200",
      limit: "1",
    });
    expect(nearby).toMatchObject({ total: 1, totalPages: 1 });
    expect(nearby.items.map((item) => item.id)).toEqual([String(near)]);
    expect(nearby.items[0]?.catalogPrice).toMatchObject({
      amount: 150,
      unit: "package",
      sessionCount: 5,
    });
    expect((await service.listPublicCoaches({})).total).toBe(3);
    expect(
      (await service.listPublicCoaches({ minPrice: "100", maxPrice: "200" }))
        .total,
    ).toBe(2);
    await expect(
      service.listPublicCoaches({ minPrice: "200", maxPrice: "100" }),
    ).rejects.toThrow();
  });

  it("includes only the signed-in athlete's active course sessions and reads rescheduled times", async () => {
    const classes = db.model(TrainingClass.name, TrainingClassSchema);
    const enrollments = db.model(ClassEnrollment.name, ClassEnrollmentSchema);
    const athleteId = oid(),
      otherId = oid(),
      classId = oid(),
      otherClassId = oid(),
      enrollmentId = oid();
    await classes.collection.insertMany([
      {
        _id: classId,
        title: "my course",
        slug: "my-course",
        status: "in_progress",
      },
      { _id: otherClassId, title: "private other", status: "published" },
    ]);
    await enrollments.collection.insertMany([
      {
        _id: enrollmentId,
        athleteId,
        classId,
        status: "active",
        paymentStatus: "paid",
      },
      {
        athleteId: otherId,
        classId: otherClassId,
        status: "active",
        paymentStatus: "paid",
      },
    ]);
    const startAt = new Date(Date.now() + 3600000),
      endAt = new Date(Date.now() + 7200000),
      sessionId = oid();
    await db.collection("class_sessions").insertMany([
      { _id: sessionId, classId, status: "full", startAt, endAt },
      { classId, status: "cancelled", startAt, endAt },
      { classId: otherClassId, status: "scheduled", startAt, endAt },
      {
        classId,
        status: "scheduled",
        startAt: new Date(0),
        endAt: new Date(1),
      },
    ]);
    const service = new EnrollmentsService(
      enrollments as never,
      classes as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const agenda = await service.agendaForAthlete(String(athleteId));
    expect(agenda.items).toHaveLength(1);
    expect(agenda.items[0]).toMatchObject({
      id: String(sessionId),
      startsAt: startAt.toISOString(),
      href: `/athlete/reservations/${enrollmentId}?source=class`,
    });
    const shifted = new Date(startAt.getTime() + 3600000);
    await db
      .collection("class_sessions")
      .updateOne({ _id: sessionId }, { $set: { startAt: shifted } });
    expect(
      (await service.agendaForAthlete(String(athleteId))).items[0]?.startsAt,
    ).toBe(shifted.toISOString());
    await enrollments.updateOne(
      { _id: enrollmentId },
      { $set: { status: "cancelled" } },
    );
    expect(
      (await service.agendaForAthlete(String(athleteId))).items,
    ).toHaveLength(0);
  });

  it.each([150, 50])(
    "preserves receipts and consumed credits when transferring to a %i contract",
    async (price) => {
      const classes = db.model(
        BusinessTrainingClass.name,
        BusinessTrainingClassSchema,
      );
      const enrollments = db.model(
        BusinessClassEnrollment.name,
        BusinessClassEnrollmentSchema,
      );
      const payments = db.model(
        ClubManualPayment.name,
        ClubManualPaymentSchema,
      );
      const clubId = oid(),
        studentId = oid(),
        sourceClassId = oid(),
        targetClassId = oid();
      await classes.collection.insertMany([
        { _id: sourceClassId, currency: "IRR" },
        { _id: targetClassId, currency: "IRR" },
      ]);
      const sourceId = oid(),
        targetId = oid();
      await enrollments.collection.insertMany([
        {
          _id: sourceId,
          clubId,
          studentId,
          classId: sourceClassId,
          billingMode: "ledger",
          createdBy: oid(),
          status: "active",
          agreedPrice: 100,
          totalSessions: 10,
          remainingSessions: 7,
          openingPaidAmount: 0,
          waivedAmount: 10,
          billingChanges: [],
          paymentStatus: "partial",
        },
        {
          _id: targetId,
          clubId,
          studentId,
          classId: targetClassId,
          billingMode: "ledger",
          createdBy: oid(),
          status: "active",
          agreedPrice: price,
          totalSessions: 12,
          remainingSessions: 12,
          billingChanges: [],
          paymentStatus: "pending",
        },
      ]);
      await payments.collection.insertOne({
        clubId,
        studentId,
        enrollmentId: sourceId,
        amount: 80,
        refundedAmount: 0,
      });
      const service = new ClassBillingService(
        payments as never,
        enrollments as never,
        classes as never,
        {} as never,
        {} as never,
      );
      const source = (await enrollments.findById(sourceId))!;
      const target = (await enrollments.findById(targetId))!;
      await service.transferAccount(source, target, String(oid()));
      expect(target.remainingSessions).toBe(9);
      expect(source.openingPaidAmount).toBe(0);
      const receipts = await payments.find({ enrollmentId: targetId });
      const balance = service.snapshot(target, receipts);
      expect(balance.paidAmount).toBe(80);
      expect(balance.outstandingAmount).toBe(price === 150 ? 60 : 0);
      expect(balance.creditAmount).toBe(price === 50 ? 30 : 0);
      expect(target.waivedAmount).toBe(price === 50 ? 0 : 10);
      expect(await payments.countDocuments({ enrollmentId: sourceId })).toBe(0);
    },
  );
});
