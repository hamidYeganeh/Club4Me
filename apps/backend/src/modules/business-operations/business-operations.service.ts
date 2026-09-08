import { createHash } from "node:crypto";
import { ClassBillingService, receiptDto } from "./class-billing.service";
import { membershipWeekKey } from "../commerce/membership-week";
import type { ClubPermission } from "../clubs/club-permissions";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import ExcelJS from "exceljs";
import { AppError } from "../../common/errors/app.exception";
import { toE164IranianPhone } from "../../common/utils/phone.util";
import { ClubsRepository } from "../clubs/clubs.repository";
import { UsersRepository } from "../users/users.repository";
import {
  CreateBranchDto,
  CreateCoachDto,
  CreatePaymentDto,
  CreateStudentDto,
  UpdateBranchDto,
  UpdateCoachDto,
  UpdateStudentDto,
  UpsertAttendanceDto,
  ImportOperationsDto,
} from "./business-operations.dto";
import {
  ClubAttendance,
  type ClubAttendanceDocument,
} from "./schemas/attendance.schema";
import { ClubBranch, type ClubBranchDocument } from "./schemas/branch.schema";
import {
  ClubCoachProfile,
  type ClubCoachProfileDocument,
} from "./schemas/coach.schema";
import {
  ClubManualPayment,
  type ClubManualPaymentDocument,
} from "./schemas/payment.schema";
import {
  ClubStudent,
  type ClubStudentDocument,
} from "./schemas/student.schema";
import {
  BusinessClassAttendance,
  type BusinessClassAttendanceDocument,
  BusinessTrainingClass,
  type BusinessTrainingClassDocument,
} from "./schemas/training-class.schema";

@Injectable()
export class BusinessOperationsService {
  constructor(
    @InjectModel(ClubStudent.name) private students: Model<ClubStudentDocument>,
    @InjectModel(ClubCoachProfile.name)
    private coaches: Model<ClubCoachProfileDocument>,
    @InjectModel(ClubManualPayment.name)
    private payments: Model<ClubManualPaymentDocument>,
    @InjectModel(ClubAttendance.name)
    private attendance: Model<ClubAttendanceDocument>,
    @InjectModel(ClubBranch.name) private branches: Model<ClubBranchDocument>,
    @InjectModel(BusinessTrainingClass.name)
    private classes: Model<BusinessTrainingClassDocument>,
    @InjectModel(BusinessClassAttendance.name)
    private classAttendance: Model<BusinessClassAttendanceDocument>,
    private clubs: ClubsRepository,
    private users: UsersRepository,
    private billing: ClassBillingService,
  ) {}

  private async club(
    ownerId: string,
    clubId: string,
    permission?: ClubPermission,
  ) {
    await this.clubs.findForOwner(ownerId, clubId, permission);
    return oid(clubId);
  }

  async authorizeExport(ownerId: string, clubId: string) {
    await this.club(ownerId, clubId);
  }

