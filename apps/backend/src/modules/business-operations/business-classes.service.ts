import { MediaService } from "../media/media.service";
import { withMediaReferences } from "../media/media-references";
import {
  withReferenceSummaries,
  classDisplayReferences,
  studentDisplayReference,
} from "../../common/utils/reference-summaries";
import { coachClassScope, assertCoachClassScope } from "./coach-class-scope";
import { ClassBillingService } from "./class-billing.service";
import {
  attendanceCredit,
  attendanceAudit,
  attendanceTimes,
} from "./attendance-credit";
import type { ClubPermission } from "../clubs/club-permissions";
import { Injectable, Optional } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Atomic } from "../../infrastructure/database/atomic-operation";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
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
    private billing: ClassBillingService,
    @Optional() private moduleRef?: ModuleRef,
    @InjectConnection() private readonly connection?: Connection,
    @Optional() private readonly media?: MediaService,
  ) {}

  private async present<T extends Record<string, unknown>>(rows: T[]) {
    const items = await withReferenceSummaries(this.classes.db, rows, [
      ...classDisplayReferences.filter(ref => ref.field !== "sportId"),
      {field: "classId", as: "trainingClass", collection: "business_training_classes", fields: ["title"]},
    ]);
    return this.media ? withMediaReferences(this.media, items) : items;
  }

  private async club(
    ownerId: string,
    clubId: string,
    permission?: ClubPermission,
  ) {
    await this.clubs.findForOwner(ownerId, clubId, permission);
    return oid(clubId);
  }

  private async enrollmentResponse(
    userId: string,
    clubId: string,
    item: BusinessClassEnrollmentDocument,
  ) {
    const canReadAmounts = await this.clubs.hasPermission(
      userId,
      clubId,
      "payments.read",
    );
    return {
      ...enrollmentDto(item),
      agreedPrice: canReadAmounts ? item.agreedPrice : null,
    };
  }

  async list(ownerId: string, clubId: string) {
    const id = await this.club(ownerId, clubId, "classes.read");
    const items = await this.classes
      .find({
        clubId: id,
        ...(await coachClassScope(this.classes.db, ownerId, clubId)),
      })
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
      items: await this.present(
        items.map((item) => ({
          ...classDto(item),
          enrollmentCount: countMap.get(String(item._id)) ?? 0,
        })),
      ),
    };
  }

  async get(ownerId: string, clubId: string, classId: string) {
    const id = await this.club(ownerId, clubId, "classes.read");
    await assertCoachClassScope(this.classes.db, ownerId, clubId, classId);
    const item = await this.classDocument(id, classId);
    const [enrollmentCount, sessionCount] = await Promise.all([
      this.enrollments.countDocuments({ classId: item._id, status: "active" }),
      this.sessions.countDocuments({ classId: item._id }),
    ]);
    return (
      await this.present([{ ...classDto(item), enrollmentCount, sessionCount }])
    )[0]!;
  }

  async create(ownerId: string, clubId: string, input: CreateBusinessClassDto) {
    const id = await this.club(ownerId, clubId, "classes.write");
    await this.assertRelations(id, input.coachProfileId, input.branchId);
    const item = await this.classes.create(toClassPersistence(id, input));
    try {
      await this.syncFutureSessions(item);
    } catch (error) {
      item.status = "draft";
      item.scheduleError =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : "SESSION_GENERATION_FAILED";
      await item.save();
    }
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
    const id = await this.club(ownerId, clubId, "classes.write");
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
      if (input.capacity < activeCount + (item.pendingEnrollmentCount ?? 0))
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
      try {
        await this.syncFutureSessions(item);
        item.scheduleError = null;
        await item.save();
      } catch (error) {
        item.status = "draft";
        item.scheduleError =
          error instanceof Error
            ? error.message.slice(0, 1000)
            : "SESSION_GENERATION_FAILED";
        await item.save();
      }
    return this.get(ownerId, clubId, classId);
  }

  async regenerate(ownerId: string, clubId: string, classId: string) {
    const id = await this.club(ownerId, clubId, "classes.write");
    const item = await this.classDocument(id, classId);
    await this.syncFutureSessions(item);
    return this.listSessions(ownerId, clubId, classId);
  }

  async listSessions(ownerId: string, clubId: string, classId: string) {
    const id = await this.club(ownerId, clubId, "classes.read");
    await assertCoachClassScope(this.classes.db, ownerId, clubId, classId);
    const item = await this.classDocument(id, classId);
    const items = await this.sessions
      .find({ classId: item._id })
      .sort({ startsAt: 1 });
    return { items: await this.present(items.map(sessionDto)) };
  }

  async listCalendarSessions(
    ownerId: string,
    clubId: string,
    from?: string,
    to?: string,
  ) {
    const id = await this.club(ownerId, clubId, "classes.read");
    const startsAt: { $gte?: Date; $lt?: Date } = {};
    if (from) {
      const parsed = new Date(from);
      if (Number.isNaN(parsed.getTime()))
        throw invalid("CALENDAR_RANGE_INVALID");
      startsAt.$gte = parsed;
    }
    if (to) {
      const parsed = new Date(to);
      if (Number.isNaN(parsed.getTime()))
        throw invalid("CALENDAR_RANGE_INVALID");
      startsAt.$lt = parsed;
    }
    if (
      startsAt.$gte &&
      startsAt.$lt &&
      startsAt.$gte.getTime() >= startsAt.$lt.getTime()
    )
      throw invalid("CALENDAR_RANGE_INVALID");

    const visibleClasses = await this.classes
      .find({
        clubId: id,
        ...(await coachClassScope(this.classes.db, ownerId, clubId)),
      })
      .select({ _id: 1 });
    const items = await this.sessions
      .find({
        clubId: id,
        classId: { $in: visibleClasses.map((item) => item._id) },
        ...(Object.keys(startsAt).length ? { startsAt } : {}),
      })
      .sort({ startsAt: 1 })
      .limit(2500);
    const classes = await this.classes
      .find({ _id: { $in: items.map((item) => item.classId) }, clubId: id })
      .select({ title: 1 });
    const titles = new Map(
      classes.map((item) => [String(item._id), item.title]),
    );
    return {
      items: items.map((item) => ({
        ...sessionDto(item),
        classTitle: titles.get(String(item.classId)) ?? "کلاس",
      })),
    };
  }

  async updateSession(
    ownerId: string,
    clubId: string,
    classId: string,
    sessionId: string,
    input: UpdateClassSessionDto,
  ) {
    const id = await this.club(ownerId, clubId, "classes.write");
    await this.classDocument(id, classId);
    const item = await this.sessions.findOne({
      _id: oid(sessionId),
      classId: oid(classId),
      clubId: id,
    });
    if (!item) throw notFound("CLASS_SESSION_NOT_FOUND");
    const preview = await this.buildSessionChangePreview(id, item, input);
    if (preview.conflicts.length)
      throw new AppError(
        409,
        "CLASS_SESSION_CONFLICT",
        "زمان انتخاب‌شده با برنامه دیگری تداخل دارد",
        preview,
      );
    if ((input.scope ?? "single") === "future") {
      const deltaStart = preview.startsAt.getTime() - item.startsAt.getTime();
      const deltaEnd = preview.endsAt.getTime() - item.endsAt.getTime();
      const future = await this.sessions
        .find({
          classId: item.classId,
          startsAt: { $gte: item.startsAt },
          status: "scheduled",
        })
        .sort({ startsAt: 1 });
      for (const session of future) {
        session.startsAt = new Date(session.startsAt.getTime() + deltaStart);
        session.endsAt = new Date(session.endsAt.getTime() + deltaEnd);
        if (input.status) session.status = input.status;
        await session.save();
      }
      return {
        ...sessionDto((await this.sessions.findById(item._id))!),
        affectedCount: future.length,
      };
    }
    item.startsAt = preview.startsAt;
    item.endsAt = preview.endsAt;
    if (input.status) item.status = input.status;
    await item.save();
    return { ...sessionDto(item), affectedCount: 1 };
  }

  async previewSessionChange(
    ownerId: string,
    clubId: string,
    classId: string,
    sessionId: string,
    input: UpdateClassSessionDto,
  ) {
    const id = await this.club(ownerId, clubId, "classes.write");
    await this.classDocument(id, classId);
    const item = await this.sessions.findOne({
      _id: oid(sessionId),
      classId: oid(classId),
      clubId: id,
    });
    if (!item) throw notFound("CLASS_SESSION_NOT_FOUND");
    const preview = await this.buildSessionChangePreview(id, item, input);
    const affectedCount =
      (input.scope ?? "single") === "future"
        ? await this.sessions.countDocuments({
            classId: item.classId,
            startsAt: { $gte: item.startsAt },
            status: "scheduled",
          })
        : 1;
    return {
      startsAt: preview.startsAt.toISOString(),
      endsAt: preview.endsAt.toISOString(),
      affectedCount,
      conflicts: preview.conflicts,
    };
  }

  private async buildSessionChangePreview(
    clubId: Types.ObjectId,
    item: BusinessClassSessionDocument,
    input: UpdateClassSessionDto,
  ) {
    const startsAt = input.startsAt ? new Date(input.startsAt) : item.startsAt;
    const endsAt = input.endsAt ? new Date(input.endsAt) : item.endsAt;
    if (startsAt >= endsAt) throw invalid("CLASS_SESSION_TIME_INVALID");
    const [classConflicts, reservableConflicts] = await Promise.all([
      this.sessions
        .find({
          _id: { $ne: item._id },
          clubId,
          status: "scheduled",
          startsAt: { $lt: endsAt },
          endsAt: { $gt: startsAt },
        })
        .select("classId startsAt endsAt")
        .lean(),
      this.connection!.collection("reservable_sessions")
        .find({
          clubId,
          status: "active",
          startsAt: { $lt: endsAt },
          endsAt: { $gt: startsAt },
        })
        .project({ title: 1, startsAt: 1, endsAt: 1 })
        .limit(20)
        .toArray(),
    ]);
    return {
      startsAt,
      endsAt,
      conflicts: [
        ...classConflicts.map((value) => ({
          source: "class" as const,
          id: String(value._id),
          title: "جلسه کلاس",
          startsAt: value.startsAt.toISOString(),
          endsAt: value.endsAt.toISOString(),
        })),
        ...reservableConflicts.map((value) => ({
          source: "reservable" as const,
          id: String(value._id),
          title: String(value.title ?? "سانس رزروپذیر"),
          startsAt: new Date(value.startsAt as Date).toISOString(),
          endsAt: new Date(value.endsAt as Date).toISOString(),
        })),
      ],
    };
  }

  async listEnrollments(ownerId: string, clubId: string, classId: string) {
    const id = await this.club(ownerId, clubId, "enrollments.read");
    await assertCoachClassScope(this.classes.db, ownerId, clubId, classId);
    await this.classDocument(id, classId);
    const items = await this.enrollments
      .find({ classId: oid(classId) })
      .sort({ enrolledAt: -1 });
    const students = await this.students
      .find({ _id: { $in: items.map((item) => item.studentId) }, clubId: id })
      .select("firstName lastName");
    const names = new Map(
      students.map((student) => [
        String(student._id),
        `${student.firstName} ${student.lastName}`,
      ]),
    );
    const canReadAmounts = await this.clubs.hasPermission(
      ownerId,
      clubId,
      "payments.read",
    );
    return {
      items: items.map((item) => ({
        ...enrollmentDto(item),
        agreedPrice: canReadAmounts ? item.agreedPrice : null,
        studentName: names.get(String(item.studentId)) ?? "",
        student:
          students
            .filter((student) => String(student._id) === String(item.studentId))
            .map((student) => ({
              id: String(student._id),
              firstName: student.firstName,
              lastName: student.lastName,
            }))[0] ?? null,
      })),
    };
  }

  @Atomic("enrollments")
  async enroll(
    ownerId: string,
    clubId: string,
    classId: string,
    userId: string,
    input: CreateClassEnrollmentDto,
  ) {
    const id = await this.club(ownerId, clubId, "enrollments.write");
    const trainingClass = await this.classDocument(id, classId);
    const contractSessions =
      trainingClass.pricingModel === "package"
        ? trainingClass.packageSessionCount
        : null;
    if (
      input.agreedPrice !== trainingClass.price ||
      input.paymentStatus !== "pending" ||
      (input.totalSessions !== null && input.totalSessions !== contractSessions)
    ) {
      await this.clubs.findForOwner(ownerId, clubId, "payments.write");
    }
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
    if (current && ["pending", "active", "waitlisted"].includes(current.status))
      throw new AppError(
        409,
        "STUDENT_ALREADY_ENROLLED",
        "Student is already enrolled",
      );
    if (
      current &&
      (current.billingMode === "ledger" ||
        ["paid", "partial"].includes(current.paymentStatus))
    )
      throw invalid("PREVIOUS_ENROLLMENT_REQUIRES_FINANCIAL_REVIEW");
    if (!Number.isSafeInteger(input.agreedPrice))
      throw invalid("INVALID_PRICE");
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
    await this.billing.initialize(item!, userId, input.paymentStatus);
    return this.enrollmentResponse(ownerId, clubId, item!);
  }

  @Atomic("enrollments")
  async updateEnrollment(
    ownerId: string,
    clubId: string,
    classId: string,
    enrollmentId: string,
    input: UpdateClassEnrollmentDto,
  ) {
    const id = await this.club(ownerId, clubId, "enrollments.write");
    const trainingClass = await this.classDocument(id, classId);
    const item = await this.enrollments.findOne({
      _id: oid(enrollmentId),
      classId: trainingClass._id,
    });
    if (!item) throw notFound("CLASS_ENROLLMENT_NOT_FOUND");
    if (
      (input.paymentStatus !== undefined &&
        input.paymentStatus !== item.paymentStatus) ||
      (input.agreedPrice !== undefined &&
        input.agreedPrice !== item.agreedPrice) ||
      input.remainingSessions !== undefined ||
      (input.status === "cancelled" &&
        ["paid", "partial", "waived"].includes(item.paymentStatus))
    ) {
      await this.clubs.findForOwner(ownerId, clubId, "payments.write");
    }
    if (
      item.paymentExpiresAt &&
      input.paymentStatus &&
      input.paymentStatus !== item.paymentStatus
    ) {
      throw invalid("ONLINE_PAYMENT_MANAGED_BY_COMMERCE");
    }
    if (item.paymentSeatHeld && input.status === "active")
      throw invalid("PAYMENT_REQUIRED");
    if (
      item.paymentExpiresAt &&
      item.paymentStatus === "paid" &&
      input.status === "cancelled"
    ) {
      const { CommerceService } = await import("../commerce/commerce.service");
      await this.moduleRef!.get(CommerceService, {
        strict: false,
      }).refundBusinessClass(item._id, item.agreedPrice);
      return this.enrollmentResponse(
        ownerId,
        clubId,
        (await this.enrollments.findById(item._id))!,
      );
    }
    if (item.paymentSeatHeld && input.status && input.status !== "pending") {
      await this.classes.updateOne(
        { _id: item.classId, pendingEnrollmentCount: { $gt: 0 } },
        { $inc: { pendingEnrollmentCount: -1 } },
      );
      item.paymentSeatHeld = false;
    }
    if (input.status === "active" && item.status !== "active")
      await this.assertCapacity(trainingClass);
    const wasActive = item.status === "active";
    await this.billing.changeTerms(
      item,
      ownerId,
      input.agreedPrice,
      input.paymentStatus,
    );
    const {
      agreedPrice: _price,
      paymentStatus: _paymentStatus,
      ...operational
    } = input;
    Object.assign(item, operational);
    await item.save();
    const isActive = item.status === "active";
    if (wasActive !== isActive) {
      await this.classes.updateOne(
        { _id: trainingClass._id },
        { $inc: { activeEnrollmentCount: isActive ? 1 : -1 } },
      );
    }
    return this.enrollmentResponse(ownerId, clubId, item);
  }

  @Atomic("enrollments")
  async transfer(
    ownerId: string,
    clubId: string,
    classId: string,
    enrollmentId: string,
    targetClassId: string,
    userId: string,
  ) {
    const id = await this.club(ownerId, clubId, "enrollments.write");
    await this.classDocument(id, classId);
    const target = await this.classDocument(id, targetClassId);
    const source = await this.enrollments.findOne({
      _id: oid(enrollmentId),
      classId: oid(classId),
      status: { $in: ["active", "waitlisted"] },
    });
    if (!source) throw notFound("CLASS_ENROLLMENT_NOT_FOUND");
    if (
      source.paymentExpiresAt &&
      ["paid", "partial", "waived"].includes(source.paymentStatus)
    )
      throw invalid("PAID_CLASS_TRANSFER_REQUIRES_REFUND");
    if (
      source.billingMode === "ledger" ||
      ["paid", "partial", "waived"].includes(source.paymentStatus)
    )
      await this.clubs.findForOwner(ownerId, clubId, "payments.write");
    if (String(target._id) === String(source.classId))
      throw invalid("SAME_CLASS_TRANSFER");
    const activeCount = await this.enrollments.countDocuments({
      classId: target._id,
      status: "active",
    });
    const status =
      activeCount + (target.pendingEnrollmentCount ?? 0) < target.capacity
        ? "active"
        : "waitlisted";
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
    if (existing?.billingMode === "ledger")
      throw invalid("PREVIOUS_ENROLLMENT_REQUIRES_FINANCIAL_REVIEW");
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
    await this.billing.transferAccount(source, moved!, userId);
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
    return this.enrollmentResponse(ownerId, clubId, moved!);
  }

  async listAttendance(
    ownerId: string,
    clubId: string,
    classId: string,
    sessionId: string,
  ) {
    const id = await this.club(ownerId, clubId, "attendance.read");
    await assertCoachClassScope(this.classes.db, ownerId, clubId, classId);
    await this.assertSession(id, classId, sessionId);
    const items = await this.attendance.find({ sessionId: oid(sessionId) });
    return {
      items: await withReferenceSummaries(this.classes.db,
        items.map(attendanceDto),
        [
          studentDisplayReference,
          {
            field: "recordedBy",
            as: "recorder",
            collection: "users",
            fields: ["firstName", "lastName"],
          },
        ],
      ),
    };
  }

  @Atomic("enrollments")
  async recordAttendance(
    ownerId: string,
    clubId: string,
    classId: string,
    sessionId: string,
    userId: string,
    input: RecordClassAttendanceDto,
  ) {
    const id = await this.club(ownerId, clubId, "attendance.write");
    await assertCoachClassScope(this.classes.db, ownerId, clubId, classId);
    const session = await this.assertSession(id, classId, sessionId);
    if (session.status === "cancelled")
      throw invalid("CLASS_SESSION_CANCELLED");
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
      const enrollment = enrollmentMap.get(record.studentId)!;
      const remaining = attendanceCredit(
        enrollment.remainingSessions,
        enrollment.totalSessions,
        previous?.status,
        record.status,
      );
      const saved = await this.attendance.findOneAndUpdate(
        { sessionId: session._id, studentId: oid(record.studentId) },
        {
          ...attendanceAudit(
            userId,
            previous?.status,
            record.status,
            enrollment.remainingSessions,
            remaining,
            record.checkedOut && !previous?.checkedOutAt
              ? "checked_out"
              : undefined,
          ),
          $set: {
            clubId: id,
            classId: oid(classId),
            status: record.status,
            notes: record.notes,
            recordedBy: oid(userId),
            ...attendanceTimes(previous, record.status, record.checkedOut),
          },
        },
        { upsert: true, new: true },
      );
      if (remaining !== enrollment.remainingSessions) {
        enrollment.remainingSessions = remaining;
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
    if (count + (item.pendingEnrollmentCount ?? 0) >= item.capacity)
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
    coverMediaId: input.coverMediaId ? oid(input.coverMediaId) : null,
    galleryMediaIds: (input.galleryMediaIds ?? []).map(oid),
    requiredEquipmentIds: (input.requiredEquipmentIds ?? []).map(oid),
    amenityIds: (input.amenityIds ?? []).map(oid),
    registrationStartAt: input.registrationStartAt
      ? new Date(input.registrationStartAt)
      : null,
    registrationEndAt: input.registrationEndAt
      ? new Date(input.registrationEndAt)
      : null,
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
    ...(input.coverMediaId !== undefined
      ? { coverMediaId: input.coverMediaId ? oid(input.coverMediaId) : null }
      : {}),
    ...(input.galleryMediaIds
      ? { galleryMediaIds: input.galleryMediaIds.map(oid) }
      : {}),
    ...(input.requiredEquipmentIds
      ? { requiredEquipmentIds: input.requiredEquipmentIds.map(oid) }
      : {}),
    ...(input.amenityIds ? { amenityIds: input.amenityIds.map(oid) } : {}),
    ...(input.registrationStartAt !== undefined
      ? {
          registrationStartAt: input.registrationStartAt
            ? new Date(input.registrationStartAt)
            : null,
        }
      : {}),
    ...(input.registrationEndAt !== undefined
      ? {
          registrationEndAt: input.registrationEndAt
            ? new Date(input.registrationEndAt)
            : null,
        }
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
    faqs: item.faqs ?? [],
    sport: item.sport,
    level: item.level,
    skillLevelId: item.skillLevelId ? String(item.skillLevelId) : null,
    model: item.classModel,
    pricingModel: item.pricingModel,
    price: item.price,
    currency: item.currency,
    packageSessionCount: item.packageSessionCount,
    capacity: item.capacity,
    coachProfileId: item.coachProfileId ? String(item.coachProfileId) : null,
    branchId: item.branchId ? String(item.branchId) : null,
    coverMediaId: item.coverMediaId ? String(item.coverMediaId) : null,
    galleryMediaIds: (item.galleryMediaIds ?? []).map(String),
    prerequisites: item.prerequisites ?? [],
    requiredEquipmentIds: (item.requiredEquipmentIds ?? []).map(String),
    amenityIds: (item.amenityIds ?? []).map(String),
    minAge: item.minAge ?? null,
    maxAge: item.maxAge ?? null,
    registrationStartAt: item.registrationStartAt?.toISOString() ?? null,
    registrationEndAt: item.registrationEndAt?.toISOString() ?? null,
    scheduleError: item.scheduleError ?? null,
    readiness: {
      ready: classReadinessIssues(item).length === 0,
      missing: classReadinessIssues(item),
    },
    startDate: item.startDate.toISOString().slice(0, 10),
    endDate: item.endDate.toISOString().slice(0, 10),
    schedule: item.schedule,
    visibility: item.visibility,
    enrollmentMode: item.enrollmentMode,
    status: item.status,
  };
}
function classReadinessIssues(value: {
  title?: string;
  description?: string;
  skillLevelId?: unknown;
  minAge?: number | null;
  maxAge?: number | null;
  branchId?: unknown;
  coverMediaId?: unknown;
  galleryMediaIds?: unknown[];
  schedule?: unknown[];
}) {
  return [
    !value.title?.trim() && "title",
    !value.description?.trim() && "description",
    !value.skillLevelId && "skillLevelId",
    value.minAge == null && "minAge",
    value.maxAge == null && "maxAge",
    !value.branchId && "branchId",
    !value.coverMediaId && !value.galleryMediaIds?.length && "media",
    !value.schedule?.length && "schedule",
  ].filter((item): item is string => Boolean(item));
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
    changes: item.changes ?? [],
    notes: item.notes,
    recordedBy: String(item.recordedBy),
    checkInMethod: item.checkInMethod,
    checkedInAt: item.checkedInAt?.toISOString() ?? null,
    checkedOutAt: item.checkedOutAt?.toISOString() ?? null,
  };
}
