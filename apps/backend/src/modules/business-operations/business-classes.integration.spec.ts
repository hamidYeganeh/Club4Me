import { UpdateBusinessClassDto } from "./business-classes.dto";
import { ClassBillingService } from "./class-billing.service";
import {
  ClubManualPayment,
  ClubManualPaymentSchema,
} from "./schemas/payment.schema";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import { ClubsRepository } from "../clubs/clubs.repository";
import { UsersRepository } from "../users/users.repository";
import { AppConfigService } from "../../config/app-config.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  User,
  UserSchema,
  type UserDocument,
} from "../users/schemas/user.schema";
import { BusinessClassesService } from "./business-classes.service";
import { BusinessClassPortalService } from "./class-portal.service";
import { ClubBranch, ClubBranchSchema } from "./schemas/branch.schema";
import {
  ClubCoachProfile,
  ClubCoachProfileSchema,
} from "./schemas/coach.schema";
import {
  ClubStudent,
  ClubStudentSchema,
  type ClubStudentDocument,
} from "./schemas/student.schema";
import {
  BusinessClassAttendance,
  BusinessClassAttendanceSchema,
  BusinessClassEnrollment,
  BusinessClassEnrollmentSchema,
  BusinessClassSession,
  BusinessClassSessionSchema,
  BusinessTrainingClass,
  BusinessTrainingClassSchema,
  BusinessClassCheckInCredential,
  BusinessClassCheckInCredentialSchema,
  BusinessCalendarFeed,
  BusinessCalendarFeedSchema,
} from "./schemas/training-class.schema";