  async exportData(
    ownerId: string,
    clubId: string,
    kind = "students",
    format = "csv",
  ) {
    const id = await this.club(ownerId, clubId);
    if (kind === "students") {
      const rows = await this.students
        .find({ clubId: id })
        .sort({ createdAt: 1 });
      return exportResult(
        kind,
        [
          "firstName",
          "lastName",
          "phone",
          "sport",
          "membershipTitle",
          "membershipEndsAt",
          "status",
          "notes",
        ],
        rows.map((row) => ({
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          sport: row.sport,
          membershipTitle: row.membershipTitle,
          membershipEndsAt: row.membershipEndsAt?.toISOString() ?? "",
          status: row.status,
          notes: row.notes,
        })),
        format,
      );
    }
    if (kind === "payments") {
      const rows = await this.payments.find({ clubId: id }).sort({ paidAt: 1 });
      return exportResult(
        kind,
        [
          "receiptId",
          "enrollmentId",
          "voidedAt",
          "refundedAmount",
          "netAmount",
          "recordedBy",
          "studentId",
          "type",
          "title",
          "amount",
          "currency",
          "paidAt",
          "method",
          "notes",
        ],
        rows.map((row) => ({
          receiptId: String(row._id),
          enrollmentId: row.enrollmentId ? String(row.enrollmentId) : "",
          voidedAt: row.voidedAt?.toISOString() ?? "",
          refundedAmount: row.refundedAmount ?? 0,
          netAmount: row.voidedAt ? 0 : row.amount - (row.refundedAmount ?? 0),
          recordedBy: String(row.recordedBy),
          studentId: String(row.studentId),
          type: row.type,
          title: row.title,
          amount: row.amount,
          currency: row.currency,
          paidAt: row.paidAt.toISOString(),
          method: row.method,
          notes: row.notes,
        })),
        format,
      );
    }
    if (kind === "coaches") {
      const rows = await this.coaches
        .find({ clubId: id })
        .sort({ createdAt: 1 });
      return exportResult(
        kind,
        [
          "firstName",
          "lastName",
          "phone",
          "specialties",
          "employmentType",
          "status",
          "notes",
        ],
        rows.map((row) => ({
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          specialties: row.specialties.join(" | "),
          employmentType: row.employmentType,
          status: row.status,
          notes: row.notes,
        })),
        format,
      );
    }
    if (kind === "classes") {
      const rows = await this.classes
        .find({ clubId: id })
        .sort({ startDate: 1 });
      return exportResult(
        kind,
        [
          "title",
          "sport",
          "level",
          "classModel",
          "pricingModel",
          "price",
          "capacity",
          "activeEnrollmentCount",
          "startDate",
          "endDate",
          "status",
        ],
        rows.map((row) => ({
          title: row.title,
          sport: row.sport,
          level: row.level,
          classModel: row.classModel,
          pricingModel: row.pricingModel,
          price: row.price,
          capacity: row.capacity,
          activeEnrollmentCount: row.activeEnrollmentCount,
          startDate: row.startDate.toISOString(),
          endDate: row.endDate.toISOString(),
          status: row.status,
        })),
        format,
      );
    }
    if (kind === "attendance") {
      const rows = await this.attendance.find({ clubId: id }).sort({ date: 1 });
      return exportResult(
        kind,
        ["studentId", "date", "sessionTitle", "status", "notes"],
        rows.map((row) => ({
          studentId: String(row.studentId),
          date: row.date.toISOString(),
          sessionTitle: row.sessionTitle,
          status: row.status,
          notes: row.notes,
        })),
        format,
      );
    }
    throw new AppError(400, "INVALID_EXPORT_KIND", "Invalid export kind");
  }

  async importData(
    ownerId: string,
    clubId: string,
    actorId: string,
    input: ImportOperationsDto,
  ) {
    await this.club(ownerId, clubId);
    const sourceRows =
      input.format === "xlsx"
        ? await parseImportWorkbook(input.contentBase64!, input.kind)
        : input.rows!;
    const errors: Array<{ row: number; message: string }> = [];
    const valid: Array<CreateStudentDto | CreatePaymentDto> = [];
    const importFingerprint =
      input.kind === "payments"
        ? createHash("sha256").update(JSON.stringify(sourceRows)).digest("hex")
        : "";
    sourceRows.forEach((row, index) => {
      const schema =
        input.kind === "students"
          ? CreateStudentDto.schema
          : CreatePaymentDto.schema;
      const parsed = schema.safeParse(
        input.kind === "payments"
          ? {
              ...row,
              idempotencyKey:
                row.idempotencyKey || `import:${importFingerprint}:${index}`,
            }
          : row,
      );
      if (parsed.success)
        valid.push(parsed.data as CreateStudentDto | CreatePaymentDto);
      else
        errors.push({
          row: index + 2,
          message: parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; "),
        });
    });
    if (input.dryRun || errors.length)
      return {
        dryRun: true,
        total: sourceRows.length,
        valid: valid.length,
        imported: 0,
        errors,
      };
    let imported = 0;
    for (const [index, row] of valid.entries()) {
      try {
        if (input.kind === "students")
          await this.createStudent(ownerId, clubId, row as CreateStudentDto);
        else
          await this.createPayment(
            ownerId,
            clubId,
            actorId,
            row as CreatePaymentDto,
          );
        imported += 1;
      } catch (error) {
        errors.push({
          row: index + 2,
          message:
            error instanceof AppError
              ? `${error.code}: ${error.message}`
              : "ذخیره این ردیف تأیید نشد؛ پیش از تلاش دوباره وضعیت آن را بررسی کنید.",
        });
      }
    }
    return {
      dryRun: false,
      total: sourceRows.length,
      valid: valid.length,
      imported,
      errors,
    };
  }

