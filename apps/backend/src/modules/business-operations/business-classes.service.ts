import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AppError } from "../../common/errors/app.exception";
import { ClubsRepository } from "../clubs/clubs.repository";
import type {
  CreateBusinessClassDto,
  CreateClassEnrollmentDto,
  RecordClassAttendanceDto,
  UpdateBusinessClassDto,
  UpdateClassEnrollmentDto,
  UpdateClassSessionDto,
} from "./business-classes.dto";
import { ClubBranch, type ClubBranchDocument } from "./schemas/branch.schema";
import {
  ClubCoachProfile,
  type ClubCoachProfileDocument,
} from "./schemas/coach.schema";
import {
  ClubStudent,
  type ClubStudentDocument,
} from "./schemas/student.schema";
import {
  BusinessClassAttendance,
  type BusinessClassAttendanceDocument,
  BusinessClassEnrollment,
  type BusinessClassEnrollmentDocument,
  BusinessClassSession,
  type BusinessClassSessionDocument,
  BusinessTrainingClass,
  type BusinessTrainingClassDocument,
} from "./schemas/training-class.schema";

@Injectable()
export class BusinessClassesService {
  constructor(
    @InjectModel(BusinessTrainingClass.name)
    private classes: Model<BusinessTrainingClassDocument>,
    @InjectModel(BusinessClassSession.name)
    private sessions: Model<BusinessClassSessionDocument>,
    @InjectModel(BusinessClassEnrollment.name)
    private enrollments: Model<BusinessClassEnrollmentDocument>,
    @InjectModel(BusinessClassAttendance.name)
    private attendance: Model<BusinessClassAttendanceDocument>,
    @InjectModel(ClubStudent.name) private students: Model<ClubStudentDocument>,
    @InjectModel(ClubCoachProfile.name)
    private coaches: Model<ClubCoachProfileDocument>,
    @InjectModel(ClubBranch.name) private branches: Model<ClubBranchDocument>,
    private clubs: ClubsRepository,
  ) {}

  private async club(ownerId: string, clubId: string) {
    await this.clubs.findForOwner(ownerId, clubId);
    return oid(clubId);
  }