describe("BusinessClassesService integration", () => {
  let mongo: MongoMemoryReplSet;
  let moduleRef: TestingModule;
  let service: BusinessClassesService;
  let portal: BusinessClassPortalService;
  let students: Model<ClubStudentDocument>;
  let users: Model<UserDocument>;
  let coaches: Model<ClubCoachProfile>;
  const ownerId = new Types.ObjectId().toHexString();
  const clubId = new Types.ObjectId().toHexString();

  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({
      replSet: { count: 1, args: ["--oplogSize", "16"] },
    });
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongo.getUri()),
        MongooseModule.forFeature([
          { name: ClubManualPayment.name, schema: ClubManualPaymentSchema },
          {
            name: BusinessTrainingClass.name,
            schema: BusinessTrainingClassSchema,
          },
          {
            name: BusinessClassSession.name,
            schema: BusinessClassSessionSchema,
          },
          {
            name: BusinessClassEnrollment.name,
            schema: BusinessClassEnrollmentSchema,
          },
          {
            name: BusinessClassAttendance.name,
            schema: BusinessClassAttendanceSchema,
          },
          {
            name: BusinessClassCheckInCredential.name,
            schema: BusinessClassCheckInCredentialSchema,
          },
          {
            name: BusinessCalendarFeed.name,
            schema: BusinessCalendarFeedSchema,
          },
          { name: ClubStudent.name, schema: ClubStudentSchema },
          { name: ClubCoachProfile.name, schema: ClubCoachProfileSchema },
          { name: ClubBranch.name, schema: ClubBranchSchema },
          { name: User.name, schema: UserSchema },
        ]),
      ],
      providers: [
        ClassBillingService,
        BusinessClassesService,
        BusinessClassPortalService,
        UsersRepository,
        {
          provide: AppConfigService,
          useValue: {
            env: { MOCK_PAYMENT_CALLBACK_SECRET: "test-secret-123456789" },
          },
        },
        {
          provide: NotificationsService,
          useValue: { notifyWaitlistSeatAvailable: jest.fn() },
        },
        {
          provide: ClubsRepository,
          useValue: {
            findForOwner: jest.fn().mockResolvedValue({ id: clubId }),
            hasPermission: jest.fn().mockResolvedValue(true),
            findPublic: jest.fn().mockResolvedValue({
              id: clubId,
              name: "باشگاه تست",
              slug: "test-club",
            }),
            findById: jest.fn().mockResolvedValue({
              id: clubId,
              name: "باشگاه تست",
              slug: "test-club",
            }),
          },
        },
      ],
    }).compile();
    await moduleRef.init();
    service = moduleRef.get(BusinessClassesService);
    portal = moduleRef.get(BusinessClassPortalService);
    students = moduleRef.get<Model<ClubStudentDocument>>(
      getModelToken(ClubStudent.name),
    );
    users = moduleRef.get<Model<UserDocument>>(getModelToken(User.name));
    coaches = moduleRef.get<Model<ClubCoachProfile>>(
      getModelToken(ClubCoachProfile.name),
    );
  });

  beforeEach(async () => {
    await students.db.collection("clubs").insertOne({
      _id: new Types.ObjectId(clubId),
      name: "باشگاه تست",
      reviewStatus: "approved",
      visibility: "public",
      operationalStatus: "active",
      geo: { cityId: new Types.ObjectId("66d400000000000000000051") },
    });
  });

  it("scopes club coaches to assigned classes, including rosters, attendance and check-in credentials", async () => {
    const coachUser = new Types.ObjectId();
    await students.db.collection("club_memberships").insertOne({
      clubId: new Types.ObjectId(clubId),
      userId: coachUser,
      role: "coach",
      status: "accepted",
    });
    const profile = await coaches.create({
      clubId: new Types.ObjectId(clubId),
      userId: coachUser,
      firstName: "مربی",
      lastName: "تست",
      phone: "09121111111",
      status: "active",
    });
    const input = {
      packageSessionCount: null,
      coachProfileId: null,
      branchId: null,
      title: "کلاس تست دسترسی",
      description: "",
      sport: "بدنسازی",
      level: "",
      model: "single" as const,
      pricingModel: "course" as const,
      price: 0,
      currency: "IRR",
      capacity: 2,
      startDate: "2030-01-05",
      endDate: "2030-01-05",
      schedule: [{ dayOfWeek: 6, startTime: "18:00", durationMinutes: 60 }],
      status: "active" as const,
    };
    const assigned = await service.create(ownerId, clubId, {
      ...input,
      coachProfileId: String(profile._id),
    });
    // Exercise the same DTO parsing as an HTTP PATCH, then verify persisted scope.
    await service.update(
      ownerId,
      clubId,
      assigned.id,
      UpdateBusinessClassDto.schema.parse({
        visibility: "private",
        enrollmentMode: "requires_approval",
        status: "paused",
      }),
    );
    await service.update(
      ownerId,
      clubId,
      assigned.id,
      UpdateBusinessClassDto.schema.parse({ title: "عنوان ویرایش‌شده" }),
    );
    const saved = await students.db
      .collection("business_training_classes")
      .findOne({ _id: new Types.ObjectId(assigned.id) });
    expect(saved).toMatchObject({
      visibility: "private",
      enrollmentMode: "requires_approval",
      status: "paused",
    });
    expect(String(saved?.coachProfileId)).toBe(String(profile._id));
    await service.update(ownerId, clubId, assigned.id, { status: "active" });
    const unassigned = await service.create(ownerId, clubId, input);
    expect(
      (await service.list(String(coachUser), clubId)).items.map(
        (item) => item.id,
      ),
    ).toEqual([assigned.id]);
    expect((await service.get(String(coachUser), clubId, assigned.id)).id).toBe(
      assigned.id,
    );
    const session = (await service.listSessions(ownerId, clubId, unassigned.id))
      .items[0]!;
    for (const request of [
      () => service.get(String(coachUser), clubId, unassigned.id),
      () => service.listEnrollments(String(coachUser), clubId, unassigned.id),
      () =>
        service.listAttendance(
          String(coachUser),
          clubId,
          unassigned.id,
          session.id,
        ),
      () =>
        service.recordAttendance(
          String(coachUser),
          clubId,
          unassigned.id,
          session.id,
          String(coachUser),
          { items: [] },
        ),
      () =>
        portal.generateOwnerCheckInCredential(
          String(coachUser),
          clubId,
          unassigned.id,
          session.id,
          10,
        ),
    ])
      await expect(request()).rejects.toMatchObject({
        status: 403,
        code: "CLASS_ASSIGNMENT_REQUIRED",
      });
    // A manager can operate across classes; role reduction remains checked by ClubsRepository.
    await students.db
      .collection("club_memberships")
      .updateOne({ userId: coachUser }, { $set: { role: "manager" } });
    expect((await service.list(String(coachUser), clubId)).items).toHaveLength(
      2,
    );
    await students.db
      .collection("club_memberships")
      .updateOne({ userId: coachUser }, { $set: { role: "coach" } });
    await coaches.updateOne(
      { _id: profile._id },
      { $set: { status: "inactive" } },
    );
    expect((await service.list(String(coachUser), clubId)).items).toHaveLength(
      0,
    );
  });

  it("paginates beyond 200 results and filters club visibility and city before counting", async () => {
    const hiddenClub = new Types.ObjectId();
    await students.db.collection("clubs").insertOne({
      _id: hiddenClub,
      reviewStatus: "draft",
      visibility: "public",
    });
    const classes = moduleRef.get<Model<BusinessTrainingClass>>(
      getModelToken(BusinessTrainingClass.name),
    );
    const make = (index: number, owner = new Types.ObjectId(clubId)) => ({
      clubId: owner,
      title: `کلاس يوگا ${index}`,
      description: "",
      sport: "یوگا",
      level: "مقدماتی",
      classModel: "group",
      pricingModel: "course",
      price: 100000,
      currency: "IRR",
      capacity: 10,
      startDate: new Date("2030-01-01"),
      endDate: new Date("2030-02-01"),
      status: "active",
      visibility: "public",
    });
    await classes.insertMany([
      ...Array.from({ length: 205 }, (_, index) => make(index)),
      ...Array.from({ length: 10 }, (_, index) => make(index, hiddenClub)),
    ]);
    const result = await portal.listPublic({
      page: "21",
      limit: "10",
      q: "یوگا",
      cityId: "66d400000000000000000051",
    });
    expect(result).toMatchObject({
      page: 21,
      limit: 10,
      total: 205,
      totalPages: 21,
    });
    expect(result.items).toHaveLength(5);
    expect(
      (await portal.listPublic({ cityId: String(new Types.ObjectId()) })).total,
    ).toBe(0);
    await expect(portal.listPublic({ page: "0" })).rejects.toMatchObject({
      status: 400,
    });
    const repository = moduleRef.get(ClubsRepository);
    jest
      .spyOn(repository, "findPublic")
      .mockRejectedValueOnce(new Error("catalog unavailable"));
    await expect(portal.listPublic({ limit: "1" })).rejects.toThrow(
      "catalog unavailable",
    );
  });

  afterEach(async () => {
    await Promise.all(
      Object.values(students.db.collections).map((collection) =>
        collection.deleteMany({}),
      ),
    );
  });
  afterAll(async () => {
    await moduleRef.close();
    await mongo.stop();
  });

  it("shares the last class credit across owner, coach and QR attendance and keeps corrections auditable", async () => {
    const athlete = await users.create({
      phone: "+989121119901",
      roles: ["athlete"],
      status: "active",
    });
    const teacher = await users.create({
      phone: "+989121119902",
      roles: ["coach"],
      status: "active",
    });
    const coach = await coaches.create({
      clubId: new Types.ObjectId(clubId),
      userId: teacher._id,
      firstName: "مربی",
      lastName: "آزمایشی",
      phone: teacher.phone,
      status: "active",
    });
    const student = await students.create({
      clubId: new Types.ObjectId(clubId),
      userId: athlete._id,
      firstName: "شاگرد",
      lastName: "آزمایشی",
      phone: athlete.phone,
      status: "active",
    });
    const training = await students.db
      .model(BusinessTrainingClass.name)
      .create({
        clubId: new Types.ObjectId(clubId),
        coachProfileId: coach._id,
        title: "سهمیه مشترک",
        classModel: "group",
        pricingModel: "package",
        price: 1000,
        packageSessionCount: 1,
        capacity: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        schedule: [],
      });
    const membership = await students.db
      .model(BusinessClassEnrollment.name)
      .create({
        classId: training._id,
        clubId: new Types.ObjectId(clubId),
        studentId: student._id,
        status: "active",
        agreedPrice: 1000,
        paymentStatus: "paid",
        totalSessions: 1,
        remainingSessions: 1,
        enrolledAt: new Date(),
        createdBy: new Types.ObjectId(ownerId),
      });
    const sessions = [];
    for (const offset of [0, 1])
      sessions.push(
        await students.db.model(BusinessClassSession.name).create({
          classId: training._id,
          clubId: new Types.ObjectId(clubId),
          startsAt: new Date(Date.now() + offset * 3600000),
          endsAt: new Date(Date.now() + (offset + 1) * 3600000),
          capacity: 10,
        }),
      );
    expect(
      await students.db
        .model(BusinessClassSession.name)
        .countDocuments({ classId: training._id }),
    ).toBe(2);
    const input = {
      items: [
        {
          studentId: String(student._id),
          status: "present" as const,
          notes: "",
        },
      ],
    };
    const results = await Promise.allSettled([
      service.recordAttendance(
        ownerId,
        clubId,
        String(training._id),
        String(sessions[0]!._id),
        ownerId,
        input,
      ),
      portal.recordCoachAttendance(
        String(teacher._id),
        String(training._id),
        String(sessions[1]!._id),
        input,
      ),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      (await students.db
        .model(BusinessClassEnrollment.name)
        .findById(membership._id))!.remainingSessions,
    ).toBe(0);
    const record = (await students.db
      .model(BusinessClassAttendance.name)
      .findOne({ classId: training._id }))!;
    expect(record.changes).toHaveLength(1);
    const unused = sessions.find(
      (session) => String(session._id) !== String(record.sessionId),
    )!;
    const persistedUnused = await students.db
      .model(BusinessClassSession.name)
      .findById(unused._id);
    expect(persistedUnused?.toObject()).toMatchObject({
      clubId: new Types.ObjectId(clubId),
      classId: training._id,
    });
    const credential = await portal.generateOwnerCheckInCredential(
      ownerId,
      clubId,
      String(training._id),
      String(unused._id),
      15,
    );
    await expect(
      portal.checkInAthlete(
        String(athlete._id),
        String(training._id),
        String(unused._id),
        credential.code === "00000" ? "11111" : "00000",
      ),
    ).rejects.toMatchObject({ code: "CHECKIN_CREDENTIAL_INVALID" });
    expect(
      (await students.db
        .model(BusinessClassCheckInCredential.name)
        .findOne({ sessionId: unused._id }))!.attempts,
    ).toBe(1);
    await expect(
      portal.checkInAthlete(
        String(athlete._id),
        String(training._id),
        String(unused._id),
        credential.code,
      ),
    ).rejects.toMatchObject({ code: "CLASS_CREDIT_EXHAUSTED" });
    expect(
      await students.db
        .model(BusinessClassAttendance.name)
        .countDocuments({ classId: training._id }),
    ).toBe(1);
    await service.recordAttendance(
      ownerId,
      clubId,
      String(training._id),
      String(record.sessionId),
      ownerId,
      { items: [{ ...input.items[0]!, status: "absent" }] },
    );
    expect(
      (await students.db
        .model(BusinessClassAttendance.name)
        .findById(record._id))!.changes,
    ).toHaveLength(2);
    await portal.checkInAthlete(
      String(athlete._id),
      String(training._id),
      String(unused._id),
      credential.code,
    );
    await portal.checkInAthlete(
      String(athlete._id),
      String(training._id),
      String(unused._id),
      credential.code,
    );
    expect(
      (await students.db
        .model(BusinessClassEnrollment.name)
        .findById(membership._id))!.remainingSessions,
    ).toBe(0);
    expect(
      (await students.db
        .model(BusinessClassAttendance.name)
        .findOne({ sessionId: unused._id }))!.changes,
    ).toHaveLength(1);
    const arrival = await students.db
      .model(BusinessClassAttendance.name)
      .findOne({ sessionId: unused._id });
    const checkoutInput = { items: [{ ...input.items[0]!, checkedOut: true }] };
    await portal.recordCoachAttendance(
      String(teacher._id),
      String(training._id),
      String(unused._id),
      checkoutInput,
    );
    const departure = await students.db
      .model(BusinessClassAttendance.name)
      .findOne({ sessionId: unused._id });
    await portal.recordCoachAttendance(
      String(teacher._id),
      String(training._id),
      String(unused._id),
      checkoutInput,
    );
    const retry = await students.db
      .model(BusinessClassAttendance.name)
      .findOne({ sessionId: unused._id });
    expect(departure!.checkedInAt).toEqual(arrival!.checkedInAt);
    expect(retry!.checkedOutAt).toEqual(departure!.checkedOutAt);
    expect(retry!.changes).toHaveLength(2);
    expect(
      (await students.db
        .model(BusinessClassEnrollment.name)
        .findById(membership._id))!.remainingSessions,
    ).toBe(0);
  });

  it("creates sessions, enrolls a club student, tracks package usage and transfers enrollment", async () => {
    const student = await students.create({
      clubId: new Types.ObjectId(clubId),
      firstName: "علی",
      lastName: "احمدی",
      phone: "09120000000",
      status: "active",
    });
    const payload = {
      title: "کلاس خصوصی",
      description: "",
      sport: "بدنسازی",
      level: "مقدماتی",
      model: "single" as const,
      pricingModel: "package" as const,
      price: 8_000_000,
      currency: "IRR",
      packageSessionCount: 8,
      capacity: 1,
      coachProfileId: null,
      branchId: null,
      startDate: "2030-01-05",
      endDate: "2030-01-05",
      schedule: [{ dayOfWeek: 6, startTime: "18:00", durationMinutes: 60 }],
      status: "active" as const,
      visibility: "public" as const,
      enrollmentMode: "automatic" as const,
    };
    const trainingClass = await service.create(ownerId, clubId, payload);
    const sessions = await service.listSessions(
      ownerId,
      clubId,
      trainingClass.id,
    );
    expect(sessions.items).toHaveLength(1);

    const enrollment = await service.enroll(
      ownerId,
      clubId,
      trainingClass.id,
      ownerId,
      {
        studentId: String(student._id),
        status: "active",
        agreedPrice: payload.price,
        paymentStatus: "paid",
        totalSessions: 8,
      },
    );
    await service.recordAttendance(
      ownerId,
      clubId,
      trainingClass.id,
      sessions.items[0]!.id,
      ownerId,
      {
        items: [
          { studentId: String(student._id), status: "present", notes: "" },
        ],
      },
    );
    let membership = (
      await service.listEnrollments(ownerId, clubId, trainingClass.id)
    ).items[0]!;
    expect(membership.remainingSessions).toBe(7);

    await service.recordAttendance(
      ownerId,
      clubId,
      trainingClass.id,
      sessions.items[0]!.id,
      ownerId,
      {
        items: [
          {
            studentId: String(student._id),
            status: "absent",
            notes: "اصلاح ثبت",
          },
        ],
      },
    );
    membership = (
      await service.listEnrollments(ownerId, clubId, trainingClass.id)
    ).items[0]!;
    expect(membership.remainingSessions).toBe(8);

    const target = await service.create(ownerId, clubId, {
      ...payload,
      title: "کلاس جایگزین",
      startDate: "2030-01-06",
      endDate: "2030-01-06",
    });
    const moved = await service.transfer(
      ownerId,
      clubId,
      trainingClass.id,
      enrollment.id,
      target.id,
      ownerId,
    );
    expect(moved.classId).toBe(target.id);
    expect(moved.status).toBe("active");
    expect(
      (await service.listEnrollments(ownerId, clubId, trainingClass.id))
        .items[0]?.status,
    ).toBe("cancelled");
  });

  it("links athlete and coach accounts to a public club class and completes payment and attendance", async () => {
    const athleteId = new Types.ObjectId();
    const coachUserId = new Types.ObjectId();
    await users.create([
      {
        _id: athleteId,
        phone: "+989121111111",
        firstName: "سارا",
        lastName: "محمدی",
        roles: ["athlete"],
      },
      {
        _id: coachUserId,
        phone: "+989122222222",
        firstName: "رضا",
        lastName: "مرادی",
        roles: ["coach"],
      },
    ]);
    const coach = await coaches.create({
      clubId: new Types.ObjectId(clubId),
      firstName: "رضا",
      lastName: "مرادی",
      phone: "09122222222",
      status: "active",
    });
    const trainingClass = await service.create(ownerId, clubId, {
      title: "فیتنس گروهی",
      description: "تمرین کاربردی",
      sport: "فیتنس",
      level: "مقدماتی",
      model: "group",
      pricingModel: "course",
      price: 5_000_000,
      currency: "IRR",
      packageSessionCount: null,
      capacity: 10,
      coachProfileId: String(coach._id),
      branchId: null,
      startDate: "2030-02-02",
      endDate: "2030-02-09",
      schedule: [{ dayOfWeek: 6, startTime: "18:00", durationMinutes: 60 }],
      status: "active",
      visibility: "public",
      enrollmentMode: "automatic",
    });
    expect((await portal.listPublic({})).items).toHaveLength(1);
    const pending = await portal.enrollAthlete(
      String(athleteId),
      trainingClass.id,
    );
    expect(pending.paymentStatus).toBe("pending");
    const paid = await portal.finalizeEnrollmentPayment(pending.id, true);
    expect(paid.status).toBe("active");
    expect(paid.paymentStatus).toBe("paid");
    expect((await portal.listForAthlete(String(athleteId))).items).toHaveLength(
      1,
    );
    expect((await portal.listForCoach(String(coachUserId))).items).toHaveLength(
      1,
    );
    const roster = await portal.listCoachEnrollments(
      String(coachUserId),
      trainingClass.id,
    );
    expect(roster.items).toHaveLength(1);
    expect(roster.items[0]).not.toHaveProperty("agreedPrice");
    expect(roster.items[0]?.paymentStatus).toBe("paid");
    const detail = await portal.getForCoach(
      String(coachUserId),
      trainingClass.id,
    );
    const sessionId = detail.sessions[0]!.id;
    const coachAttendance = await portal.listCoachAttendance(
      String(coachUserId),
      trainingClass.id,
      sessionId,
    );
    expect(coachAttendance.items[0]?.student.name).toBe("سارا محمدی");
    await portal.recordCoachAttendance(
      String(coachUserId),
      trainingClass.id,
      sessionId,
      {
        items: [
          {
            studentId: coachAttendance.items[0]!.studentId,
            status: "present",
            notes: "",
          },
        ],
      },
    );
    expect(
      (
        await portal.listCoachAttendance(
          String(coachUserId),
          trainingClass.id,
          sessionId,
        )
      ).items[0]?.status,
    ).toBe("present");
  });
  it("offers only available seats in queue order and moves to the next person after expiry without repeated offers", async () => {
    const course = await students.db
      .model(BusinessTrainingClass.name)
      .create({
        clubId: new Types.ObjectId(clubId),
        title: "صف ظرفیت",
        classModel: "group",
        pricingModel: "course",
        capacity: 1,
        price: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        schedule: [],
        status: "active",
      });
    const enrollments = students.db.model(BusinessClassEnrollment.name);
    const rows = [];
    for (let i = 0; i < 3; i++)
      rows.push(
        await enrollments.create({
          classId: course._id,
          clubId: course.clubId,
          studentId: new Types.ObjectId(),
          status: "waitlisted",
          paymentStatus: "waived",
          agreedPrice: 0,
          createdBy: new Types.ObjectId(ownerId),
          waitlistRequestedAt: new Date(Date.now() - (3 - i) * 60000),
        }),
      );
    await portal.refreshWaitlistOffers();
    expect(
      (await enrollments.findById(rows[0]!._id)).waitlistOfferExpiresAt,
    ).toBeTruthy();
    expect(
      (await enrollments.findById(rows[1]!._id)).waitlistOfferExpiresAt,
    ).toBeNull();
    await portal.refreshWaitlistOffers();
    expect(
      await enrollments.countDocuments({
        classId: course._id,
        waitlistOfferExpiresAt: { $ne: null },
      }),
    ).toBe(1);
    await enrollments.updateOne(
      { _id: rows[0]!._id },
      { $set: { waitlistOfferExpiresAt: new Date(Date.now() - 1000) } },
    );
    await portal.refreshWaitlistOffers();
    expect(
      (await enrollments.findById(rows[1]!._id)).waitlistOfferExpiresAt,
    ).toBeTruthy();
    expect(
      (
        await enrollments.findById(rows[0]!._id)
      ).waitlistOfferExpiresAt.getTime(),
    ).toBeLessThan(Date.now());
  });
});