  async reception(userId: string, clubId: string, phone: string) {
    const id = await this.club(userId, clubId, "reception.read");
    const canonical = toE164IranianPhone(phone);
    const variants = [canonical, `0${canonical.slice(3)}`, canonical.slice(3)];
    const [student, account] = await Promise.all([
      this.students.findOne({ clubId: id, phone: { $in: variants } }),
      this.users.findDocumentByPhone(canonical),
    ]);
    const accountMismatch = Boolean(
      student?.userId &&
      account &&
      String(student.userId) !== String(account._id),
    );
    const accountId = accountMismatch
      ? null
      : (account?._id ?? student?.userId);
    const [memberships, reservations, enrollments, receipts] =
      await Promise.all([
        accountId
          ? this.students.db
              .collection("user_entitlements")
              .find({ clubId: id, userId: accountId })
              .sort({ endsAt: -1 })
              .limit(100)
              .toArray()
          : [],
        accountId
          ? this.students.db
              .collection("session_reservations")
              .find({ clubId: id, userId: accountId })
              .sort({ sessionStartsAt: -1 })
              .limit(100)
              .toArray()
          : [],
        student
          ? this.students.db
              .collection("business_class_enrollments")
              .find({ clubId: id, studentId: student._id })
              .sort({ enrolledAt: -1 })
              .limit(100)
              .toArray()
          : [],
        student
          ? this.payments
              .find({ clubId: id, studentId: student._id, voidedAt: null })
              .sort({ paidAt: -1 })
          : [],
      ]);
    if (!student && !memberships.length && !reservations.length)
      return {
        found: false,
        accountMismatch: false,
        person: null,
        memberships: [],
        reservations: [],
        enrollments: [],
        unallocatedReceiptCount: 0,
      };
    const classes = await this.classes
      .find({
        _id: { $in: enrollments.map((item) => item.classId) },
        clubId: id,
      })
      .select("title currency");
    const names = new Map(classes.map((item) => [String(item._id), item]));
    const now = new Date();
    return {
      found: true,
      accountMismatch,
      person: {
        studentId: student ? String(student._id) : null,
        name: student
          ? `${student.firstName} ${student.lastName}`
          : [account?.firstName, account?.lastName].filter(Boolean).join(" ") ||
            "ورزشکار",
        phone: canonical,
      },
      memberships: memberships.map((item) => {
        const week = membershipWeekKey(now, item.weekCalendar);
        const used =
          item.weeklyReservations?.[week] ??
          (item.usageWeekKey === week ? (item.weeklyUsed ?? 0) : 0);
        return {
          id: String(item._id),
          title: item.title,
          type: item.type,
          startsAt: new Date(item.startsAt).toISOString(),
          endsAt: new Date(item.endsAt).toISOString(),
          pauseUntil: item.pauseUntil
            ? new Date(item.pauseUntil).toISOString()
            : null,
          status:
            item.status === "revoked"
              ? "revoked"
              : new Date(item.endsAt) < now
                ? "expired"
                : new Date(item.startsAt) > now
                  ? "scheduled"
                  : item.pauseUntil && new Date(item.pauseUntil) > now
                    ? "paused"
                    : item.status,
          remainingSessions: item.remainingSessions ?? null,
          weeklyRemaining:
            item.weeklyLimit == null
              ? null
              : Math.max(0, item.weeklyLimit - used),
          weekCalendar: item.weekCalendar ?? "iso_utc",
        };
      }),
      reservations: reservations.map((item) => ({
        id: String(item._id),
        title: item.sessionTitle,
        startsAt: new Date(item.sessionStartsAt).toISOString(),
        endsAt: new Date(item.sessionEndsAt).toISOString(),
        status: item.status,
        paymentStatus: item.paymentStatus,
        participantCount: item.participantCount,
        checkedInParticipants: item.checkedInParticipants ?? 0,
        checkedInAt: item.checkedInAt
          ? new Date(item.checkedInAt).toISOString()
          : null,
        checkInOpensAt: new Date(
          new Date(item.sessionStartsAt).getTime() - 30 * 60000,
        ).toISOString(),
        changes: item.checkInChanges ?? [],
      })),
      enrollments: enrollments.map((item) => ({
        id: String(item._id),
        classId: String(item.classId),
        title: names.get(String(item.classId))?.title ?? "کلاس",
        status: item.status,
        paymentStatus: item.paymentStatus,
        agreedPrice: item.agreedPrice,
        currency: names.get(String(item.classId))?.currency ?? "IRR",
        remainingSessions: item.remainingSessions ?? null,
        outstandingAmount: this.billing.snapshot(
          item as unknown as import("./schemas/training-class.schema").BusinessClassEnrollment,
          receipts,
        ).outstandingAmount,
      })),
      unallocatedReceiptCount: receipts.filter((row) => !row.enrollmentId)
        .length,
    };
  }

