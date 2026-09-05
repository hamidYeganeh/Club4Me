import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
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
  let mongo: MongoMemoryServer;
  let moduleRef: TestingModule;
  let service: BusinessClassesService;
  let portal: BusinessClassPortalService;
  let students: Model<ClubStudentDocument>;
  let users: Model<UserDocument>;
  let coaches: Model<ClubCoachProfile>;
  const ownerId = new Types.ObjectId().toHexString();
  const clubId = new Types.ObjectId().toHexString();

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongo.getUri()),
        MongooseModule.forFeature([
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
    const paid = await portal.resolvePayment(
      String(athleteId),
      pending.id,
      "approve",
    );
    expect(paid.status).toBe("active");
    expect(paid.paymentStatus).toBe("paid");
    expect((await portal.listForAthlete(String(athleteId))).items).toHaveLength(
      1,
    );
    expect((await portal.listForCoach(String(coachUserId))).items).toHaveLength(
      1,
    );
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
});
