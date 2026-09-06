import { Injectable, Optional } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import { AppError } from "../../common/errors/app.exception";
import {
  toE164IranianPhone,
  toLocalIranianPhone,
} from "../../common/utils/phone.util";
import { ClubsRepository } from "../clubs/clubs.repository";
import { UsersRepository } from "../users/users.repository";
import { AppConfigService } from "../../config/app-config.service";
import { NotificationsService } from "../notifications/notifications.service";
import { UserLocationsService } from "../user-locations/user-locations.service";
import type {
  RecordClassAttendanceDto,
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
  BusinessClassCheckInCredential,
  type BusinessClassCheckInCredentialDocument,
  BusinessCalendarFeed,
  type BusinessCalendarFeedDocument,
  BusinessTrainingClass,
  type BusinessTrainingClassDocument,
} from "./schemas/training-class.schema";

@Injectable()
export class BusinessClassPortalService {
  constructor(
    @InjectModel(BusinessTrainingClass.name)
    private classes: Model<BusinessTrainingClassDocument>,
    @InjectModel(BusinessClassSession.name)
    private sessions: Model<BusinessClassSessionDocument>,
    @InjectModel(BusinessClassEnrollment.name)
    private enrollments: Model<BusinessClassEnrollmentDocument>,
    @InjectModel(BusinessClassAttendance.name)
    private attendance: Model<BusinessClassAttendanceDocument>,
    @InjectModel(BusinessClassCheckInCredential.name)
    private checkInCredentials: Model<BusinessClassCheckInCredentialDocument>,
    @InjectModel(BusinessCalendarFeed.name)
    private calendarFeeds: Model<BusinessCalendarFeedDocument>,
    @InjectModel(ClubStudent.name) private students: Model<ClubStudentDocument>,
    @InjectModel(ClubCoachProfile.name)
    private coaches: Model<ClubCoachProfileDocument>,
    @InjectModel(ClubBranch.name) private branches: Model<ClubBranchDocument>,
    private clubs: ClubsRepository,
    private users: UsersRepository,
    private config: AppConfigService,
    private notifications: NotificationsService,
    @Optional() private userLocations?: UserLocationsService,
  ) {}

  async createClubCalendarFeed(userId: string, clubId: string) {
    await this.clubs.findForOwner(userId, clubId);
    return this.rotateCalendarFeed("club", oid(clubId), oid(userId));
  }

  async createCoachCalendarFeed(userId: string) {
    const hasProfile = await this.coaches.exists({
      userId: oid(userId),
      status: "active",
    });
    if (!hasProfile) throw notFound("COACH_PROFILE_NOT_FOUND");
    return this.rotateCalendarFeed("coach", oid(userId), oid(userId));
  }

  async revokeClubCalendarFeed(userId: string, clubId: string) {
    await this.clubs.findForOwner(userId, clubId);
    return this.revokeCalendarFeed("club", oid(clubId), oid(userId));
  }

  async revokeCoachCalendarFeed(userId: string) {
    const hasProfile = await this.coaches.exists({
      userId: oid(userId),
      status: "active",
    });
    if (!hasProfile) throw notFound("COACH_PROFILE_NOT_FOUND");
    return this.revokeCalendarFeed("coach", oid(userId), oid(userId));
  }

  async renderCalendarFeed(token: string) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const feed = await this.calendarFeeds.findOne({
      tokenHash,
      isActive: true,
    });
    if (!feed) throw notFound("CALENDAR_FEED_NOT_FOUND");