  async listStudents(ownerId: string, clubId: string) {
    const id = await this.club(ownerId, clubId, "students.read");
    const items = await this.students
      .find({ clubId: id })
      .sort({ createdAt: -1 })
      .limit(1000);
    return { items: items.map(studentDto) };
  }
  async createStudent(
    ownerId: string,
    clubId: string,
    input: CreateStudentDto,
  ) {
    const id = await this.club(ownerId, clubId, "students.write");
    const duplicate = await this.students.exists({
      clubId: id,
      phone: input.phone,
    });
    if (duplicate)
      throw new AppError(
        409,
        "STUDENT_PHONE_EXISTS",
        "A student with this phone already exists",
      );
    const userId = await this.linkedUserId(input.phone, "athlete");
    return studentDto(
      await this.students.create({
        ...input,
        clubId: id,
        userId,
        membershipEndsAt: input.membershipEndsAt
          ? new Date(input.membershipEndsAt)
          : null,
      }),
    );
  }
  async updateStudent(
    ownerId: string,
    clubId: string,
    itemId: string,
    input: UpdateStudentDto,
  ) {
    const id = await this.club(ownerId, clubId, "students.write");
    const userId = input.phone
      ? await this.linkedUserId(input.phone, "athlete")
      : undefined;
    const item = await this.students.findOneAndUpdate(
      { _id: oid(itemId), clubId: id },
      {
        $set: {
          ...input,
          ...(userId !== undefined ? { userId } : {}),
          ...(input.membershipEndsAt !== undefined
            ? {
                membershipEndsAt: input.membershipEndsAt
                  ? new Date(input.membershipEndsAt)
                  : null,
              }
            : {}),
        },
      },
      { new: true },
    );
    if (!item) throw notFound("STUDENT_NOT_FOUND");
    return studentDto(item);
  }

  async listCoaches(ownerId: string, clubId: string) {
    const id = await this.club(ownerId, clubId, "coaches.read");
    const items = await this.coaches
      .find({ clubId: id })
      .sort({ createdAt: -1 })
      .limit(500);
    return { items: items.map(coachDto) };
  }
  async createCoach(ownerId: string, clubId: string, input: CreateCoachDto) {
    const id = await this.club(ownerId, clubId, "coaches.write");
    const duplicate = await this.coaches.exists({
      clubId: id,
      phone: input.phone,
    });
    if (duplicate)
      throw new AppError(
        409,
        "COACH_PHONE_EXISTS",
        "A coach with this phone already exists",
      );
    const userId = await this.linkedUserId(input.phone, "coach");
    return coachDto(
      await this.coaches.create({
        ...input,
        specialties: unique(input.specialties),
        clubId: id,
        userId,
      }),
    );
  }
  async updateCoach(
    ownerId: string,
    clubId: string,
    itemId: string,
    input: UpdateCoachDto,
  ) {
    const id = await this.club(ownerId, clubId, "coaches.write");
    const userId = input.phone
      ? await this.linkedUserId(input.phone, "coach")
      : undefined;
    const item = await this.coaches.findOneAndUpdate(
      { _id: oid(itemId), clubId: id },
      {
        $set: {
          ...input,
          ...(userId !== undefined ? { userId } : {}),
          ...(input.specialties
            ? { specialties: unique(input.specialties) }
            : {}),
        },
      },
      { new: true },
    );
    if (!item) throw notFound("COACH_NOT_FOUND");
    return coachDto(item);
  }

