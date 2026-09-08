import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import type { App } from "supertest/types";

import { AppModule } from "../src/app.module";
import { InMemoryRedis } from "../src/infrastructure/redis/in-memory-redis";
import { REDIS_CLIENT } from "../src/infrastructure/redis/redis.types";
import { getConnectionToken } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { TokenService } from "../src/modules/auth/services/token.service";
import { SMS_PROVIDER } from "../src/modules/auth/providers/sms-provider.interface";
import { CapturingSmsProvider } from "./capturing-sms.provider";
import { CommerceService } from "../src/modules/commerce/commerce.service";

describe("App bootstrap and health e2e", () => {
  jest.setTimeout(60_000);

  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let previousMongoUrl: string | undefined;

  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({
      replSet: { count: 1, args: ["--oplogSize", "16"] },
    });
    previousMongoUrl = process.env.MONGODB_URL;
    process.env.MONGODB_URL = mongo.getUri();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SMS_PROVIDER)
      .useValue(new CapturingSmsProvider())
      .overrideProvider(REDIS_CLIENT)
      .useValue(new InMemoryRedis())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    const db = app.get<Connection>(getConnectionToken());
    await Promise.all(Object.values(db.models).map((model) => model.init()));
  });

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();

    if (previousMongoUrl === undefined) {
      delete process.env.MONGODB_URL;
    } else {
      process.env.MONGODB_URL = previousMongoUrl;
    }
  });

  it("boots the complete dependency graph and reports liveness", async () => {
    const response = await request(app.getHttpServer() as App)
      .get("/health/live")
      .expect(200);

    expect(response.body).toMatchObject({
      status: "ok",
    });
    expect(response.body.uptimeSeconds).toEqual(expect.any(Number));
  });

  it("reports MongoDB and Redis readiness", async () => {
    await request(app.getHttpServer() as App)
      .get("/health/ready")
      .expect(200)
      .expect({
        status: "ok",
        mongo: "connected",
        redis: "connected",
        transactions: "ready",
      });
  });

  it("keeps tuition receipts atomic, idempotent and scoped, reconciles legacy balances and preserves paid transfers", async () => {
    const db = app.get<Connection>(getConnectionToken());
    const http = app.getHttpServer() as App;
    const owner = await db
      .model("User")
      .create({ phone: "+989125553100", roles: ["owner"], status: "active" });
    const finance = await db
      .model("User")
      .create({ phone: "+989125553101", roles: ["athlete"], status: "active" });
    const desk = await db
      .model("User")
      .create({ phone: "+989125553102", roles: ["athlete"], status: "active" });
    const auth = (user: any) =>
      `Bearer ${app.get(TokenService).signTokenPair({ id: String(user._id), phone: user.phone, roles: user.roles }).accessToken}`;
    const club = await db.model("Club").create({
      ownerId: owner._id,
      name: "حساب شهریه",
      normalizedName: "tuition",
      slug: "tuition-ledger-test",
    });
    for (const [user, role] of [
      [finance, "finance"],
      [desk, "receptionist"],
    ] as const)
      await db.model("ClubMembership").create({
        clubId: club._id,
        userId: user._id,
        invitedBy: owner._id,
        role,
        status: "accepted",
      });
    const student = await db.model("ClubStudent").create({
      clubId: club._id,
      firstName: "سارا",
      lastName: "مالی",
      phone: "+989125553103",
      status: "active",
    });
    const otherStudent = await db.model("ClubStudent").create({
      clubId: club._id,
      firstName: "علی",
      lastName: "دیگر",
      phone: "+989125553104",
      status: "active",
    });
    const classSeed = {
      clubId: club._id,
      title: "کلاس حساب",
      classModel: "group",
      pricingModel: "package",
      price: 1000,
      currency: "IRR",
      packageSessionCount: 8,
      capacity: 10,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      schedule: [],
      status: "active",
    };
    const training = await db.model("BusinessTrainingClass").create(classSeed);
    const target = await db
      .model("BusinessTrainingClass")
      .create({ ...classSeed, title: "کلاس مقصد حساب" });
    const root = `/api/v1/business/clubs/${club._id}/operations`;
    const enrollmentResponse = await request(http)
      .post(`${root}/classes/${training._id}/enrollments`)
      .set("Authorization", auth(owner))
      .send({
        studentId: String(student._id),
        agreedPrice: 1000,
        paymentStatus: "pending",
        status: "active",
        totalSessions: 8,
      })
      .expect(201);
    const enrollmentId = enrollmentResponse.body.data.id;
    const accounts = () =>
      request(http)
        .get(`${root}/students/${student._id}/accounts`)
        .set("Authorization", auth(finance))
        .expect(200);
    const contract = async (id = enrollmentId) =>
      (await accounts()).body.data.items.find(
        (item: any) => item.enrollmentId === id,
      );
    await request(http)
      .get(`${root}/students/${student._id}/accounts`)
      .set("Authorization", auth(desk))
      .expect(403);
    expect(await contract()).toMatchObject({
      mode: "ledger",
      paidAmount: 0,
      outstandingAmount: 1000,
    });
    const payload = {
      studentId: String(student._id),
      enrollmentId,
      type: "tuition",
      title: "قسط اول",
      amount: 400,
      currency: "IRR",
      paidAt: new Date().toISOString(),
      method: "cash",
      notes: "",
      idempotencyKey: "ledger-first-installment",
    };
    const pay = (body: object, user = finance) =>
      request(http)
        .post(`${root}/payments`)
        .set("Authorization", auth(user))
        .send(body);
    await pay(payload, desk).expect(403);
    const repeated = await Promise.all([
      pay(payload).expect(201),
      pay(payload).expect(201),
    ]);
    expect(repeated[0]!.body.data.id).toBe(repeated[1]!.body.data.id);
    expect(
      await db
        .model("ClubManualPayment")
        .countDocuments({ enrollmentId: new Types.ObjectId(enrollmentId) }),
    ).toBe(1);
    await pay({ ...payload, amount: 401 }).expect(409);
    await pay({
      ...payload,
      amount: 0,
      idempotencyKey: "invalid-zero-receipt",
    }).expect(400);
    await pay({
      ...payload,
      amount: 1.5,
      idempotencyKey: "invalid-fraction-receipt",
    }).expect(400);
    await pay({
      ...payload,
      amount: 601,
      idempotencyKey: "excess-payment-receipt",
    }).expect(409);
    expect(await contract()).toMatchObject({
      paymentStatus: "partial",
      paidAmount: 400,
      outstandingAmount: 600,
    });
    const raced = await Promise.all([
      pay({
        ...payload,
        amount: 600,
        idempotencyKey: "ledger-final-receipt-a",
      }),
      pay({
        ...payload,
        amount: 600,
        idempotencyKey: "ledger-final-receipt-b",
      }),
    ]);
    expect(raced.map((result) => result.status).sort()).toEqual([201, 409]);
    expect(await contract()).toMatchObject({
      paymentStatus: "paid",
      paidAmount: 1000,
      outstandingAmount: 0,
    });
    const lastReceipt = raced.find((result) => result.status === 201)!.body
      .data;
    const voidUrl = `${root}/payments/${lastReceipt.id}/void`;
    await request(http)
      .patch(voidUrl)
      .set("Authorization", auth(finance))
      .send({ reason: "کم" })
      .expect(400);
    for (let i = 0; i < 2; i++)
      await request(http)
        .patch(voidUrl)
        .set("Authorization", auth(finance))
        .send({ reason: "رسید تکراری ثبت شده بود" })
        .expect(200);
    expect(await contract()).toMatchObject({
      paymentStatus: "partial",
      paidAmount: 400,
      outstandingAmount: 600,
    });
    expect(
      (await db.model("ClubManualPayment").findById(lastReceipt.id))!.voidedBy,
    ).toEqual(finance._id);
    const detached = (
      await pay({
        ...payload,
        enrollmentId: null,
        amount: 600,
        idempotencyKey: "ledger-unallocated-receipt",
      }).expect(201)
    ).body.data;
    const allocateUrl = `${root}/payments/${detached.id}/allocate`;
    for (let i = 0; i < 2; i++)
      await request(http)
        .patch(allocateUrl)
        .set("Authorization", auth(finance))
        .send({ enrollmentId, reason: "رسید بابت همین شهریه بوده است" })
        .expect(200);
    expect(
      (await db.model("ClubManualPayment").findById(detached.id))!
        .allocationChanges,
    ).toHaveLength(1);
    expect(await contract()).toMatchObject({
      paidAmount: 1000,
      outstandingAmount: 0,
    });
    await request(http)
      .patch(`${root}/classes/${training._id}/enrollments/${enrollmentId}`)
      .set("Authorization", auth(owner))
      .send({ paymentStatus: "pending" })
      .expect(409);
    await request(http)
      .patch(`${root}/classes/${training._id}/enrollments/${enrollmentId}`)
      .set("Authorization", auth(owner))
      .send({ agreedPrice: 900 })
      .expect(409);
    await db
      .model("BusinessClassEnrollment")
      .updateOne(
        { _id: new Types.ObjectId(enrollmentId) },
        { $set: { remainingSessions: 6 } },
      );
    const moved = await request(http)
      .post(
        `${root}/classes/${training._id}/enrollments/${enrollmentId}/transfer`,
      )
      .set("Authorization", auth(owner))
      .send({ targetClassId: String(target._id) })
      .expect(201);
    expect(moved.body.data).toMatchObject({
      paymentStatus: "paid",
      remainingSessions: 6,
    });
    expect(await contract(moved.body.data.id)).toMatchObject({
      paidAmount: 1000,
      outstandingAmount: 0,
    });
    expect(await contract()).toMatchObject({
      status: "cancelled",
      paidAmount: 0,
      creditAmount: 0,
    });
    expect(
      await db
        .model("ClubManualPayment")
        .countDocuments({ enrollmentId: new Types.ObjectId(enrollmentId) }),
    ).toBe(0);
    const refundUrl = `${root}/payments/${detached.id}/refunds`;
    const refundPayload = {
      amount: 100,
      paidAt: payload.paidAt,
      method: "cash",
      reason: "وجه به شاگرد برگشت داده شد",
      idempotencyKey: "manual-refund-first",
    };
    for (let i = 0; i < 2; i++)
      await request(http)
        .post(refundUrl)
        .set("Authorization", auth(finance))
        .send(refundPayload)
        .expect(201);
    await request(http)
      .post(refundUrl)
      .set("Authorization", auth(finance))
      .send({ ...refundPayload, amount: 101 })
      .expect(409);
    expect(
      (await db.model("ClubManualPayment").findById(detached.id))!.refunds,
    ).toHaveLength(1);
    expect(await contract(moved.body.data.id)).toMatchObject({
      paidAmount: 900,
      outstandingAmount: 100,
    });
    await request(http)
      .patch(`${root}/payments/${detached.id}/void`)
      .set("Authorization", auth(finance))
      .send({ reason: "ابطال رسید پس از برگشت" })
      .expect(409);
    await request(http)
      .patch(`${root}/classes/${target._id}/enrollments/${moved.body.data.id}`)
      .set("Authorization", auth(owner))
      .send({ status: "cancelled" })
      .expect(200);
    expect(await contract(moved.body.data.id)).toMatchObject({
      status: "cancelled",
      outstandingAmount: 0,
      creditAmount: 900,
    });
    const refundRace = await Promise.all(
      ["a", "b"].map((key) =>
        request(http)
          .post(refundUrl)
          .set("Authorization", auth(finance))
          .send({
            ...refundPayload,
            amount: 500,
            idempotencyKey: `manual-refund-race-${key}`,
          }),
      ),
    );
    expect(refundRace.map((result) => result.status).sort()).toEqual([
      201, 409,
    ]);
    expect(await contract(moved.body.data.id)).toMatchObject({
      paidAmount: 400,
      creditAmount: 400,
    });
    await request(http)
      .post(`${root}/payments/${repeated[0]!.body.data.id}/refunds`)
      .set("Authorization", auth(finance))
      .send({
        ...refundPayload,
        amount: 400,
        idempotencyKey: "manual-refund-final",
      })
      .expect(201);
    expect(await contract(moved.body.data.id)).toMatchObject({
      paidAmount: 0,
      creditAmount: 0,
    });
    const old = await db.model("BusinessClassEnrollment").create({
      clubId: club._id,
      classId: training._id,
      studentId: otherStudent._id,
      agreedPrice: 1000,
      paymentStatus: "partial",
      createdBy: owner._id,
    });
    const oldRoot = `${root}/accounts/${old._id}/reconcile`;
    const oldPayment = {
      ...payload,
      studentId: String(otherStudent._id),
      enrollmentId: String(old._id),
      idempotencyKey: "legacy-receipt-test",
    };
    await pay(oldPayment).expect(409);
    await request(http)
      .patch(oldRoot)
      .set("Authorization", auth(finance))
      .send({
        openingPaidAmount: 200,
        waivedAmount: 0,
        expectedRevision: 0,
        reason: "تطبیق با دفتر قبلی باشگاه",
      })
      .expect(200);
    await request(http)
      .patch(oldRoot)
      .set("Authorization", auth(finance))
      .send({
        openingPaidAmount: 200,
        waivedAmount: 0,
        expectedRevision: 0,
        reason: "تطبیق دوباره همان مبلغ",
      })
      .expect(409);
    await pay(oldPayment).expect(201);
    const oldAccount = await request(http)
      .get(`${root}/students/${otherStudent._id}/accounts`)
      .set("Authorization", auth(finance))
      .expect(200);
    expect(oldAccount.body.data.items[0]).toMatchObject({
      paidAmount: 600,
      openingPaidAmount: 200,
      outstandingAmount: 400,
    });
    await pay({
      ...payload,
      enrollmentId: String(old._id),
      idempotencyKey: "wrong-student-receipt",
    }).expect(404);
    await db
      .model("BusinessClassEnrollment")
      .updateOne({ _id: old._id }, { $set: { paymentExpiresAt: new Date() } });
    await pay({
      ...oldPayment,
      idempotencyKey: "online-manual-duplicate",
    }).expect(409);
    const summary = await request(http)
      .get(`${root}/summary`)
      .set("Authorization", auth(owner))
      .expect(200);
    expect(summary.body.data.stats.monthlyRevenue).toBe(400);
    const otherClub = await db.model("Club").create({
      ownerId: new Types.ObjectId(),
      name: "باشگاه دیگر مالی",
      normalizedName: "other-ledger",
      slug: "other-ledger-test",
    });
    await request(http)
      .get(
        `/api/v1/business/clubs/${otherClub._id}/operations/students/${student._id}/accounts`,
      )
      .set("Authorization", auth(finance))
      .expect(403);
  });

  it("finds real memberships by Persian phone and checks in a reservation without consuming credit twice", async () => {
    const db = app.get<Connection>(getConnectionToken());
    const http = app.getHttpServer() as App;
    const makeUser = (phone: string, roles: string[]) =>
      db.model("User").create({ phone, roles, status: "active" });
    const owner = await makeUser("+989125551100", ["owner"]);
    const athlete = await makeUser("+989125551101", ["athlete"]);
    const staff = await makeUser("+989125551102", ["athlete"]);
    const finance = await makeUser("+989125551103", ["athlete"]);
    const unrelated = await makeUser("+989125551104", ["athlete"]);
    const auth = (user: any) =>
      `Bearer ${app.get(TokenService).signTokenPair({ id: String(user._id), phone: user.phone, roles: user.roles }).accessToken}`;
    const club = await db.model("Club").create({
      ownerId: owner._id,
      name: "پذیرش واقعی",
      normalizedName: "reception",
      slug: "reception-test",
    });
    for (const [user, role] of [
      [staff, "receptionist"],
      [finance, "finance"],
    ] as const)
      await db.model("ClubMembership").create({
        clubId: club._id,
        userId: user._id,
        invitedBy: owner._id,
        role,
        status: "accepted",
        permissions: [],
      });
    const contract = await db.model("UserEntitlement").create({
      productId: new Types.ObjectId(),
      purchaseId: new Types.ObjectId(),
      clubId: club._id,
      userId: athlete._id,
      title: "قرارداد واقعی دو جلسه",
      type: "session_pack",
      remainingSessions: 1,
      startsAt: new Date(Date.now() - 86400000),
      endsAt: new Date(Date.now() + 86400000),
      status: "active",
    });
    const startsAt = new Date(Date.now() + 10 * 60000),
      endsAt = new Date(Date.now() + 70 * 60000);
    const policy = {
      title: "لغو",
      tiers: [{ hoursBefore: 0, refundPercent: 100 }],
    };
    const session = await db.model("ReservableSession").create({
      clubId: club._id,
      title: "سانس گروهی",
      startsAt,
      endsAt,
      capacity: 2,
      reservedCount: 2,
      basePrice: 0,
      cancellationPolicy: policy,
    });
    const reservation = await db.model("Reservation").create({
      clubId: club._id,
      sessionId: session._id,
      userId: athlete._id,
      sessionType: "court",
      sessionTitle: session.title,
      sessionStartsAt: startsAt,
      sessionEndsAt: endsAt,
      participantCount: 2,
      totalPrice: 0,
      paymentStatus: "not_required",
      cancellationPolicy: policy,
      entitlementId: contract._id,
    });
    const prefix = `/api/v1/business/clubs/${club._id}`;
    const lookup = `${prefix}/operations/reception`;
    for (const user of [athlete, finance])
      await request(http)
        .get(lookup)
        .query({ phone: athlete.phone })
        .set("Authorization", auth(user))
        .expect(403);
    const result = await request(http)
      .get(lookup)
      .query({ phone: "۰۹۱۲۵۵۵۱۱۰۱" })
      .set("Authorization", auth(staff))
      .expect(200);
    expect(result.body.data).toMatchObject({
      found: true,
      memberships: [{ id: String(contract._id), remainingSessions: 1 }],
      reservations: [{ id: String(reservation._id), checkedInParticipants: 0 }],
    });
    const missing = await request(http)
      .get(lookup)
      .query({ phone: unrelated.phone })
      .set("Authorization", auth(staff))
      .expect(200);
    expect(missing.body.data).toMatchObject({ found: false, person: null });
    const route = `${prefix}/reservations/${reservation._id}/check-in`;
    await request(http)
      .patch(route)
      .set("Authorization", auth(finance))
      .send({ participantCount: 2, expectedParticipantCount: 0 })
      .expect(403);
    const results = await Promise.all(
      [1, 2].map(() =>
        request(http)
          .patch(route)
          .set("Authorization", auth(staff))
          .send({ participantCount: 2, expectedParticipantCount: 0 }),
      ),
    );
    expect(results.map((result) => result.status)).toEqual([200, 200]);
    expect(
      (await db.model("Reservation").findById(reservation._id))!.checkInChanges,
    ).toHaveLength(1);
    expect(
      (await db.model("UserEntitlement").findById(contract._id))!
        .remainingSessions,
    ).toBe(1);
    await request(http)
      .patch(`/api/v1/reservations/${reservation._id}/cancel`)
      .set("Authorization", auth(athlete))
      .expect(409);
    await request(http)
      .patch(route)
      .set("Authorization", auth(staff))
      .send({
        participantCount: 1,
        expectedParticipantCount: 0,
        reason: "اصلاح تعداد",
      })
      .expect(409);
    await request(http)
      .patch(route)
      .set("Authorization", auth(staff))
      .send({ participantCount: 3, expectedParticipantCount: 2 })
      .expect(400);
    await request(http)
      .patch(route)
      .set("Authorization", auth(staff))
      .send({ participantCount: 0, expectedParticipantCount: 2 })
      .expect(400);
    await request(http)
      .patch(route)
      .set("Authorization", auth(staff))
      .send({
        participantCount: 0,
        expectedParticipantCount: 2,
        reason: "ورود اشتباه ثبت شده بود",
      })
      .expect(200);
    const corrected = (await db
      .model("Reservation")
      .findById(reservation._id))!;
    expect(corrected.checkInChanges).toHaveLength(2);
    expect(corrected.checkedInAt).toBeNull();
    await db
      .model("Reservation")
      .updateOne(
        { _id: reservation._id },
        { $set: { sessionStartsAt: new Date(Date.now() + 2 * 3600000) } },
      );
    await request(http)
      .patch(route)
      .set("Authorization", auth(staff))
      .send({ participantCount: 1, expectedParticipantCount: 0 })
      .expect(409);
    await db
      .model("Reservation")
      .updateOne(
        { _id: reservation._id },
        { $set: { sessionStartsAt: startsAt, paymentStatus: "pending" } },
      );
    await request(http)
      .patch(route)
      .set("Authorization", auth(staff))
      .send({ participantCount: 1, expectedParticipantCount: 0 })
      .expect(409);
  });

  it("enforces staff roles and club boundaries through HTTP, then revokes existing tokens immediately", async () => {
    const db = app.get<Connection>(getConnectionToken());
    const http = app.getHttpServer() as App;
    const owner = await db
      .model("User")
      .create({ phone: "+989124440000", roles: ["owner"], status: "active" });
    const token = (user: any) =>
      app.get(TokenService).signTokenPair({
        id: String(user._id),
        phone: user.phone,
        roles: user.roles,
      }).accessToken;
    const ownerToken = token(owner);
    const club = await db.model("Club").create({
      ownerId: owner._id,
      name: "باشگاه تیم",
      normalizedName: "staff",
      slug: "staff-permissions",
    });
    const foreign = await db.model("Club").create({
      ownerId: new Types.ObjectId(),
      name: "باشگاه دیگر",
      normalizedName: "other",
      slug: "staff-foreign",
    });
    const paths = {
      students: "operations/students",
      payments: "operations/payments",
      classes: "operations/classes",
      attendance: "operations/attendance",
      memberships: "benefit-products",
      branches: "operations/branches",
    };
    const allowed: Record<string, string[]> = {
      manager: Object.keys(paths),
      receptionist: ["students", "classes", "attendance", "memberships"],
      finance: ["students", "payments", "memberships"],
      coach: ["classes", "attendance"],
    };
    for (const [index, role] of [
      "manager",
      "receptionist",
      "finance",
      "coach",
    ].entries()) {
      const staff = await db.model("User").create({
        phone: `+98912444000${index + 1}`,
        roles: ["athlete"],
        status: "active",
      });
      const staffToken = token(staff);
      await request(http)
        .get("/api/v1/business/me")
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(403);
      const invitation = await request(http)
        .post(`/api/v1/business/clubs/${club._id}/memberships`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ phone: staff.phone, role, permissions: [] })
        .expect(201);
      const id = invitation.body.data.id;
      await request(http)
        .get("/api/v1/business/me")
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(403);
      await request(http)
        .get(`/api/v1/club-memberships/${id}`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .expect(404);
      const preview = await request(http)
        .get(`/api/v1/club-memberships/${id}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(200);
      expect(preview.body.data.clubName).toBe("باشگاه تیم");
      await request(http)
        .patch(`/api/v1/club-memberships/${id}/accept`)
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(200);
      const me = await request(http)
        .get("/api/v1/business/me")
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(200);
      expect(me.body.data.roles).toEqual(["athlete"]);
      const list = await request(http)
        .get("/api/v1/business/clubs")
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(200);
      expect(list.body.data.items.map((item: any) => item.id)).toEqual([
        String(club._id),
      ]);
      for (const [kind, path] of Object.entries(paths)) {
        await request(http)
          .get(`/api/v1/business/clubs/${club._id}/${path}`)
          .set("Authorization", `Bearer ${staffToken}`)
          .expect(allowed[role]!.includes(kind) ? 200 : 403);
        await request(http)
          .get(`/api/v1/business/clubs/${foreign._id}/${path}`)
          .set("Authorization", `Bearer ${staffToken}`)
          .expect(403);
      }
      await request(http)
        .post(`/api/v1/business/clubs/${club._id}/memberships`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ userId: String(owner._id), role: "manager", permissions: [] })
        .expect(403);
      const student = await db.model("ClubStudent").create({
        clubId: club._id,
        firstName: "شاگرد",
        lastName: "آزمایشی",
        phone: `0912333100${index}`,
      });
      if (role === "receptionist") {
        const training = await db.model("BusinessTrainingClass").create({
          clubId: club._id,
          title: "کلاس پذیرش",
          classModel: "group",
          pricingModel: "package",
          price: 1000,
          packageSessionCount: 8,
          capacity: 10,
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          schedule: [],
        });
        const route = `/api/v1/business/clubs/${club._id}/operations/classes/${training._id}/enrollments`;
        const body = {
          studentId: String(student._id),
          agreedPrice: 1000,
          paymentStatus: "pending",
          status: "active",
        };
        await request(http)
          .post(route)
          .set("Authorization", `Bearer ${staffToken}`)
          .send({ ...body, agreedPrice: 0, paymentStatus: "waived" })
          .expect(403);
        const enrollment = await request(http)
          .post(route)
          .set("Authorization", `Bearer ${staffToken}`)
          .send(body)
          .expect(201);
        expect(enrollment.body.data.agreedPrice).toBeNull();
        const roster = await request(http)
          .get(route)
          .set("Authorization", `Bearer ${staffToken}`)
          .expect(200);
        expect(roster.body.data.items[0].agreedPrice).toBeNull();
        expect(roster.body.data.items[0].paymentStatus).toBe("pending");
        await request(http)
          .patch(`${route}/${enrollment.body.data.id}`)
          .set("Authorization", `Bearer ${staffToken}`)
          .send({ paymentStatus: "paid" })
          .expect(403);
        await request(http)
          .patch(`${route}/${enrollment.body.data.id}`)
          .set("Authorization", `Bearer ${staffToken}`)
          .send({ remainingSessions: 100 })
          .expect(403);
        const session = await db.model("BusinessClassSession").create({
          clubId: club._id,
          classId: training._id,
          startsAt: new Date(Date.now() - 3600000),
          endsAt: new Date(),
          capacity: 10,
        });
        for (const status of ["present", "present", "absent"])
          await request(http)
            .put(
              `/api/v1/business/clubs/${club._id}/operations/classes/${training._id}/sessions/${session._id}/attendance`,
            )
            .set("Authorization", `Bearer ${staffToken}`)
            .send({
              items: [{ studentId: String(student._id), status, notes: "" }],
            })
            .expect(200);
        expect(
          (await db
            .model("BusinessClassEnrollment")
            .findById(enrollment.body.data.id))!.remainingSessions,
        ).toBe(8);
        expect(
          String(
            (await db
              .model("BusinessClassAttendance")
              .findOne({ sessionId: session._id }))!.recordedBy,
          ),
        ).toBe(String(staff._id));
      }
      const payment = await request(http)
        .post(`/api/v1/business/clubs/${club._id}/operations/payments`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          studentId: String(student._id),
          type: "tuition",
          title: "شهریه تست",
          idempotencyKey: `staff-receipt-${role}`,
          amount: 1000,
          paidAt: new Date().toISOString(),
        })
        .expect(["manager", "finance"].includes(role) ? 201 : 403);
      if (payment.status === 201)
        expect(
          String(
            (await db
              .model("ClubManualPayment")
              .findById(payment.body.data.id))!.recordedBy,
          ),
        ).toBe(String(staff._id));
      await request(http)
        .patch(`/api/v1/business/clubs/${club._id}/memberships/${id}/revoke`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .expect(200);
      await request(http)
        .patch(`/api/v1/business/clubs/${club._id}/memberships/${id}/revoke`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .expect(200);
      await request(http)
        .get("/api/v1/business/me")
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(403);
      await request(http)
        .get(`/api/v1/business/clubs/${club._id}/operations/classes`)
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(403);
      await request(http)
        .patch(`/api/v1/club-memberships/${id}/accept`)
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(404);
      const stored = await db.model("ClubMembership").findById(id);
      expect(stored!.changes.map((item: any) => item.action)).toEqual([
        "invite",
        "accept",
        "revoke",
      ]);
    }
    await request(http)
      .post(`/api/v1/business/clubs/${club._id}/memberships`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ userId: String(owner._id), role: "manager", permissions: [] })
      .expect(409);
  });

  it("restricts notification delivery reports and retries to administrators", async () => {
    const db = app.get<Connection>(getConnectionToken());
    const http = app.getHttpServer() as App;
    const tokens: Record<string, string> = {};
    for (const [index, role] of ["athlete", "owner", "admin"].entries()) {
      const user = await db.model("User").create({
        phone: `0912333000${index}`,
        roles: [role],
        status: "active",
      });
      tokens[role] = app.get(TokenService).signTokenPair({
        id: String(user._id),
        phone: user.phone,
        roles: user.roles,
      }).accessToken;
    }
    const item = await db.model("Notification").create({
      userId: new Types.ObjectId(),
      type: "booking_confirmed",
      title: "تست",
      body: "پیام خصوصی",
      smsDelivery: { state: "failed", attempts: 8 },
    });
    await request(http)
      .get("/api/v1/notifications/delivery-report")
      .expect(401);
    for (const role of ["athlete", "owner"]) {
      await request(http)
        .get("/api/v1/notifications/delivery-report")
        .auth(tokens[role]!, { type: "bearer" })
        .expect(403);
      await request(http)
        .post(`/api/v1/notifications/${item._id}/retry`)
        .auth(tokens[role]!, { type: "bearer" })
        .expect(403);
    }
    const report = await request(http)
      .get("/api/v1/notifications/delivery-report")
      .auth(tokens.admin!, { type: "bearer" })
      .expect(200);
    expect(report.body.data.failed).toHaveLength(1);
    expect(JSON.stringify(report.body)).not.toContain("پیام خصوصی");
    await request(http)
      .post(`/api/v1/notifications/${item._id}/retry`)
      .auth(tokens.admin!, { type: "bearer" })
      .expect(201);
    expect(
      (await db.model("Notification").findById(item._id)).smsDelivery.state,
    ).toBe("pending");
  });

  it("reschedules a paid reservation atomically, preserves it on payment failure, and makes concurrent retries harmless", async () => {
    const db = app.get<Connection>(getConnectionToken());
    const http = app.getHttpServer() as App;
    const owner = await db
      .model("User")
      .create({ phone: "09124440001", roles: ["owner"], status: "active" });
    const athlete = await db
      .model("User")
      .create({ phone: "09124440002", roles: ["athlete"], status: "active" });
    const token = app.get(TokenService).signTokenPair({
      id: String(athlete._id),
      phone: athlete.phone,
      roles: athlete.roles,
    }).accessToken;
    const club = await db.model("Club").create({
      ownerId: owner._id,
      name: "باشگاه تغییر زمان",
      normalizedName: "exchange",
      slug: "reschedule-club",
      reviewStatus: "approved",
      visibility: "public",
      operationalStatus: "active",
    });
    const slots = [];
    for (const [index, price] of [100000, 120000].entries())
      slots.push(
        await db.model("ReservableSession").create({
          clubId: club._id,
          title: `سانس ${index}`,
          startsAt: new Date(Date.now() + (2 + index) * 86400000),
          endsAt: new Date(Date.now() + (2 + index) * 86400000 + 3600000),
          capacity: 1,
          basePrice: price,
          status: "active",
          cancellationPolicy: {
            title: "لغو کامل",
            tiers: [{ hoursBefore: 0, refundPercent: 100 }],
          },
        }),
      );
    const created = await request(http)
      .post("/api/v1/reservations")
      .auth(token, { type: "bearer" })
      .send({ sessionId: String(slots[0]!._id), participantCount: 1 })
      .expect(201);
    const id = created.body.data.id;
    await request(http)
      .patch(`/api/v1/reservations/${id}/mock-payment/approve`)
      .auth(token, { type: "bearer" })
      .expect(200);
    const selection = { sessionId: String(slots[1]!._id), options: [] };
    const quote = await request(http)
      .post(`/api/v1/reservations/${id}/reschedule/quote`)
      .auth(token, { type: "bearer" })
      .send(selection)
      .expect(201);
    expect(quote.body.data).toMatchObject({
      newAmount: 120000,
      refundAmount: 100000,
      difference: 20000,
    });
    const payload = {
      ...selection,
      expectedTotalPrice: 120000,
      expectedRefundAmount: 100000,
      expectedRefundPercent: 100,
      idempotencyKey: "reschedule-acceptance",
      mockResult: "paid",
    };
    await request(http)
      .post(`/api/v1/reservations/${id}/reschedule`)
      .auth(token, { type: "bearer" })
      .send({ ...payload, expectedTotalPrice: 1 })
      .expect(409);
    await request(http)
      .post(`/api/v1/reservations/${id}/reschedule`)
      .auth(token, { type: "bearer" })
      .send({ ...payload, mockResult: "failed" })
      .expect(409);
    expect(
      await db.model("Reservation").countDocuments({ userId: athlete._id }),
    ).toBe(1);
    expect((await db.model("Reservation").findById(id)).status).toBe(
      "reserved",
    );
    expect(
      (
        await db
          .model("PaymentIntent")
          .findOne({ referenceId: new Types.ObjectId(id) })
      ).status,
    ).toBe("paid");
    expect(
      (await db.model("ReservableSession").findById(slots[1]!._id))
        .reservedCount,
    ).toBe(0);
    const attempts = await Promise.all(
      [0, 1].map(() =>
        request(http)
          .post(`/api/v1/reservations/${id}/reschedule`)
          .auth(token, { type: "bearer" })
          .send(payload)
          .expect(201),
      ),
    );
    const nextId = attempts[0]!.body.data.id;
    expect(attempts[1]!.body.data.id).toBe(nextId);
    expect(attempts[0]!.body.data).toMatchObject({
      paymentStatus: "paid",
      rescheduledFromId: id,
    });
    expect(
      (await db.model("Reservation").findById(id)).rescheduledToId.toString(),
    ).toBe(nextId);
    expect(
      (await db.model("ReservableSession").findById(slots[0]!._id))
        .reservedCount,
    ).toBe(0);
    expect(
      (await db.model("ReservableSession").findById(slots[1]!._id))
        .reservedCount,
    ).toBe(1);
    expect(
      await db.model("PaymentIntent").countDocuments({ userId: athlete._id }),
    ).toBe(2);
    await request(http)
      .patch(`/api/v1/reservations/${nextId}/cancel`)
      .auth(token, { type: "bearer" })
      .expect(200);
    expect(
      (await db.model("ReservableSession").findById(slots[0]!._id))
        .reservedCount,
    ).toBe(0);
    expect(
      (await db.model("ReservableSession").findById(slots[1]!._id))
        .reservedCount,
    ).toBe(0);
    expect(
      (await db.model("SettlementAccount").findOne({ providerId: club._id }))
        .availableAmount,
    ).toBe(0);
  });

  it.each(["membership", "trial"] as const)(
    "moves a %s reservation without consuming extra eligibility and rejects full replacement capacity",
    async (kind) => {
      const db = app.get<Connection>(getConnectionToken());
      const http = app.getHttpServer() as App;
      const user = await db.model("User").create({
        phone: kind === "membership" ? "09125550001" : "09125550002",
        roles: ["athlete"],
        status: "active",
      });
      const token = app.get(TokenService).signTokenPair({
        id: String(user._id),
        phone: user.phone,
        roles: user.roles,
      }).accessToken;
      const club = await db.model("Club").create({
        ownerId: new Types.ObjectId(),
        name: `باشگاه ${kind}`,
        normalizedName: kind,
        slug: `credit-exchange-${kind}`,
        reviewStatus: "approved",
        visibility: "public",
        operationalStatus: "active",
        trialBookingEnabled: true,
      });
      const sessions = [];
      for (let day = 2; day < 4; day++)
        sessions.push(
          await db.model("ReservableSession").create({
            clubId: club._id,
            title: `سانس ${day}`,
            startsAt: new Date(Date.now() + day * 86400000),
            endsAt: new Date(Date.now() + day * 86400000 + 3600000),
            capacity: 1,
            basePrice: 100000,
            status: "active",
            cancellationPolicy: {
              title: "لغو کامل",
              tiers: [{ hoursBefore: 0, refundPercent: 100 }],
            },
          }),
        );
      const entitlement =
        kind === "membership"
          ? await db.model("UserEntitlement").create({
              userId: user._id,
              clubId: club._id,
              productId: new Types.ObjectId(),
              purchaseId: new Types.ObjectId(),
              title: "اعتبار یک جلسه",
              type: "session_pack",
              remainingSessions: 1,
              sessionTypes: ["coached_session"],
              startsAt: new Date(),
              endsAt: new Date(Date.now() + 30 * 86400000),
              status: "active",
            })
          : null;
      const booked = await request(http)
        .post("/api/v1/reservations")
        .auth(token, { type: "bearer" })
        .send({
          sessionId: String(sessions[0]!._id),
          participantCount: 1,
          ...(entitlement
            ? { entitlementId: String(entitlement._id) }
            : { isTrial: true }),
        })
        .expect(201);
      const id = booked.body.data.id;
      const selection = { sessionId: String(sessions[1]!._id), options: [] };
      await request(http)
        .post(`/api/v1/reservations/${id}/reschedule/quote`)
        .auth(token, { type: "bearer" })
        .send(selection)
        .expect(201);
      const input = {
        ...selection,
        expectedTotalPrice: 0,
        expectedRefundAmount: 0,
        expectedRefundPercent: 100,
        idempotencyKey: `exchange-${kind}`,
        mockResult: "paid",
      };
      await db
        .model("ReservableSession")
        .updateOne({ _id: sessions[1]!._id }, { $set: { reservedCount: 1 } });
      await request(http)
        .post(`/api/v1/reservations/${id}/reschedule`)
        .auth(token, { type: "bearer" })
        .send(input)
        .expect(409);
      await db
        .model("ReservableSession")
        .updateOne({ _id: sessions[1]!._id }, { $set: { reservedCount: 0 } });
      await request(http)
        .post(`/api/v1/reservations/${id}/reschedule`)
        .auth(token, { type: "bearer" })
        .send({ ...input, mockResult: "failed" })
        .expect(409);
      expect((await db.model("Reservation").findById(id)).status).toBe(
        "reserved",
      );
      const moved = await request(http)
        .post(`/api/v1/reservations/${id}/reschedule`)
        .auth(token, { type: "bearer" })
        .send(input)
        .expect(201);
      expect(moved.body.data).toMatchObject({
        paymentStatus: "not_required",
        rescheduledFromId: id,
      });
      if (entitlement) {
        expect(
          (await db.model("UserEntitlement").findById(entitlement._id))
            .remainingSessions,
        ).toBe(0);
        expect(
          await db.model("EntitlementUsage").countDocuments({
            entitlementId: entitlement._id,
            status: "consumed",
          }),
        ).toBe(1);
        expect(
          await db.model("EntitlementUsage").countDocuments({
            entitlementId: entitlement._id,
            status: "released",
          }),
        ).toBe(1);
      }
      expect(
        await db
          .model("Reservation")
          .countDocuments({ userId: user._id, status: "reserved" }),
      ).toBe(1);
      expect(
        await db.model("PaymentIntent").countDocuments({ userId: user._id }),
      ).toBe(0);
    },
  );

  it("uses real authentication, models and controllers from public slots through paid cancellation", async () => {
    const db = app.get<Connection>(getConnectionToken());
    const owner = await db
      .model("User")
      .create({ phone: "09121110001", roles: ["owner"], status: "active" });
    const athlete = await db
      .model("User")
      .create({ phone: "09121110002", roles: ["athlete"], status: "active" });
    const other = await db
      .model("User")
      .create({ phone: "09121110003", roles: ["athlete"], status: "active" });
    const token = (user: typeof athlete) =>
      app.get(TokenService).signTokenPair({
        id: String(user._id),
        phone: user.phone,
        roles: user.roles,
      }).accessToken;
    const club = await db.model("Club").create({
      ownerId: owner._id,
      name: "باشگاه تست پذیرش",
      normalizedName: "test",
      slug: "acceptance-club",
      reviewStatus: "approved",
      visibility: "public",
      operationalStatus: "active",
    });
    const slot = await db.model("ReservableSession").create({
      clubId: club._id,
      title: "سانس پذیرش",
      startsAt: new Date(Date.now() + 86400000),
      endsAt: new Date(Date.now() + 90000000),
      capacity: 2,
      basePrice: 100000,
      status: "active",
      cancellationPolicy: {
        title: "لغو کامل",
        tiers: [{ hoursBefore: 0, refundPercent: 100 }],
      },
    });
    const http = app.getHttpServer() as App;
    const list = await request(http)
      .get(`/api/v1/public/clubs/${club._id}/reservable-sessions`)
      .expect(200);
    expect(list.body.data.items).toHaveLength(1);
    await request(http)
      .post("/api/v1/reservations")
      .send({ sessionId: String(slot._id), participantCount: 1 })
      .expect(401);
    const payload = {
      sessionId: String(slot._id),
      participantCount: 1,
      expectedTotalPrice: 100000,
      expectedCurrency: "IRR",
    };
    const quote = await request(http)
      .post("/api/v1/reservations/quote")
      .auth(token(athlete), { type: "bearer" })
      .send(payload)
      .expect(201);
    expect(quote.body.data.totalPrice).toBe(100000);
    const booked = await request(http)
      .post("/api/v1/reservations")
      .auth(token(athlete), { type: "bearer" })
      .send(payload)
      .expect(201);
    const id = booked.body.data.id;
    await request(http)
      .patch(`/api/v1/reservations/${id}/cancel`)
      .auth(token(other), { type: "bearer" })
      .expect(404);
    await db
      .model("WalletAccount")
      .create({ userId: athlete._id, availableAmount: 20000 });
    const campaign = await db.model("DiscountCampaign").create({
      code: "ACCEPT10",
      title: "تخفیف پذیرش",
      kind: "percent",
      value: 10,
      budgetRemaining: 100000,
      startsAt: new Date(Date.now() - 1000),
      endsAt: new Date(Date.now() + 86400000),
    });
    const paymentInput = {
      referenceType: "reservation",
      referenceId: id,
      idempotencyKey: `acceptance-${id}`,
      returnUrl: "https://example.test/receipt",
      couponCode: "ACCEPT10",
      walletAmount: 20000,
      expectedAmount: 70000,
    };
    const paymentQuote = await request(http)
      .post("/api/v1/payments/quote")
      .auth(token(athlete), { type: "bearer" })
      .send({
        referenceType: "reservation",
        referenceId: id,
        couponCode: "ACCEPT10",
        walletAmount: 20000,
      })
      .expect(201);
    expect(paymentQuote.body.data).toMatchObject({
      grossAmount: 100000,
      discountAmount: 10000,
      walletAmount: 20000,
      amount: 70000,
    });
    await request(http)
      .post("/api/v1/payments/intents")
      .auth(token(athlete), { type: "bearer" })
      .send({ ...paymentInput, expectedAmount: 69999 })
      .expect(409);
    expect(
      (await db.model("WalletAccount").findOne({ userId: athlete._id }))
        .availableAmount,
    ).toBe(20000);
    expect(
      (await db.model("DiscountCampaign").findById(campaign._id))
        .budgetRemaining,
    ).toBe(100000);
    const intent = await request(http)
      .post("/api/v1/payments/intents")
      .auth(token(athlete), { type: "bearer" })
      .send(paymentInput)
      .expect(201);
    const intentId = intent.body.data.id;
    await request(http)
      .post(`/api/v1/payments/intents/${intentId}/mock/decision`)
      .auth(token(other), { type: "bearer" })
      .send({ status: "paid" })
      .expect(404);
    await request(http)
      .post(`/api/v1/payments/intents/${intentId}/mock/decision`)
      .auth(token(athlete), { type: "bearer" })
      .send({ status: "paid" })
      .expect(201);
    const mine = await request(http)
      .get("/api/v1/reservations")
      .auth(token(athlete), { type: "bearer" })
      .expect(200);
    expect(mine.body.data.items[0]).toMatchObject({
      id,
      paymentStatus: "paid",
    });
    await request(http)
      .patch(`/api/v1/reservations/${id}/cancel`)
      .auth(token(athlete), { type: "bearer" })
      .expect(200);
    expect((await db.model("PaymentIntent").findById(intentId)).status).toBe(
      "refunded",
    );
    expect(
      (await db.model("WalletAccount").findOne({ userId: athlete._id }))
        .availableAmount,
    ).toBe(20000);
    expect(
      (await db.model("ReservableSession").findById(slot._id)).reservedCount,
    ).toBe(0);
    expect(
      (await db.model("SettlementAccount").findOne({ providerId: club._id }))
        .availableAmount,
    ).toBe(0);
    const entries = await db
      .model("LedgerEntry")
      .find({ sourceId: new Types.ObjectId(intentId) });
    expect(
      entries.reduce(
        (sum, row) =>
          sum + (row.direction === "debit" ? row.amount : -row.amount),
        0,
      ),
    ).toBe(0);
  });
  it("holds the last business class seat, refunds cancellation and expires abandoned re-enrollment", async () => {
    const db = app.get<Connection>(getConnectionToken());
    const athlete = await db
      .model("User")
      .create({ phone: "09121110004", roles: ["athlete"], status: "active" });
    const other = await db
      .model("User")
      .create({ phone: "09121110005", roles: ["athlete"], status: "active" });
    const club = await db.model("Club").findOne({ slug: "acceptance-club" });
    const trainingClass = await db.model("BusinessTrainingClass").create({
      clubId: club._id,
      title: "کلاس ظرفیت یک",
      classModel: "group",
      pricingModel: "course",
      price: 100000,
      capacity: 1,
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 864000000),
      schedule: [{ dayOfWeek: 1, startTime: "10:00", durationMinutes: 60 }],
      status: "active",
      visibility: "public",
    });
    const token = (user: typeof athlete) =>
      app.get(TokenService).signTokenPair({
        id: String(user._id),
        phone: user.phone,
        roles: user.roles,
      }).accessToken;
    const http = app.getHttpServer() as App;
    const enroll = () =>
      request(http)
        .post(`/api/v1/athlete/club-classes/${trainingClass._id}/enroll`)
        .auth(token(athlete), { type: "bearer" });
    const pending = await enroll().expect(201);
    const id = pending.body.data.id;
    expect(pending.body.data.paymentExpiresAt).toEqual(expect.any(String));
    await request(http)
      .post(`/api/v1/athlete/club-classes/${trainingClass._id}/enroll`)
      .auth(token(other), { type: "bearer" })
      .expect(400);
    const commerce = app.get(CommerceService);
    const intent = await commerce.createIntent(String(athlete._id), {
      referenceType: "business_class_enrollment",
      referenceId: id,
      idempotencyKey: `class-${id}`,
      returnUrl: "https://example.test/classes",
      walletAmount: 0,
    });
    await request(http)
      .post(`/api/v1/payments/intents/${intent.id}/mock/decision`)
      .auth(token(athlete), { type: "bearer" })
      .send({ status: "paid" })
      .expect(201);
    const cancel = () =>
      request(http)
        .post(`/api/v1/athlete/club-classes/enrollments/${id}/cancel`)
        .auth(token(athlete), { type: "bearer" });
    await cancel().expect(201);
    await cancel().expect(201);
    expect((await db.model("PaymentIntent").findById(intent.id)).status).toBe(
      "refunded",
    );
    expect(
      (await db.model("BusinessTrainingClass").findById(trainingClass._id))
        .activeEnrollmentCount,
    ).toBe(0);
    await enroll().expect(201);
    await db
      .model("BusinessClassEnrollment")
      .updateOne(
        { _id: id },
        { $set: { paymentExpiresAt: new Date(Date.now() - 1000) } },
      );
    expect((await commerce.expirePendingPayments()).errors).toEqual([]);
    expect((await commerce.expirePendingPayments()).errors).toEqual([]);
    expect(
      (await db.model("BusinessTrainingClass").findById(trainingClass._id))
        .pendingEnrollmentCount,
    ).toBe(0);
    expect(
      (await db.model("BusinessClassEnrollment").findById(id)).paymentStatus,
    ).toBe("failed");
    expect(
      (await db.model("SettlementAccount").findOne({ providerId: club._id }))
        .availableAmount,
    ).toBe(0);
  });
  it.each(["booking", "course", "membership"] as const)(
    "purchases %s through real authenticated HTTP and shared commerce",
    async (kind) => {
      const db = app.get<Connection>(getConnectionToken());
      const index = ["booking", "course", "membership"].indexOf(kind);
      const user = await db.model("User").create({
        phone: `0912111100${index}`,
        roles: ["athlete"],
        status: "active",
      });
      const token = app.get(TokenService).signTokenPair({
        id: String(user._id),
        phone: user.phone,
        roles: user.roles,
      }).accessToken;
      const http = app.getHttpServer() as App;
      const post = (path: string, body: unknown = {}) =>
        request(http)
          .post(path)
          .auth(token, { type: "bearer" })
          .send(body as object);
      let referenceType:
        "coach_booking" | "coach_class_enrollment" | "benefit_purchase";
      let purchasePath: string;
      if (kind === "membership") {
        const membershipClub = await db
          .model("Club")
          .findOne({ slug: "acceptance-club" });
        const product = await db.model("BenefitProduct").create({
          clubId: membershipClub._id,
          title: "بسته پذیرش",
          type: "session_pack",
          price: 100000,
          sessionCount: 5,
          validityDays: 30,
          sessionTypes: ["court"],
        });
        referenceType = "benefit_purchase";
        purchasePath = `/api/v1/benefit-purchases/${product._id}`;
      } else {
        const coach = await db.model("Coach").create({
          userId: new Types.ObjectId(),
          slug: `acceptance-${kind}`,
          reviewStatus: "approved",
          visibility: "public",
        });
        const common = {
          ownerCoachId: coach._id,
          title: "آزمون مربی",
          sportId: new Types.ObjectId(),
          deliveryMode: "online",
          capacity: 1,
        };
        if (kind === "booking") {
          const offering = await db.model("CoachOffering").create({
            coachId: coach._id,
            sportId: common.sportId,
            title: common.title,
            normalizedTitle: "test",
            type: "private",
            deliveryModes: ["online"],
            durationMinutes: 60,
            capacity: 1,
            price: { amount: 100000, currency: "IRR" },
            pricingType: "per_session",
            status: "published",
            cancellationPolicy: {
              tiers: [{ hoursBefore: 0, refundPercent: 100 }],
            },
          });
          const session = await db.model("TrainingSession").create({
            ...common,
            offeringId: offering._id,
            startAt: new Date(Date.now() + 86400000),
            endAt: new Date(Date.now() + 90000000),
            status: "open_for_booking",
          });
          referenceType = "coach_booking";
          purchasePath = `/api/v1/athlete/sessions/${session._id}/bookings`;
        } else {
          const course = await db.model("TrainingClass").create({
            ...common,
            normalizedTitle: "test",
            slug: "acceptance-course",
            courseStartAt: new Date(Date.now() + 86400000),
            courseEndAt: new Date(Date.now() + 90000000),
            price: { amount: 100000, currency: "IRR" },
            status: "published",
            enrollmentMode: "automatic",
          });
          referenceType = "coach_class_enrollment";
          purchasePath = `/api/v1/athlete/classes/${course._id}/enrollments`;
        }
      }
      let order = (await post(purchasePath).expect(201)).body.data;
      if (kind === "booking") {
        await request(http)
          .patch(`/api/v1/athlete/bookings/${order.id}/mock-payment/reject`)
          .auth(token, { type: "bearer" })
          .expect(200);
        order = (await post(purchasePath).expect(201)).body.data;
        expect(order.paymentStatus).toBe("pending");
      }
      const quote = (
        await post("/api/v1/payments/quote", {
          referenceType,
          referenceId: order.id,
          walletAmount: 0,
        }).expect(201)
      ).body.data;
      const intent = (
        await post("/api/v1/payments/intents", {
          referenceType,
          referenceId: order.id,
          idempotencyKey: `acceptance-${kind}-${order.id}`,
          returnUrl: "https://example.test/receipt",
          walletAmount: 0,
          expectedAmount: quote.amount,
        }).expect(201)
      ).body.data;
      const decision = (
        await post(`/api/v1/payments/intents/${intent.id}/mock/decision`, {
          status: "paid",
        }).expect(201)
      ).body.data;
      expect(decision.status).toBe("paid");
      await post(`/api/v1/payments/intents/${intent.id}/mock/decision`, {
        status: "paid",
      }).expect(201);
      expect(
        await db.model("LedgerEntry").countDocuments({
          sourceId: new Types.ObjectId(intent.id),
          sourceType: "payment",
        }),
      ).toBe(3);
      if (kind === "membership") {
        const mine = await request(http)
          .get("/api/v1/benefit-purchases/mine/entitlements")
          .auth(token, { type: "bearer" })
          .expect(200);
        expect(mine.body.data.items).toHaveLength(1);
        expect(mine.body.data.items[0].remainingSessions).toBe(5);
      } else {
        await post(
          `/api/v1/athlete/${kind === "booking" ? "bookings" : "enrollments"}/${order.id}/cancel`,
          kind === "booking" ? { reason: "لغو آزمون پذیرش" } : {},
        ).expect(201);
        expect(
          (await db.model("PaymentIntent").findById(intent.id)).status,
        ).toBe("refunded");
      }
    },
  );
});
