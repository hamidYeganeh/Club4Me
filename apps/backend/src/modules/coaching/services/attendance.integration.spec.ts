import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createConnection, Connection, Types } from "mongoose";
import { AttendanceService } from "./attendance.service";
import { SessionAttendance, SessionAttendanceSchema, ClassEnrollment, ClassEnrollmentSchema, SessionBooking, SessionBookingSchema } from "../schemas/coaching.schemas";

describe("coach attendance lifecycle", () => {
  let mongo: MongoMemoryReplSet;
  let connection: Connection;
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({replSet: {count: 1}});
    connection = await createConnection(mongo.getUri()).asPromise();
  }, 60000);
  afterAll(async () => { await connection?.close(); await mongo?.stop(); });
  it("requires arrival for departure, preserves timestamps on retry and clears stale times for absence", async () => {
    const attendance = connection.model(SessionAttendance.name, SessionAttendanceSchema);
    const enrollments = connection.model(ClassEnrollment.name, ClassEnrollmentSchema);
    const bookings = connection.model(SessionBooking.name, SessionBookingSchema);
    await Promise.all([attendance.syncIndexes(), enrollments.syncIndexes(), bookings.syncIndexes()]);
    const athleteId = new Types.ObjectId();
    const sessionId = new Types.ObjectId();
    const ownerCoachId = new Types.ObjectId();
    const userId = String(new Types.ObjectId());
    await bookings.collection.insertOne({_id: new Types.ObjectId(), sessionId, athleteId, status: "confirmed"});
    const session = {_id: sessionId, ownerCoachId, status: "scheduled", startAt: new Date(), endAt: new Date(Date.now()+3600000), title: "تست حضور"};
    const service = new AttendanceService(attendance as never, enrollments as never, bookings as never, {requireOwnedDocument: async () => session} as never, {findManyByIds: async () => [{id: String(athleteId), firstName: "علی"}]} as never);
    const present = {athleteId: String(athleteId), status: "present" as const};
    await expect(service.record(userId, String(sessionId), [{...present, checkedOut: true}])).rejects.toMatchObject({code: "ATTENDANCE_CHECKOUT_REQUIRES_CHECKIN"});
    const arrived = (await service.record(userId, String(sessionId), [present])).items[0]!;
    expect(arrived.checkedInAt).toBeTruthy();
    expect(arrived.athlete).toMatchObject({firstName: "علی"});
    const exited = (await service.record(userId, String(sessionId), [{...present, checkedOut: true}])).items[0]!;
    const retried = (await service.record(userId, String(sessionId), [{...present, checkedOut: true}])).items[0]!;
    expect(exited.checkedInAt).toBe(arrived.checkedInAt);
    expect(exited.checkedOutAt).toBeTruthy();
    expect(retried.checkedOutAt).toBe(exited.checkedOutAt);
    const stored = await attendance.findOne({sessionId});
    expect(stored!.changes.map(change => change.after)).toEqual(["present", "checked_out"]);
    const absent = (await service.record(userId, String(sessionId), [{...present, status: "absent"}])).items[0]!;
    expect(absent.checkedInAt).toBeNull();
    expect(absent.checkedOutAt).toBeNull();
    session.status = "cancelled";
    await expect(service.record(userId, String(sessionId), [present])).rejects.toMatchObject({code: "CLASS_SESSION_CANCELLED"});
  });
});