  private async linkedUserId(phone: string, role: "athlete" | "coach") {
    const user = await this.users.findDocumentByPhone(
      toE164IranianPhone(phone),
    );
    return user?.roles.includes(role) ? user._id : null;
  }

  async listPayments(ownerId: string, clubId: string) {
    const id = await this.club(ownerId, clubId, "payments.read");
    const items = await this.payments
      .find({ clubId: id })
      .sort({ paidAt: -1 })
      .limit(1000);
    return { items: items.map(receiptDto) };
  }
  async createPayment(
    ownerId: string,
    clubId: string,
    userId: string,
    input: CreatePaymentDto,
  ) {
    return this.billing.createReceipt(userId, clubId, input);
  }

  async listAttendance(ownerId: string, clubId: string, date?: string) {
    const id = await this.club(ownerId, clubId, "attendance.read");
    const filter: Record<string, unknown> = { clubId: id };
    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      if (!Number.isNaN(start.valueOf()))
        filter.date = {
          $gte: start,
          $lt: new Date(start.valueOf() + 86_400_000),
        };
    }
    const items = await this.attendance
      .find(filter)
      .sort({ date: -1 })
      .limit(1000);
    return { items: items.map(attendanceDto) };
  }
  async upsertAttendance(
    ownerId: string,
    clubId: string,
    userId: string,
    input: UpsertAttendanceDto,
  ) {
    const id = await this.club(ownerId, clubId, "attendance.write");
    const studentId = oid(input.studentId);
    if (!(await this.students.exists({ _id: studentId, clubId: id })))
      throw notFound("STUDENT_NOT_FOUND");
    const item = await this.attendance.findOneAndUpdate(
      {
        clubId: id,
        studentId,
        date: new Date(input.date),
        sessionTitle: input.sessionTitle,
      },
      {
        $set: { ...input, date: new Date(input.date), recordedBy: oid(userId) },
      },
      { upsert: true, new: true },
    );
    return attendanceDto(item);
  }

  async listBranches(ownerId: string, clubId: string) {
    const id = await this.club(ownerId, clubId, "branches.read");
    const items = await this.branches
      .find({ clubId: id })
      .sort({ createdAt: -1 })
      .limit(200);
    return { items: items.map(branchDto) };
  }
  async createBranch(ownerId: string, clubId: string, input: CreateBranchDto) {
    const id = await this.club(ownerId, clubId, "branches.write");
    return branchDto(await this.branches.create({ ...input, clubId: id }));
  }
  async updateBranch(
    ownerId: string,
    clubId: string,
    itemId: string,
    input: UpdateBranchDto,
  ) {
    const id = await this.club(ownerId, clubId, "branches.write");
    const item = await this.branches.findOneAndUpdate(
      { _id: oid(itemId), clubId: id },
      { $set: input },
      { new: true },
    );
    if (!item) throw notFound("BRANCH_NOT_FOUND");
    return branchDto(item);
  }

  async summary(ownerId: string, clubId: string) {
    const id = await this.club(ownerId, clubId, "reports.read");
    const now = new Date();
    const sixMonthsAgo = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
    );
    const sevenDaysAgo = new Date(now.valueOf() - 6 * 86_400_000);
    const [
      activeStudents,
      activeCoaches,
      activeClasses,
      branchCount,
      payments,
      manualAttendance,
      classAttendance,
    ] = await Promise.all([
      this.students.countDocuments({ clubId: id, status: "active" }),
      this.coaches.countDocuments({ clubId: id, status: "active" }),
      this.classes.countDocuments({ clubId: id, status: "active" }),
      this.branches.countDocuments({ clubId: id, status: "active" }),
      this.payments
        .find({
          clubId: id,
          voidedAt: null,
          $or: [
            { paidAt: { $gte: sixMonthsAgo } },
            { "refunds.paidAt": { $gte: sixMonthsAgo } },
          ],
        })
        .select("amount type paidAt refunds"),
      this.attendance
        .find({ clubId: id, date: { $gte: sevenDaysAgo } })
        .select("status date"),
      this.classAttendance.aggregate<{
        status: "present" | "absent" | "excused";
        date: Date;
      }>([
        { $match: { clubId: id } },
        {
          $lookup: {
            from: "business_class_sessions",
            localField: "sessionId",
            foreignField: "_id",
            as: "session",
          },
        },
        { $unwind: "$session" },
        { $match: { "session.startsAt": { $gte: sevenDaysAgo } } },
        { $project: { _id: 0, status: 1, date: "$session.startsAt" } },
      ]),
    ]);
    const attendance = [...manualAttendance, ...classAttendance];
    const revenueByMonth = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1),
      );
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      return { label: key, value: 0 };
    });
    const revenueMap = new Map(
      revenueByMonth.map((point) => [point.label, point]),
    );
    const paymentMix = { tuition: 0, session: 0, other: 0 };
    for (const payment of payments) {
      const entries = [
        { paidAt: payment.paidAt, amount: payment.amount },
        ...(payment.refunds ?? []).map((refund) => ({
          paidAt: new Date(refund.paidAt),
          amount: -refund.amount,
        })),
      ];
      for (const entry of entries) {
        const key = `${entry.paidAt.getUTCFullYear()}-${String(entry.paidAt.getUTCMonth() + 1).padStart(2, "0")}`;
        const point = revenueMap.get(key);
        if (point) {
          point.value += entry.amount;
          paymentMix[payment.type] += entry.amount;
        }
      }
    }
    const attendanceByDay = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now.valueOf() - (6 - index) * 86_400_000);
      return {
        label: date.toISOString().slice(0, 10),
        present: 0,
        absent: 0,
        excused: 0,
      };
    });
    const attendanceMap = new Map(
      attendanceByDay.map((point) => [point.label, point]),
    );
    for (const record of attendance) {
      const point = attendanceMap.get(record.date.toISOString().slice(0, 10));
      if (point) point[record.status] += 1;
    }
    const totalAttendance = attendance.length;
    const presentCount = attendance.filter(
      (item) => item.status === "present",
    ).length;
    return {
      stats: {
        activeStudents,
        activeCoaches,
        activeClasses,
        branchCount,
        monthlyRevenue: revenueByMonth.at(-1)?.value ?? 0,
        attendanceRate: totalAttendance
          ? Math.round((presentCount / totalAttendance) * 100)
          : 0,
      },
      revenueByMonth,
      attendanceByDay,
      paymentMix,
    };
  }
}