  async list(ownerId: string, clubId: string) {
    const id = await this.club(ownerId, clubId);
    const items = await this.classes
      .find({ clubId: id })
      .sort({ startDate: -1, createdAt: -1 });
    const counts = await this.enrollments.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      { $match: { clubId: id, status: "active" } },
      { $group: { _id: "$classId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(
      counts.map((item) => [String(item._id), item.count]),
    );
    return {
      items: items.map((item) => ({
        ...classDto(item),
        enrollmentCount: countMap.get(String(item._id)) ?? 0,
      })),
    };
  }

  async get(ownerId: string, clubId: string, classId: string) {
    const id = await this.club(ownerId, clubId);
    const item = await this.classDocument(id, classId);
    const [enrollmentCount, sessionCount] = await Promise.all([
      this.enrollments.countDocuments({ classId: item._id, status: "active" }),
      this.sessions.countDocuments({ classId: item._id }),
    ]);
    return { ...classDto(item), enrollmentCount, sessionCount };
  }

  async create(ownerId: string, clubId: string, input: CreateBusinessClassDto) {
    const id = await this.club(ownerId, clubId);
    await this.assertRelations(id, input.coachProfileId, input.branchId);
    const item = await this.classes.create(toClassPersistence(id, input));
    await this.syncFutureSessions(item);
    return {
      ...classDto(item),
      enrollmentCount: 0,
      sessionCount: await this.sessions.countDocuments({ classId: item._id }),
    };
  }

  async update(
    ownerId: string,
    clubId: string,
    classId: string,
    input: UpdateBusinessClassDto,
  ) {
    const id = await this.club(ownerId, clubId);
    const item = await this.classDocument(id, classId);
    await this.assertRelations(id, input.coachProfileId, input.branchId);
    if (input.startDate && input.endDate && input.startDate > input.endDate)
      throw invalid("CLASS_DATE_RANGE_INVALID");
    if (input.model === "private" && input.capacity && input.capacity > 4)
      throw invalid("PRIVATE_CLASS_CAPACITY_INVALID");
    Object.assign(item, toClassUpdate(input));
    if (item.startDate > item.endDate)
      throw invalid("CLASS_DATE_RANGE_INVALID");
    if (item.classModel === "private" && item.capacity > 4)
      throw invalid("PRIVATE_CLASS_CAPACITY_INVALID");
    if (input.capacity) {
      const activeCount = await this.enrollments.countDocuments({
        classId: item._id,
        status: "active",
      });
      if (input.capacity < activeCount)
        throw new AppError(
          409,
          "CLASS_CAPACITY_BELOW_ENROLLMENT_COUNT",
          "Class capacity cannot be below active enrollment count",
        );
    }
    await item.save();
    if (
      ["startDate", "endDate", "schedule", "capacity"].some(
        (key) => key in input,
      )
    )
      await this.syncFutureSessions(item);
    return this.get(ownerId, clubId, classId);
  }

  async regenerate(ownerId: string, clubId: string, classId: string) {
    const id = await this.club(ownerId, clubId);
    const item = await this.classDocument(id, classId);
    await this.syncFutureSessions(item);
    return this.listSessions(ownerId, clubId, classId);
  }

  async listSessions(ownerId: string, clubId: string, classId: string) {
    const id = await this.club(ownerId, clubId);
    const item = await this.classDocument(id, classId);
    const items = await this.sessions
      .find({ classId: item._id })
      .sort({ startsAt: 1 });
    return { items: items.map(sessionDto) };
  }

  async updateSession(
    ownerId: string,
    clubId: string,
    classId: string,
    sessionId: string,
    input: UpdateClassSessionDto,
  ) {
    const id = await this.club(ownerId, clubId);
    await this.classDocument(id, classId);
    const item = await this.sessions.findOne({
      _id: oid(sessionId),
      classId: oid(classId),
      clubId: id,
    });
    if (!item) throw notFound("CLASS_SESSION_NOT_FOUND");
    if (input.startsAt) item.startsAt = new Date(input.startsAt);
    if (input.endsAt) item.endsAt = new Date(input.endsAt);
    if (input.status) item.status = input.status;
    if (item.startsAt >= item.endsAt)
      throw invalid("CLASS_SESSION_TIME_INVALID");
    await item.save();
    return sessionDto(item);
  }

  async listEnrollments(ownerId: string, clubId: string, classId: string) {
    const id = await this.club(ownerId, clubId);
    await this.classDocument(id, classId);
    const items = await this.enrollments
      .find({ classId: oid(classId) })
      .sort({ enrolledAt: -1 });
    return { items: items.map(enrollmentDto) };
  }

  async enroll(
    ownerId: string,
    clubId: string,
    classId: string,
    userId: string,
    input: CreateClassEnrollmentDto,
  ) {
    const id = await this.club(ownerId, clubId);
    const trainingClass = await this.classDocument(id, classId);
    const studentId = oid(input.studentId);
    if (
      !(await this.students.exists({
        _id: studentId,
        clubId: id,
        status: "active",
      }))
    )
      throw notFound("ACTIVE_STUDENT_NOT_FOUND");
    const current = await this.enrollments.findOne({
      classId: trainingClass._id,
      studentId,
    });
    if (current && ["active", "waitlisted"].includes(current.status))
      throw new AppError(
        409,
        "STUDENT_ALREADY_ENROLLED",
        "Student is already enrolled",
      );
    if (input.status === "active") await this.assertCapacity(trainingClass);
    const totalSessions =
      input.totalSessions ??
      (trainingClass.pricingModel === "package"
        ? trainingClass.packageSessionCount
        : null);
    const payload = {
      clubId: id,
      classId: trainingClass._id,
      studentId,
      status: input.status,
      agreedPrice: input.agreedPrice,
      paymentStatus: input.paymentStatus,
      totalSessions,
      remainingSessions: totalSessions,
      enrolledAt: new Date(),
      waitlistRequestedAt: input.status === "waitlisted" ? new Date() : null,
      waitlistOfferExpiresAt: null,
      createdBy: oid(userId),
    };
    const item = current
      ? await this.enrollments.findByIdAndUpdate(
          current._id,
          { $set: payload },
          { new: true },
        )
      : await this.enrollments.create(payload);
    if (input.status === "active" && current?.status !== "active") {
      await this.classes.updateOne(
        { _id: trainingClass._id },
        { $inc: { activeEnrollmentCount: 1 } },
      );
    }
    return enrollmentDto(item!);
  }

  async updateEnrollment(
    ownerId: string,
    clubId: string,
    classId: string,
    enrollmentId: string,
    input: UpdateClassEnrollmentDto,
  ) {
    const id = await this.club(ownerId, clubId);
    const trainingClass = await this.classDocument(id, classId);
    const item = await this.enrollments.findOne({
      _id: oid(enrollmentId),
      classId: trainingClass._id,
    });
    if (!item) throw notFound("CLASS_ENROLLMENT_NOT_FOUND");
    if (input.status === "active" && item.status !== "active")
      await this.assertCapacity(trainingClass);
    const wasActive = item.status === "active";
    Object.assign(item, input);
    await item.save();
    const isActive = item.status === "active";
    if (wasActive !== isActive) {
      await this.classes.updateOne(
        { _id: trainingClass._id },
        { $inc: { activeEnrollmentCount: isActive ? 1 : -1 } },
      );
    }
    return enrollmentDto(item);
  }

  async transfer(
    ownerId: string,
    clubId: string,
    classId: string,
    enrollmentId: string,
    targetClassId: string,
    userId: string,
  ) {
    const id = await this.club(ownerId, clubId);
    await this.classDocument(id, classId);
    const target = await this.classDocument(id, targetClassId);
    const source = await this.enrollments.findOne({
      _id: oid(enrollmentId),
      classId: oid(classId),
      status: { $in: ["active", "waitlisted"] },
    });
    if (!source) throw notFound("CLASS_ENROLLMENT_NOT_FOUND");
    if (String(target._id) === String(source.classId))
      throw invalid("SAME_CLASS_TRANSFER");
    const activeCount = await this.enrollments.countDocuments({
      classId: target._id,
      status: "active",
    });
    const status = activeCount < target.capacity ? "active" : "waitlisted";
    const existing = await this.enrollments.findOne({
      classId: target._id,
      studentId: source.studentId,
    });
    if (existing && ["active", "waitlisted"].includes(existing.status))
      throw new AppError(
        409,
        "STUDENT_ALREADY_IN_TARGET_CLASS",
        "Student is already in target class",
      );
    const totalSessions =
      target.pricingModel === "package" ? target.packageSessionCount : null;
    const payload = {
      clubId: id,
      classId: target._id,
      studentId: source.studentId,
      status,
      agreedPrice: target.price,
      paymentStatus: "pending",
      totalSessions,
      remainingSessions: totalSessions,
      enrolledAt: new Date(),
      waitlistRequestedAt: status === "waitlisted" ? new Date() : null,
      waitlistOfferExpiresAt: null,
      createdBy: oid(userId),
    };
    const moved = existing
      ? await this.enrollments.findByIdAndUpdate(
          existing._id,
          { $set: payload },
          { new: true },
        )
      : await this.enrollments.create(payload);
    const sourceWasActive = source.status === "active";
    source.status = "cancelled";
    await source.save();
    if (sourceWasActive) {
      await this.classes.updateOne(
        { _id: source.classId, activeEnrollmentCount: { $gt: 0 } },
        { $inc: { activeEnrollmentCount: -1 } },
      );
    }
    if (status === "active") {
      await this.classes.updateOne(
        { _id: target._id },
        { $inc: { activeEnrollmentCount: 1 } },
      );
    }
    return enrollmentDto(moved!);
  }

  async listAttendance(
    ownerId: string,
    clubId: string,
    classId: string,
    sessionId: string,
  ) {
    const id = await this.club(ownerId, clubId);
    await this.assertSession(id, classId, sessionId);
    const items = await this.attendance.find({ sessionId: oid(sessionId) });
    return { items: items.map(attendanceDto) };
  }

  async recordAttendance(
    ownerId: string,
    clubId: string,
    classId: string,
    sessionId: string,
    userId: string,
    input: RecordClassAttendanceDto,
  ) {
    const id = await this.club(ownerId, clubId);
    const session = await this.assertSession(id, classId, sessionId);
    const activeEnrollments = await this.enrollments.find({
      classId: oid(classId),
      studentId: { $in: input.items.map((item) => oid(item.studentId)) },
      status: { $in: ["active", "completed"] },
    });
    const enrollmentMap = new Map(
      activeEnrollments.map((item) => [String(item.studentId), item]),
    );
    if (enrollmentMap.size !== input.items.length)
      throw invalid("ATTENDANCE_REQUIRES_ACTIVE_ENROLLMENT");
    const results: BusinessClassAttendanceDocument[] = [];
    for (const record of input.items) {
      const previous = await this.attendance.findOne({
        sessionId: session._id,
        studentId: oid(record.studentId),
      });
      const saved = await this.attendance.findOneAndUpdate(
        { sessionId: session._id, studentId: oid(record.studentId) },
        {
          $set: {
            clubId: id,
            classId: oid(classId),
            status: record.status,
            notes: record.notes,
            recordedBy: oid(userId),
            checkInMethod: "manual",
            checkedInAt: record.status === "present" ? new Date() : null,
          },
        },
        { upsert: true, new: true },
      );
      const enrollment = enrollmentMap.get(record.studentId)!;
      if (enrollment.remainingSessions !== null) {
        if (record.status === "present" && previous?.status !== "present")
          enrollment.remainingSessions = Math.max(
            0,
            enrollment.remainingSessions - 1,
          );
        if (record.status !== "present" && previous?.status === "present")
          enrollment.remainingSessions = Math.min(
            enrollment.totalSessions ?? Infinity,
            enrollment.remainingSessions + 1,
          );
        await enrollment.save();
      }
      results.push(saved);
    }
    return { items: results.map(attendanceDto) };
  }

  private async assertRelations(
    clubId: Types.ObjectId,
    coachId?: string | null,
    branchId?: string | null,
  ) {
    if (coachId && !(await this.coaches.exists({ _id: oid(coachId), clubId })))
      throw notFound("COACH_NOT_FOUND");
    if (
      branchId &&
      !(await this.branches.exists({ _id: oid(branchId), clubId }))
    )
      throw notFound("BRANCH_NOT_FOUND");
  }
  private async classDocument(clubId: Types.ObjectId, classId: string) {
    const item = await this.classes.findOne({ _id: oid(classId), clubId });
    if (!item) throw notFound("BUSINESS_CLASS_NOT_FOUND");
    return item;
  }
  private async assertSession(
    clubId: Types.ObjectId,
    classId: string,
    sessionId: string,
  ) {
    const item = await this.sessions.findOne({
      _id: oid(sessionId),
      classId: oid(classId),
      clubId,
    });
    if (!item) throw notFound("CLASS_SESSION_NOT_FOUND");
    return item;
  }
  private async assertCapacity(item: BusinessTrainingClassDocument) {
    const count = await this.enrollments.countDocuments({
      classId: item._id,
      status: "active",
    });
    if (count >= item.capacity)
      throw new AppError(409, "CLASS_CAPACITY_FULL", "Class capacity is full");
  }
  private async syncFutureSessions(item: BusinessTrainingClassDocument) {
    const protectedIds = await this.attendance.distinct("sessionId", {
      classId: item._id,
    });
    await this.sessions.deleteMany({
      classId: item._id,
      startsAt: { $gte: new Date() },
      status: "scheduled",
      _id: { $nin: protectedIds },
    });
    const generated = generateBusinessClassSessions(item);
    if (generated.length) {
      await this.sessions.bulkWrite(
        generated.map((session) => ({
          updateOne: {
            filter: { classId: item._id, startsAt: session.startsAt },
            update: { $setOnInsert: session },
            upsert: true,
          },
        })),
        { ordered: false },
      );
    }
  }
}

type ClassScheduleSource = Pick<
  BusinessTrainingClassDocument,
  | "_id"
  | "clubId"
  | "startDate"
  | "endDate"
  | "schedule"
  | "classModel"
  | "capacity"
>;

export function generateBusinessClassSessions(item: ClassScheduleSource) {
  const result: Array<{
    classId: Types.ObjectId;
    clubId: Types.ObjectId;
    startsAt: Date;
    endsAt: Date;
    capacity: number;
    status: "scheduled";
  }> = [];
  const cursor = new Date(item.startDate);
  const end = new Date(item.endDate);
  while (cursor <= end && result.length < 1000) {
    const date = cursor.toISOString().slice(0, 10);
    const schedules =
      item.classModel === "single"
        ? date === item.startDate.toISOString().slice(0, 10)
          ? item.schedule.slice(0, 1)
          : []
        : item.schedule.filter(
            (entry) => entry.dayOfWeek === cursor.getUTCDay(),
          );
    for (const entry of schedules) {
      const startsAt = new Date(`${date}T${entry.startTime}:00+03:30`);
      result.push({
        classId: item._id,
        clubId: item.clubId,
        startsAt,
        endsAt: new Date(startsAt.valueOf() + entry.durationMinutes * 60_000),
        capacity: item.capacity,
        status: "scheduled",
      });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}
function toClassPersistence(
  clubId: Types.ObjectId,
  input: CreateBusinessClassDto,
) {
  const { model, ...fields } = input;
  return {
    ...fields,
    classModel: model,
    clubId,
    coachProfileId: input.coachProfileId ? oid(input.coachProfileId) : null,
    branchId: input.branchId ? oid(input.branchId) : null,
    startDate: new Date(`${input.startDate}T00:00:00.000Z`),
    endDate: new Date(`${input.endDate}T00:00:00.000Z`),
  };
}
function toClassUpdate(input: UpdateBusinessClassDto) {
  const { model, ...fields } = input;
  return {
    ...fields,
    ...(model ? { classModel: model } : {}),
    ...(input.coachProfileId !== undefined
      ? {
          coachProfileId: input.coachProfileId
            ? oid(input.coachProfileId)
            : null,
        }
      : {}),
    ...(input.branchId !== undefined
      ? { branchId: input.branchId ? oid(input.branchId) : null }
      : {}),
    ...(input.startDate
      ? { startDate: new Date(`${input.startDate}T00:00:00.000Z`) }
      : {}),
    ...(input.endDate
      ? { endDate: new Date(`${input.endDate}T00:00:00.000Z`) }
      : {}),
  };
}
function oid(value: string) {
  if (!Types.ObjectId.isValid(value)) throw notFound("RESOURCE_NOT_FOUND");
  return new Types.ObjectId(value);
}
function notFound(code: string) {
  return new AppError(404, code, "Resource not found");
}
function invalid(code: string) {
  return new AppError(400, code, "Invalid operation");
}
function base(item: {
  _id: Types.ObjectId;
  clubId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: String(item._id),
    clubId: String(item.clubId),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
function classDto(item: BusinessTrainingClassDocument) {
  return {
    ...base(item),
    title: item.title,
    description: item.description,
    sport: item.sport,
    level: item.level,
    model: item.classModel,
    pricingModel: item.pricingModel,
    price: item.price,
    currency: item.currency,
    packageSessionCount: item.packageSessionCount,
    capacity: item.capacity,
    coachProfileId: item.coachProfileId ? String(item.coachProfileId) : null,
    branchId: item.branchId ? String(item.branchId) : null,
    startDate: item.startDate.toISOString().slice(0, 10),
    endDate: item.endDate.toISOString().slice(0, 10),
    schedule: item.schedule,
    visibility: item.visibility,
    enrollmentMode: item.enrollmentMode,
    status: item.status,
  };
}
function sessionDto(item: BusinessClassSessionDocument) {
  return {
    ...base(item),
    classId: String(item.classId),
    startsAt: item.startsAt.toISOString(),
    endsAt: item.endsAt.toISOString(),
    capacity: item.capacity,
    status: item.status,
  };
}
function enrollmentDto(item: BusinessClassEnrollmentDocument) {
  return {
    ...base(item),
    classId: String(item.classId),
    studentId: String(item.studentId),
    status: item.status,
    agreedPrice: item.agreedPrice,
    paymentStatus: item.paymentStatus,
    totalSessions: item.totalSessions,
    remainingSessions: item.remainingSessions,
    enrolledAt: item.enrolledAt.toISOString(),
  };
}
function attendanceDto(item: BusinessClassAttendanceDocument) {
  return {
    ...base(item),
    sessionId: String(item.sessionId),
    classId: String(item.classId),
    studentId: String(item.studentId),
    status: item.status,
    notes: item.notes,
    recordedBy: String(item.recordedBy),
  };
}