    let classFilter: Record<string, unknown>;
    if (feed.scopeType === "club") {
      classFilter = { clubId: feed.scopeId };
    } else {
      const profiles = await this.coaches.find({
        userId: feed.scopeId,
        status: "active",
      });
      classFilter = {
        coachProfileId: { $in: profiles.map((item) => item._id) },
      };
    }
    const classes = await this.classes.find(classFilter).select({
      title: 1,
      description: 1,
    });
    const byId = new Map(classes.map((item) => [String(item._id), item]));
    const sessions = await this.sessions
      .find({
        classId: { $in: classes.map((item) => item._id) },
        status: "scheduled",
        endsAt: { $gte: new Date(Date.now() - 24 * 60 * 60_000) },
      })
      .sort({ startsAt: 1 })
      .limit(2000);
    const stamp = toIcsDate(new Date());
    const events = sessions.flatMap((session) => {
      const item = byId.get(String(session.classId));
      if (!item) return [];
      return [
        [
          "BEGIN:VEVENT",
          `UID:${session._id}@club4me`,
          `DTSTAMP:${stamp}`,
          `DTSTART:${toIcsDate(session.startsAt)}`,
          `DTEND:${toIcsDate(session.endsAt)}`,
          `SUMMARY:${escapeIcs(item.title)}`,
          `DESCRIPTION:${escapeIcs(item.description || "کلاس ورزشی Club4Me")}`,
          "END:VEVENT",
        ].join("\r\n"),
      ];
    });
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Club4Me//Shared Calendar//FA",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      ...events,
      "END:VCALENDAR",
      "",
    ].join("\r\n");
  }

  private async rotateCalendarFeed(
    scopeType: "club" | "coach",
    scopeId: Types.ObjectId,
    createdBy: Types.ObjectId,
  ) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await this.calendarFeeds.findOneAndUpdate(
      { scopeType, scopeId, createdBy },
      { $set: { tokenHash, isActive: true } },
      { upsert: true, new: true },
    );
    return { token, feedPath: `/api/v1/calendar/feeds/${token}` };
  }

  private async revokeCalendarFeed(
    scopeType: "club" | "coach",
    scopeId: Types.ObjectId,
    createdBy: Types.ObjectId,
  ) {
    const result = await this.calendarFeeds.updateOne(
      { scopeType, scopeId, createdBy, isActive: true },
      { $set: { isActive: false } },
    );
    return { revoked: result.modifiedCount > 0 };
  }

  async generateCoachCheckInCredential(
    userId: string,
    classId: string,
    sessionId: string,
    expiresInMinutes: number,
  ) {
    const session = await this.coachSession(userId, classId, sessionId);
    return this.generateCheckInCredential(userId, session, expiresInMinutes);
  }

  async generateOwnerCheckInCredential(
    userId: string,
    clubId: string,
    classId: string,
    sessionId: string,
    expiresInMinutes: number,
  ) {
    await this.clubs.findForOwner(userId, clubId);
    const session = await this.sessions.findOne({
      _id: oid(sessionId),
      classId: oid(classId),
      clubId: oid(clubId),
    });
    if (!session) throw notFound("CLASS_SESSION_NOT_FOUND");
    return this.generateCheckInCredential(userId, session, expiresInMinutes);
  }

  async checkInAthlete(
    userId: string,
    classId: string,
    sessionId: string,
    credential: string,
  ) {
    const token = await this.checkInCredentials.findOne({
      sessionId: oid(sessionId),
      classId: oid(classId),
      expiresAt: { $gt: new Date() },
      attempts: { $lt: 20 },
    });
    if (!token) throw invalid("CHECKIN_CREDENTIAL_EXPIRED");
    const isCode = /^\d{5}$/.test(credential);
    const candidate = isCode
      ? this.hashCredential(sessionId, credential)
      : this.hashCredential(
          sessionId,
          credential.split(".").at(-1) ?? credential,
        );
    const expected = isCode ? token.codeHash : token.qrHash;
    if (!secureEqual(candidate, expected)) {
      await this.checkInCredentials.updateOne(
        { _id: token._id },
        { $inc: { attempts: 1 } },
      );
      throw invalid("CHECKIN_CREDENTIAL_INVALID");
    }

    const studentIds = await this.linkedStudentIds(userId);
    const enrollment = await this.enrollments.findOne({
      classId: oid(classId),
      studentId: { $in: studentIds },
      status: { $in: ["active", "completed"] },
    });
    if (!enrollment) throw invalid("CHECKIN_REQUIRES_ACTIVE_ENROLLMENT");
    const previous = await this.attendance.findOne({
      sessionId: oid(sessionId),
      studentId: enrollment.studentId,
    });
    const checkedInAt = new Date();
    const record = await this.attendance.findOneAndUpdate(
      { sessionId: oid(sessionId), studentId: enrollment.studentId },
      {
        $set: {
          classId: oid(classId),
          clubId: token.clubId,
          status: "present",
          notes: "",
          recordedBy: oid(userId),
          checkInMethod: isCode ? "code" : "qr",
          checkedInAt,
        },
      },
      { upsert: true, new: true },
    );
    if (
      previous?.status !== "present" &&
      enrollment.remainingSessions !== null
    ) {
      enrollment.remainingSessions = Math.max(
        0,
        enrollment.remainingSessions - 1,
      );
      await enrollment.save();
    }
    return {
      success: true,
      attendanceId: String(record._id),
      method: isCode ? "code" : "qr",
      checkedInAt: checkedInAt.toISOString(),
    };
  }

  private async generateCheckInCredential(
    userId: string,
    session: BusinessClassSessionDocument,
    expiresInMinutes: number,
  ) {
    const code = String(randomInt(0, 100_000)).padStart(5, "0");
    const qrToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60_000);
    await this.checkInCredentials.findOneAndUpdate(
      { sessionId: session._id },
      {
        $set: {
          classId: session.classId,
          clubId: session.clubId,
          codeHash: this.hashCredential(String(session._id), code),
          qrHash: this.hashCredential(String(session._id), qrToken),
          attempts: 0,
          expiresAt,
          createdBy: oid(userId),
        },
      },
      { upsert: true, new: true },
    );
    return {
      code,
      qrPayload: `gym4me-checkin:${String(session._id)}.${qrToken}`,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private hashCredential(sessionId: string, credential: string) {
    return createHmac("sha256", this.config.env.MOCK_PAYMENT_CALLBACK_SECRET)
      .update(`${sessionId}|${credential}`)
      .digest("hex");
  }

  async listPublic(query: Record<string, string | undefined>) {
    const filter: Record<string, unknown> = {
      status: "active",
      visibility: "public",
      endDate: { $gte: new Date(new Date().toISOString().slice(0, 10)) },
    };
    if (query.clubId && Types.ObjectId.isValid(query.clubId))
      filter.clubId = oid(query.clubId);
    if (query.q?.trim()) {
      const pattern = new RegExp(escapeRegex(query.q.trim()), "i");
      filter.$or = [
        { title: pattern },
        { description: pattern },
        { sport: pattern },
        { level: pattern },
      ];
    }
    const documents = await this.classes
      .find(filter)
      .sort({ startDate: 1 })
      .limit(200);
    const items = (
      await Promise.all(documents.map((item) => this.publicDto(item)))
    ).filter(Boolean);
    return { items, total: items.length };
  }

  async getPublic(classId: string) {
    const item = await this.classes.findOne({
      _id: oid(classId),
      status: { $in: ["active", "completed"] },
      visibility: "public",
    });
    if (!item) throw notFound("BUSINESS_CLASS_NOT_FOUND");
    const result = await this.publicDto(item);
    if (!result) throw notFound("BUSINESS_CLASS_NOT_FOUND");
    return result;
  }

  async listForAthlete(userId: string) {
    const studentIds = await this.linkedStudentIds(userId);
    if (!studentIds.length) return { items: [] };
    const records = await this.enrollments
      .find({ studentId: { $in: studentIds }, status: { $ne: "cancelled" } })
      .sort({ enrolledAt: -1 });
    const classes = await this.classes.find({
      _id: { $in: records.map((item) => item.classId) },
    });
    const map = new Map(classes.map((item) => [String(item._id), item]));
    return {
      items: records
        .map((record) => {
          const trainingClass = map.get(String(record.classId));
          return trainingClass
            ? athleteEnrollmentDto(record, trainingClass)
            : null;
        })
        .filter(Boolean),
    };
  }

  async recommendationsForAthlete(userId: string) {
    const studentIds = await this.linkedStudentIds(userId);
    const history = studentIds.length
      ? await this.enrollments
          .find({ studentId: { $in: studentIds } })
          .sort({ enrolledAt: -1 })
          .limit(30)
      : [];
    const historyClasses = await this.classes.find({
      _id: { $in: history.map((item) => item.classId) },
    });
    const sports = new Set(
      historyClasses.map((item) => normalize(item.sport)).filter(Boolean),
    );
    const clubs = new Set(historyClasses.map((item) => String(item.clubId)));
    const defaultLocation = (
      await this.userLocations?.list(userId)
    )?.items.find((item) => item.isDefault);
    const candidates = await this.classes
      .find({
        status: "active",
        visibility: "public",
        endDate: { $gte: new Date() },
        _id: { $nin: history.map((item) => item.classId) },
      })
      .sort({ startDate: 1 })
      .limit(60);
    const ranked = await Promise.all(
      candidates.map(async (item) => {
        const data = await this.publicDto(item);
        if (!data) return null;
        const reasons: string[] = [];
        let score = Math.max(0, 20 - daysUntil(item.startDate));
        if (sports.has(normalize(item.sport))) {
          score += 50;
          reasons.push("هماهنگ با ورزش‌های قبلی شما");
        }
        if (clubs.has(String(item.clubId))) {
          score += 25;
          reasons.push("باشگاهی که قبلاً انتخاب کرده‌اید");
        }
        const location = data.club.location;
        const distanceKm =
          defaultLocation && location
            ? haversineKm(
                defaultLocation.latitude,
                defaultLocation.longitude,
                location.latitude,
                location.longitude,
              )
            : null;
        if (distanceKm !== null) {
          score += Math.max(0, 30 - distanceKm * 2);
          if (distanceKm <= 10) reasons.push("نزدیک به موقعیت پیش‌فرض شما");
        }
        if (data.remainingCapacity > 0) score += 5;
        if (!reasons.length) reasons.push("زمان نزدیک و ظرفیت قابل رزرو");
        return {
          ...data,
          recommendationScore: Math.round(score),
          distanceKm,
          reasons,
        };
      }),
    );
    return {
      items: ranked
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 8),
    };
  }

  async enrollAthlete(userId: string, classId: string) {
    const trainingClass = await this.publicClassDocument(classId);
    const student = await this.ensureStudent(userId, trainingClass.clubId);
    const current = await this.enrollments.findOne({
      classId: trainingClass._id,
      studentId: student._id,
    });
    if (
      current &&
      ["pending", "active", "waitlisted"].includes(current.status)
    ) {
      return athleteEnrollmentDto(current, trainingClass);
    }
    const free = trainingClass.price === 0;
    const status = free
      ? await this.activationStatus(trainingClass)
      : "pending";
    const totalSessions =
      trainingClass.pricingModel === "package"
        ? trainingClass.packageSessionCount
        : null;
    const payload = {
      clubId: trainingClass.clubId,
      classId: trainingClass._id,
      studentId: student._id,
      status,
      agreedPrice: trainingClass.price,
      paymentStatus: free ? "waived" : "pending",
      totalSessions,
      remainingSessions: totalSessions,
      enrolledAt: new Date(),
      waitlistRequestedAt: status === "waitlisted" ? new Date() : null,
      waitlistOfferExpiresAt: null,
      createdBy: oid(userId),
    };
    const saved = current
      ? await this.enrollments.findByIdAndUpdate(
          current._id,
          { $set: payload },
          { new: true },
        )
      : await this.enrollments.create(payload);
    return athleteEnrollmentDto(saved!, trainingClass);
  }

  async resolvePayment(
    userId: string,
    enrollmentId: string,
    result: "approve" | "reject",
  ) {
    await this.athleteEnrollment(userId, enrollmentId);
    return this.finalizeEnrollmentPayment(enrollmentId, result === "approve");
  }

  async payableEnrollment(userId: string, enrollmentId: string) {
    const item = await this.athleteEnrollment(userId, enrollmentId);
    const trainingClass = await this.classes.findById(item.classId);
    if (!trainingClass) throw notFound("BUSINESS_CLASS_NOT_FOUND");
    if (
      item.agreedPrice <= 0 ||
      item.status !== "pending" ||
      item.paymentStatus !== "pending"
    ) {
      throw new AppError(
        409,
        "CLASS_ENROLLMENT_NOT_PAYABLE",
        "Class enrollment is not payable",
      );
    }
    return {
      referenceId: item._id,
      clubId: item.clubId,
      classId: item.classId,
      coachId: trainingClass.coachProfileId,
      sport: trainingClass.sport,
      amount: item.agreedPrice,
      title: trainingClass.title,
    };
  }

  async finalizeEnrollmentPayment(
    enrollmentId: string | Types.ObjectId,
    paid: boolean,
  ) {
    const item = await this.enrollments.findById(enrollmentId);
    if (!item) throw notFound("CLASS_ENROLLMENT_NOT_FOUND");
    const trainingClass = await this.classes.findById(item.classId);
    if (!trainingClass) throw notFound("BUSINESS_CLASS_NOT_FOUND");
    if (paid && item.paymentStatus === "paid") {
      return athleteEnrollmentDto(item, trainingClass);
    }
    if (!paid && item.paymentStatus === "failed") {
      return athleteEnrollmentDto(item, trainingClass);
    }
    if (item.paymentStatus !== "pending") {
      throw invalid("CLASS_ENROLLMENT_PAYMENT_STATUS_CHANGED");
    }
    if (paid) {
      item.paymentStatus = "paid";
      item.status = await this.activationStatus(trainingClass);
    } else {
      item.paymentStatus = "failed";
      item.status = "cancelled";
    }
    await item.save();
    return athleteEnrollmentDto(item, trainingClass);
  }

  async refundEnrollmentPayment(enrollmentId: string | Types.ObjectId) {
    const item = await this.enrollments.findById(enrollmentId);
    if (!item) throw notFound("CLASS_ENROLLMENT_NOT_FOUND");
    const trainingClass = await this.classes.findById(item.classId);
    if (!trainingClass) throw notFound("BUSINESS_CLASS_NOT_FOUND");
    if (item.paymentStatus === "refunded") {
      return athleteEnrollmentDto(item, trainingClass);
    }
    const releasedSeat = item.status === "active";
    item.paymentStatus = "refunded";
    item.status = "cancelled";
    await item.save();
    if (releasedSeat) {
      await this.classes.updateOne(
        { _id: item.classId, activeEnrollmentCount: { $gt: 0 } },
        { $inc: { activeEnrollmentCount: -1 } },
      );
      await this.offerWaitlist(trainingClass);
    }
    return athleteEnrollmentDto(item, trainingClass);
  }

  async cancelEnrollment(userId: string, enrollmentId: string) {
    const item = await this.athleteEnrollment(userId, enrollmentId);
    const trainingClass = await this.classes.findById(item.classId);
    if (!trainingClass) throw notFound("BUSINESS_CLASS_NOT_FOUND");
    const releasedSeat = item.status === "active";
    item.status = "cancelled";
    if (item.paymentStatus === "paid") item.paymentStatus = "refunded";
    await item.save();
    if (releasedSeat) {
      await this.classes.updateOne(
        { _id: trainingClass._id, activeEnrollmentCount: { $gt: 0 } },
        { $inc: { activeEnrollmentCount: -1 } },
      );
      await this.offerWaitlist(trainingClass);
    }
    return athleteEnrollmentDto(item, trainingClass);
  }

  async claimWaitlist(userId: string, enrollmentId: string) {
    const item = await this.athleteEnrollment(userId, enrollmentId);
    if (
      item.status !== "waitlisted" ||
      !item.waitlistOfferExpiresAt ||
      item.waitlistOfferExpiresAt <= new Date()
    ) {
      throw invalid("WAITLIST_OFFER_NOT_AVAILABLE");
    }
    if (!(await this.reserveSeat(item.classId)))
      throw invalid("CLASS_CAPACITY_FULL");
    const activated = await this.enrollments.findOneAndUpdate(
      { _id: item._id, status: "waitlisted" },
      { $set: { status: "active", waitlistOfferExpiresAt: null } },
      { new: true },
    );
    if (!activated) {
      await this.classes.updateOne(
        { _id: item.classId, activeEnrollmentCount: { $gt: 0 } },
        { $inc: { activeEnrollmentCount: -1 } },
      );
      throw invalid("WAITLIST_ALREADY_CLAIMED");
    }
    const trainingClass = await this.classes.findById(item.classId);
    if (!trainingClass) throw notFound("BUSINESS_CLASS_NOT_FOUND");
    return athleteEnrollmentDto(activated, trainingClass);
  }

  async listForCoach(userId: string) {
    const profileIds = await this.linkedCoachProfileIds(userId);
    if (!profileIds.length) return { items: [] };
    const items = await this.classes
      .find({ coachProfileId: { $in: profileIds } })
      .sort({ startDate: -1 });
    return {
      items: await Promise.all(items.map((item) => this.coachClassDto(item))),
    };
  }

  async getForCoach(userId: string, classId: string) {
    const result = await this.coachClassDto(
      await this.coachClass(userId, classId),
      true,
    );
    return { ...result, sessions: result.sessions ?? [] };
  }

  async listCoachEnrollments(userId: string, classId: string) {
    const trainingClass = await this.coachClass(userId, classId);
    const records = await this.enrollments
      .find({ classId: trainingClass._id })
      .sort({ enrolledAt: -1 });
    const students = await this.students.find({
      _id: { $in: records.map((item) => item.studentId) },
    });
    const map = new Map(students.map((item) => [String(item._id), item]));
    return {
      items: records.map((item) =>
        coachEnrollmentDto(item, map.get(String(item.studentId))),
      ),
    };
  }

  async listCoachAttendance(
    userId: string,
    classId: string,
    sessionId: string,
  ) {
    await this.coachSession(userId, classId, sessionId);
    const [records, enrollments] = await Promise.all([
      this.attendance.find({ sessionId: oid(sessionId) }),
      this.enrollments.find({
        classId: oid(classId),
        status: { $in: ["active", "completed"] },
      }),
    ]);
    const students = await this.students.find({
      _id: { $in: enrollments.map((item) => item.studentId) },
    });
    const recordMap = new Map(
      records.map((item) => [String(item.studentId), item]),
    );
    return {
      items: students.map((student) =>
        attendanceDto(recordMap.get(String(student._id)), student),
      ),
    };
  }

  async recordCoachAttendance(
    userId: string,
    classId: string,
    sessionId: string,
    input: RecordClassAttendanceDto,
  ) {
    const session = await this.coachSession(userId, classId, sessionId);
    const valid = await this.enrollments.find({
      classId: oid(classId),
      studentId: { $in: input.items.map((item) => oid(item.studentId)) },
      status: { $in: ["active", "completed"] },
    });
    if (valid.length !== input.items.length)
      throw invalid("ATTENDANCE_REQUIRES_ACTIVE_ENROLLMENT");
    const enrollmentMap = new Map(
      valid.map((item) => [String(item.studentId), item]),
    );
    for (const record of input.items) {
      const previous = await this.attendance.findOne({
        sessionId: session._id,
        studentId: oid(record.studentId),
      });
      await this.attendance.findOneAndUpdate(
        { sessionId: session._id, studentId: oid(record.studentId) },
        {
          $set: {
            clubId: session.clubId,
            classId: session.classId,
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
    }
    return this.listCoachAttendance(userId, classId, sessionId);
  }

  async updateCoachSession(
    userId: string,
    classId: string,
    sessionId: string,
    input: UpdateClassSessionDto,
  ) {
    const item = await this.coachSession(userId, classId, sessionId);
    if (input.startsAt) item.startsAt = new Date(input.startsAt);
    if (input.endsAt) item.endsAt = new Date(input.endsAt);
    if (input.status) item.status = input.status;
    if (item.startsAt >= item.endsAt)
      throw invalid("CLASS_SESSION_TIME_INVALID");
    await item.save();
    return sessionDto(item);
  }

  private async publicClassDocument(classId: string) {
    const item = await this.classes.findOne({
      _id: oid(classId),
      status: "active",
      visibility: "public",
    });
    if (!item) throw notFound("BUSINESS_CLASS_NOT_FOUND");
    await this.clubs.findPublic(String(item.clubId));
    return item;
  }

  private async publicDto(item: BusinessTrainingClassDocument) {
    let club;
    try {
      club = await this.clubs.findPublic(String(item.clubId));
    } catch {
      return null;
    }
    const [coach, branch, enrollmentCount, sessions] = await Promise.all([
      item.coachProfileId ? this.coaches.findById(item.coachProfileId) : null,
      item.branchId ? this.branches.findById(item.branchId) : null,
      this.enrollments.countDocuments({ classId: item._id, status: "active" }),
      this.sessions
        .find({
          classId: item._id,
          status: "scheduled",
          endsAt: { $gte: new Date() },
        })
        .sort({ startsAt: 1 })
        .limit(20),
    ]);
    // Only published coach profiles and reviewed credentials become public.
    const publicCoach =
      coach?.userId && coach.status === "active"
        ? await this.coaches.db
            .collection("coaches")
            .findOne(
              {
                userId: coach.userId,
                reviewStatus: "approved",
                visibility: "public",
              },
              { projection: { _id: 1, slug: 1 } },
            )
        : null;
    const verifiedCredentialsCount = publicCoach
      ? await this.coaches.db
          .collection("coach_sports")
          .countDocuments({
            coachId: publicCoach._id,
            verificationStatus: "verified",
            "certificateMediaIds.0": { $exists: true },
          })
      : 0;
    return {
      ...classBaseDto(item),
      enrollmentCount,
      remainingCapacity: Math.max(0, item.capacity - enrollmentCount),
      club: {
        id: club.id,
        name: club.name,
        slug: club.slug,
        location: club.location
          ? {
              latitude: club.location.latitude,
              longitude: club.location.longitude,
            }
          : null,
      },
      coach:
        coach && coach.status === "active"
          ? {
              id: String(coach._id),
              name: `${coach.firstName} ${coach.lastName}`.trim(),
              profileSlug: publicCoach?.slug ?? null,
              verifiedCredentialsCount,
            }
          : null,
      branch: branch
        ? { id: String(branch._id), name: branch.name, address: branch.address }
        : null,
      sessions: sessions.map(sessionDto),
    };
  }

  private async coachClassDto(
    item: BusinessTrainingClassDocument,
    includeDetails = false,
  ) {
    const [enrollmentCount, sessions, club, branch] = await Promise.all([
      this.enrollments.countDocuments({ classId: item._id, status: "active" }),
      this.sessions.find({ classId: item._id }).sort({ startsAt: 1 }),
      this.clubs.findById(String(item.clubId)),
      item.branchId ? this.branches.findById(item.branchId) : null,
    ]);
    return {
      ...classBaseDto(item),
      enrollmentCount,
      club: { id: club.id, name: club.name },
      branch: branch
        ? { id: String(branch._id), name: branch.name, address: branch.address }
        : null,
      ...(includeDetails ? { sessions: sessions.map(sessionDto) } : {}),
    };
  }

  private async linkedStudentIds(userId: string) {
    const user = await this.users.findDocumentById(userId);
    const phones = phoneVariants(user.phone);
    await this.students.updateMany(
      { userId: null, phone: { $in: phones } },
      { $set: { userId: user._id } },
    );
    return this.students.distinct("_id", { userId: user._id });
  }

  private async ensureStudent(userId: string, clubId: Types.ObjectId) {
    const user = await this.users.findDocumentById(userId);
    const phones = phoneVariants(user.phone);
    let student = await this.students.findOne({
      clubId,
      $or: [{ userId: user._id }, { phone: { $in: phones } }],
    });
    if (student) {
      if (!student.userId) {
        student.userId = user._id;
        await student.save();
      }
      return student;
    }
    return this.students.create({
      clubId,
      userId: user._id,
      phone: user.phone,
      firstName: user.firstName?.trim() || "ورزشکار",
      lastName: user.lastName?.trim() || "باشگاه",
      status: "active",
    });
  }

  private async athleteEnrollment(userId: string, enrollmentId: string) {
    const studentIds = await this.linkedStudentIds(userId);
    const item = await this.enrollments.findOne({
      _id: oid(enrollmentId),
      studentId: { $in: studentIds },
    });
    if (!item) throw notFound("CLASS_ENROLLMENT_NOT_FOUND");
    return item;
  }

  private async linkedCoachProfileIds(userId: string) {
    const user = await this.users.findDocumentById(userId);
    await this.coaches.updateMany(
      { userId: null, phone: { $in: phoneVariants(user.phone) } },
      { $set: { userId: user._id } },
    );
    return this.coaches.distinct("_id", { userId: user._id, status: "active" });
  }

  private async coachClass(userId: string, classId: string) {
    const profileIds = await this.linkedCoachProfileIds(userId);
    const item = await this.classes.findOne({
      _id: oid(classId),
      coachProfileId: { $in: profileIds },
    });
    if (!item) throw notFound("BUSINESS_CLASS_NOT_FOUND");
    return item;
  }

  private async coachSession(
    userId: string,
    classId: string,
    sessionId: string,
  ) {
    await this.coachClass(userId, classId);
    const item = await this.sessions.findOne({
      _id: oid(sessionId),
      classId: oid(classId),
    });
    if (!item) throw notFound("CLASS_SESSION_NOT_FOUND");
    return item;
  }

  private async activationStatus(
    item: BusinessTrainingClassDocument,
  ): Promise<"pending" | "active" | "waitlisted"> {
    if (item.enrollmentMode === "requires_approval") return "pending";
    return (await this.reserveSeat(item._id)) ? "active" : "waitlisted";
  }

  private async reserveSeat(classId: Types.ObjectId) {
    return this.classes.findOneAndUpdate(
      {
        _id: classId,
        $expr: {
          $lt: [{ $ifNull: ["$activeEnrollmentCount", 0] }, "$capacity"],
        },
      },
      { $inc: { activeEnrollmentCount: 1 } },
      { new: true },
    );
  }

  private async offerWaitlist(item: BusinessTrainingClassDocument) {
    const waiting = await this.enrollments
      .find({ classId: item._id, status: "waitlisted" })
      .sort({ waitlistRequestedAt: 1, enrolledAt: 1 });
    if (!waiting.length) return;
    const expiresAt = new Date(Date.now() + 15 * 60_000);
    await this.enrollments.updateMany(
      { _id: { $in: waiting.map((entry) => entry._id) } },
      { $set: { waitlistOfferExpiresAt: expiresAt } },
    );
    const students = await this.students.find({
      _id: { $in: waiting.map((entry) => entry.studentId) },
      userId: { $ne: null },
    });
    const byId = new Map(
      students.map((student) => [String(student._id), student]),
    );
    for (const entry of waiting) {
      const student = byId.get(String(entry.studentId));
      if (student?.userId) {
        await this.notifications.notifyWaitlistSeatAvailable({
          userId: student.userId,
          classId: item._id,
          title: item.title,
        });
      }
    }
  }
}

function oid(value: string) {
  if (!Types.ObjectId.isValid(value)) throw notFound("RESOURCE_NOT_FOUND");
  return new Types.ObjectId(value);
}
function phoneVariants(phone: string) {
  return [
    ...new Set([phone, toE164IranianPhone(phone), toLocalIranianPhone(phone)]),
  ];
}
function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("fa-IR");
}

function daysUntil(value: Date) {
  return Math.max(0, Math.floor((value.getTime() - Date.now()) / 86_400_000));
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (degree: number) => (degree * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toIcsDate(value: Date) {
  return value
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
function notFound(code: string) {
  return new AppError(404, code, "Resource not found");
}
function invalid(code: string) {
  return new AppError(400, code, "Invalid operation");
}

function secureEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
function classBaseDto(item: BusinessTrainingClassDocument) {
  return {
    id: String(item._id),
    slug: String(item._id),
    clubId: String(item.clubId),
    title: item.title,
    description: item.description,
    faqs: item.faqs ?? [],
    sport: item.sport,
    level: item.level,
    model: item.classModel,
    pricingModel: item.pricingModel,
    price: item.price,
    currency: item.currency,
    packageSessionCount: item.packageSessionCount,
    capacity: item.capacity,
    startDate: item.startDate.toISOString(),
    endDate: item.endDate.toISOString(),
    schedule: item.schedule,
    visibility: item.visibility,
    enrollmentMode: item.enrollmentMode,
    status: item.status,
  };
}
function sessionDto(item: BusinessClassSessionDocument) {
  return {
    id: String(item._id),
    classId: String(item.classId),
    startsAt: item.startsAt.toISOString(),
    endsAt: item.endsAt.toISOString(),
    capacity: item.capacity,
    status: item.status,
  };
}
function athleteEnrollmentDto(
  item: BusinessClassEnrollmentDocument,
  trainingClass: BusinessTrainingClassDocument,
) {
  return {
    id: String(item._id),
    classId: String(item.classId),
    title: trainingClass.title,
    sport: trainingClass.sport,
    startDate: trainingClass.startDate.toISOString(),
    endDate: trainingClass.endDate.toISOString(),
    status: item.status,
    paymentStatus: item.paymentStatus,
    agreedPrice: item.agreedPrice,
    remainingSessions: item.remainingSessions,
    enrolledAt: item.enrolledAt.toISOString(),
  };
}
function coachEnrollmentDto(
  item: BusinessClassEnrollmentDocument,
  student?: ClubStudentDocument,
) {
  return {
    id: String(item._id),
    studentId: String(item.studentId),
    student: student
      ? {
          name: `${student.firstName} ${student.lastName}`.trim(),
          phone: student.phone,
        }
      : null,
    status: item.status,
    paymentStatus: item.paymentStatus,
    agreedPrice: item.agreedPrice,
    remainingSessions: item.remainingSessions,
  };
}
function attendanceDto(
  item: BusinessClassAttendanceDocument | undefined,
  student: ClubStudentDocument,
) {
  return {
    studentId: String(student._id),
    student: {
      name: `${student.firstName} ${student.lastName}`.trim(),
      phone: student.phone,
    },
    status: item?.status ?? "unrecorded",
    notes: item?.notes ?? "",
  };
}