async function parseImportWorkbook(
  contentBase64: string,
  expectedKind: string,
) {
  const workbook = new ExcelJS.Workbook();
  const workbookBytes = Uint8Array.from(Buffer.from(contentBase64, "base64"));
  await workbook.xlsx.load(workbookBytes.buffer);
  const metadata = workbook.getWorksheet("Metadata");
  const version = Number(metadata?.getCell("B1").value);
  const kind = String(metadata?.getCell("B2").value ?? "");
  if (version !== 1 || kind !== expectedKind)
    throw new AppError(
      400,
      "INVALID_IMPORT_TEMPLATE",
      "Workbook template or kind is invalid",
    );
  const sheet = workbook.getWorksheet("Data");
  if (!sheet)
    throw new AppError(400, "INVALID_IMPORT_TEMPLATE", "Data sheet is missing");
  const headers = (sheet.getRow(1).values as unknown[]).slice(1).map(String);
  const rows: Array<Record<string, unknown>> = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record = Object.fromEntries(
      headers.map((header, index) => {
        const value = row.getCell(index + 1).value;
        return [
          header,
          value instanceof Date ? value.toISOString() : (value ?? ""),
        ];
      }),
    );
    if (Object.values(record).some((value) => value !== "")) rows.push(record);
  });
  if (!rows.length || rows.length > 5000)
    throw new AppError(
      400,
      "INVALID_IMPORT_ROWS",
      "Workbook must contain 1 to 5000 rows",
    );
  return rows;
}

