import { MongoMemoryServer } from "mongodb-memory-server";
import { createConnection, Connection, Types } from "mongoose";
import { BusinessOperationsService } from "./business-operations.service";
import { ClubStudentSchema } from "./schemas/student.schema";
import { ClubAttendanceSchema } from "./schemas/attendance.schema";
import {
  BusinessClassAttendanceSchema,
  BusinessTrainingClassSchema,
} from "./schemas/training-class.schema";

describe("member follow-up isolation", () => {
  let mongo: MongoMemoryServer,
    db: Connection,
    service: BusinessOperationsService;
  const club = new Types.ObjectId(),
    otherClub = new Types.ObjectId(),
    owner = String(new Types.ObjectId());
  const authorize = jest.fn();
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    db = await createConnection(mongo.getUri()).asPromise();
    service = new BusinessOperationsService(
      db.model("ClubStudent", ClubStudentSchema) as never,
      {} as never,
      {} as never,
      db.model("ClubAttendance", ClubAttendanceSchema) as never,
      {} as never,
      db.model("BusinessTrainingClass", BusinessTrainingClassSchema) as never,
      db.model(
        "BusinessClassAttendance",
        BusinessClassAttendanceSchema,
      ) as never,
      { findForOwner: authorize } as never,
      {} as never,
      {} as never,
    );
  });
  afterAll(async () => {
    await db?.close();
    await mongo?.stop();
  });
  beforeEach(async () => {
    for (const c of await db.db!.collections()) await c.deleteMany({});
    authorize.mockReset().mockResolvedValue({});
  });
  it("uses actual session time, defers recorded follow-ups and never edits another club's student", async () => {
    const student = new Types.ObjectId(),
      outsider = new Types.ObjectId();
    await db.collection("club_students").insertMany([
      {
        _id: student,
        clubId: club,
        status: "active",
        firstName: "عضو",
        lastName: "اول",
        phone: "09120000000",
        createdAt: new Date(Date.now() - 30 * 86400000),
      },
      {
        _id: outsider,
        clubId: otherClub,
        status: "active",
        createdAt: new Date(0),
      },
    ]);
    expect(
      (await service.memberFollowUps(owner, String(club))).items,
    ).toHaveLength(1);
    await expect(
      service.saveMemberFollowUp(owner, String(club), String(outsider), {
        note: "پیگیری",
        remindInDays: 7,
      }),
    ).rejects.toMatchObject({ status: 404 });
    await service.saveMemberFollowUp(owner, String(club), String(student), {
      note: "هفته آینده برمی‌گردد",
      remindInDays: 7,
    });
    expect(
      (await service.memberFollowUps(owner, String(club))).items[0],
    ).toMatchObject({ deferred: true, note: "هفته آینده برمی‌گردد" });
    const sessionId = new Types.ObjectId(),
      classId = new Types.ObjectId();
    await db
      .collection("business_class_sessions")
      .insertOne({ _id: sessionId, startsAt: new Date() });
    await db
      .collection("business_class_attendance")
      .insertOne({
        sessionId,
        classId,
        clubId: club,
        studentId: student,
        status: "present",
        createdAt: new Date(0),
      });
    expect((await service.memberFollowUps(owner, String(club))).items).toEqual(
      [],
    );
    expect(authorize).toHaveBeenCalledWith(
      owner,
      String(club),
      "attendance.read",
    );
  });
  it("denies queries and writes when the actor lacks the corresponding permission", async () => {
    authorize.mockRejectedValue(new Error("forbidden"));
    await expect(service.memberFollowUps(owner, String(club))).rejects.toThrow(
      "forbidden",
    );
    await expect(service.capacityOverview(owner, String(club))).rejects.toThrow(
      "forbidden",
    );
    await expect(
      service.saveMemberFollowUp(
        owner,
        String(club),
        String(new Types.ObjectId()),
        { note: "x", remindInDays: 7 },
      ),
    ).rejects.toThrow("forbidden");
  });
});