function oid(value: string) {
  if (!Types.ObjectId.isValid(value)) throw notFound("RESOURCE_NOT_FOUND");
  return new Types.ObjectId(value);
}
function notFound(code: string) {
  return new AppError(404, code, "Resource not found");
}
function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
function common(item: {
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
function studentDto(item: ClubStudentDocument) {
  return {
    ...common(item),
    firstName: item.firstName,
    lastName: item.lastName,
    phone: item.phone,
    userId: item.userId ? String(item.userId) : null,
    sport: item.sport,
    membershipTitle: item.membershipTitle,
    membershipEndsAt: item.membershipEndsAt?.toISOString() ?? null,
    status: item.status,
    notes: item.notes,
  };
}
function coachDto(item: ClubCoachProfileDocument) {
  return {
    ...common(item),
    firstName: item.firstName,
    lastName: item.lastName,
    phone: item.phone,
    userId: item.userId ? String(item.userId) : null,
    specialties: item.specialties,
    employmentType: item.employmentType,
    status: item.status,
    notes: item.notes,
  };
}

async function exportResult(
  kind: string,
  headers: string[],
  rows: Array<Record<string, unknown>>,
  format: string,
) {
  if (format === "xlsx") return xlsxResult(kind, headers, rows);
  if (format !== "csv")
    throw new AppError(400, "INVALID_EXPORT_FORMAT", "Invalid export format");
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const content = `\uFEFF${[
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escape(row[header])).join(","),
    ),
  ].join("\n")}`;
  return {
    filename: `${kind}-${new Date().toISOString().slice(0, 10)}.csv`,
    mimeType: "text/csv;charset=utf-8",
    content,
    encoding: "utf8" as const,
    templateVersion: 1,
  };
}

async function xlsxResult(
  kind: string,
  headers: string[],
  rows: Array<Record<string, unknown>>,
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Club4Me";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Data", {
    views: [{ state: "frozen", ySplit: 1, rightToLeft: true }],
  });
  sheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.min(
      42,
      Math.max(
        14,
        header.length + 2,
        ...rows
          .slice(0, 200)
          .map((row) => String(row[header] ?? "").length + 2),
      ),
    ),
  }));
  sheet.addRows(rows);
  const header = sheet.getRow(1);
  header.height = 24;
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" },
  };
  header.alignment = { horizontal: "center", vertical: "middle" };
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, rows.length + 1), column: headers.length },
  };
  const meta = workbook.addWorksheet("Metadata", { state: "veryHidden" });
  meta.addRows([
    ["templateVersion", 1],
    ["kind", kind],
    ["exportedAt", new Date()],
  ]);
  meta.getCell("B3").numFmt = "yyyy-mm-dd hh:mm";
  const buffer = await workbook.xlsx.writeBuffer();
  return {
    filename: `${kind}-${new Date().toISOString().slice(0, 10)}.xlsx`,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    content: Buffer.from(buffer).toString("base64"),
    encoding: "base64" as const,
    templateVersion: 1,
  };
}
function attendanceDto(item: ClubAttendanceDocument) {
  return {
    ...common(item),
    studentId: String(item.studentId),
    date: item.date.toISOString(),
    sessionTitle: item.sessionTitle,
    status: item.status,
    notes: item.notes,
    recordedBy: String(item.recordedBy),
  };
}
function branchDto(item: ClubBranchDocument) {
  return {
    ...common(item),
    name: item.name,
    address: item.address,
    phone: item.phone,
    timezone: item.timezone,
    status: item.status,
  };
}
