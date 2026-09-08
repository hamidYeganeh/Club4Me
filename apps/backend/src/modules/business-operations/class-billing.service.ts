import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Atomic,
  lockPaymentReference,
} from "../../infrastructure/database/atomic-operation";
import { AppError } from "../../common/errors/app.exception";
import { ClubsRepository } from "../clubs/clubs.repository";
import {
  ClubManualPayment,
  type ClubManualPaymentDocument,
} from "./schemas/payment.schema";
import { ClubStudent } from "./schemas/student.schema";
import {
  BusinessClassEnrollment,
  type BusinessClassEnrollmentDocument,
  BusinessTrainingClass,
} from "./schemas/training-class.schema";
import type {
  CreatePaymentDto,
  ReconcileClassBillingDto,
  RefundManualReceiptDto,
} from "./business-operations.dto";

type Account = ReturnType<ClassBillingService["snapshot"]>;
@Injectable()
export class ClassBillingService {
  constructor(
    @InjectModel(ClubManualPayment.name)
    private payments: Model<ClubManualPayment>,
    @InjectModel(BusinessClassEnrollment.name)
    private enrollments: Model<BusinessClassEnrollment>,
    @InjectModel(BusinessTrainingClass.name)
    private classes: Model<BusinessTrainingClass>,
    @InjectModel(ClubStudent.name) private students: Model<ClubStudent>,
    private clubs: ClubsRepository,
  ) {}

  snapshot(item: BusinessClassEnrollment, receipts: ClubManualPayment[]) {
    const paidReceipts = receipts.filter(
      (row) =>
        !row.voidedAt &&
        String(row.enrollmentId) ===
          String((item as BusinessClassEnrollmentDocument)._id),
    );
    const receiptAmount = paidReceipts.reduce(
      (sum, row) => sum + row.amount - (row.refundedAmount ?? 0),
      0,
    );
    const online = Boolean(item.paymentExpiresAt || item.paymentSeatHeld);
    const reconciled = !online && item.billingMode === "ledger";
    const paidAmount = reconciled
      ? (item.openingPaidAmount ?? 0) + receiptAmount
      : online && item.paymentStatus === "paid"
        ? item.agreedPrice
        : null;
    const waivedAmount = reconciled ? (item.waivedAmount ?? 0) : null;
    const balance =
      paidAmount === null
        ? null
        : item.agreedPrice - paidAmount - (waivedAmount ?? 0);
    return {
      enrollmentId: String((item as BusinessClassEnrollmentDocument)._id),
      classId: String(item.classId),
      studentId: String(item.studentId),
      status: item.status,
      paymentStatus: item.paymentStatus,
      agreedPrice: item.agreedPrice,
      mode: online
        ? ("online" as const)
        : reconciled
          ? ("ledger" as const)
          : ("legacy" as const),
      openingPaidAmount: reconciled ? (item.openingPaidAmount ?? 0) : null,
      receiptAmount,
      paidAmount,
      waivedAmount,
      outstandingAmount:
        item.status === "cancelled" || item.paymentStatus === "refunded"
          ? 0
          : balance === null
            ? null
            : Math.max(0, balance),
      creditAmount:
        item.status === "cancelled"
          ? paidAmount
          : balance === null
            ? null
            : Math.max(0, -balance),
      revision: item.billingRevision ?? 0,
      changes: item.billingChanges ?? [],
    };
  }

  async accounts(actor: string, clubId: string, studentId: string) {
    await this.clubs.findForOwner(actor, clubId, "payments.read");
    const club = oid(clubId),
      student = oid(studentId);
    if (!(await this.students.exists({ _id: student, clubId: club })))
      throw missing();
    const items = await this.enrollments
      .find({ clubId: club, studentId: student })
      .sort({ enrolledAt: -1 });
    const receipts = await this.payments
      .find({ clubId: club, studentId: student })
      .sort({ paidAt: -1 });
    const classes = await this.classes
      .find({ clubId: club, _id: { $in: items.map((item) => item.classId) } })
      .select("title currency");
    const names = new Map(classes.map((item) => [String(item._id), item]));
    return {
      items: items.map((item) => ({
        ...this.snapshot(item, receipts),
        title: names.get(String(item.classId))?.title ?? "کلاس",
        currency: names.get(String(item.classId))?.currency ?? "IRR",
      })),
      receipts: receipts.map(receiptDto),
    };
  }

  private async lockEnrollment(clubId: Types.ObjectId, enrollmentId: string) {
    const item = await this.enrollments.findOneAndUpdate(
      { _id: oid(enrollmentId), clubId },
      { $inc: { billingRevision: 1 } },
      { new: true },
    );
    if (!item) throw missing();
    return item;
  }
  private assertManual(item: BusinessClassEnrollment) {
    if (item.paymentExpiresAt || item.paymentSeatHeld)
      throw conflict(
        "ONLINE_PAYMENT_MANAGED_BY_COMMERCE",
        "پرداخت این ثبت‌نام در اپ مدیریت می‌شود",
      );
  }
  private async balance(
    item: BusinessClassEnrollmentDocument,
  ): Promise<Account> {
    const receipts = await this.payments.find({
      enrollmentId: item._id,
      clubId: item.clubId,
    });
    return this.snapshot(item, receipts);
  }
  private async applyStatus(item: BusinessClassEnrollmentDocument) {
    const state = await this.balance(item);
    if (state.mode !== "ledger")
      throw conflict(
        "BILLING_RECONCILIATION_REQUIRED",
        "ابتدا ماندهٔ قدیمی را تطبیق دهید",
      );
    item.paymentStatus =
      state.paidAmount! + state.waivedAmount! >= item.agreedPrice
        ? state.paidAmount === 0 && state.waivedAmount! > 0
          ? "waived"
          : "paid"
        : state.paidAmount! > 0
          ? "partial"
          : "pending";
    await item.save();
  }
  private async validateAllocation(
    item: BusinessClassEnrollmentDocument,
    student: Types.ObjectId,
    amount: number,
    currency: string,
  ) {
    this.assertManual(item);
    if (!Number.isSafeInteger(amount) || amount <= 0)
      throw conflict(
        "INVALID_RECEIPT_AMOUNT",
        "ماندهٔ رسید باید عدد صحیح مثبت باشد",
      );
    if (String(item.studentId) !== String(student)) throw missing();
    if (!["active", "completed"].includes(item.status))
      throw conflict(
        "CLASS_NOT_BILLABLE",
        "فقط ثبت‌نام فعال یا تمام‌شده قابل دریافت شهریه است",
      );
    const trainingClass = await this.classes.findOne({
      _id: item.classId,
      clubId: item.clubId,
    });
    if (!trainingClass || currency !== trainingClass.currency)
      throw conflict(
        "PAYMENT_CURRENCY_MISMATCH",
        "واحد پول رسید و کلاس یکسان نیست",
      );
    const state = await this.balance(item);
    if (state.mode !== "ledger")
      throw conflict(
        "BILLING_RECONCILIATION_REQUIRED",
        "ابتدا ماندهٔ قدیمی را تطبیق دهید",
      );
    if (amount > state.outstandingAmount!)
      throw conflict(
        "PAYMENT_EXCEEDS_BALANCE",
        "مبلغ رسید از ماندهٔ شهریه بیشتر است",
      );
  }

  @Atomic("payments")
  async createReceipt(actor: string, clubId: string, input: CreatePaymentDto) {
    await this.clubs.findForOwner(actor, clubId, "payments.write");
    const club = oid(clubId),
      student = oid(input.studentId);
    const key = input.idempotencyKey;
    if (!key)
      throw conflict(
        "RECEIPT_IDEMPOTENCY_REQUIRED",
        "شناسهٔ ثبت رسید الزامی است",
      );
    const canonical = {
      studentId: String(student),
      enrollmentId: input.enrollmentId ?? null,
      type: input.type,
      title: input.title.trim(),
      amount: input.amount,
      currency: input.currency,
      paidAt: new Date(input.paidAt).toISOString(),
      method: input.method,
      notes: input.notes ?? "",
    };
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(canonical))
      .digest("hex");
    await lockPaymentReference(
      this.payments.db,
      "manual_receipt",
      `${clubId}:${key}`,
    );
    const existing = await this.payments.findOne({
      clubId: club,
      idempotencyKey: key,
    });
    if (existing) {
      if (existing.requestFingerprint !== fingerprint)
        throw conflict(
          "IDEMPOTENCY_KEY_REUSED",
          "این شناسه قبلاً با اطلاعات دیگری استفاده شده است",
        );
      return receiptDto(existing);
    }
    if (
      !Number.isSafeInteger(input.amount) ||
      input.amount <= 0 ||
      input.currency !== "IRR"
    )
      throw conflict(
        "INVALID_RECEIPT_AMOUNT",
        "مبلغ باید عدد صحیح مثبت به ریال باشد",
      );
    if (!(await this.students.exists({ _id: student, clubId: club })))
      throw missing();
    const enrollment = input.enrollmentId
      ? await this.lockEnrollment(club, input.enrollmentId)
      : null;
    if (enrollment)
      await this.validateAllocation(
        enrollment,
        student,
        input.amount,
        input.currency,
      );
    const receipt = await this.payments.create({
      ...canonical,
      clubId: club,
      studentId: student,
      enrollmentId: enrollment?._id ?? null,
      paidAt: new Date(input.paidAt),
      recordedBy: oid(actor),
      idempotencyKey: key,
      requestFingerprint: fingerprint,
    });
    if (enrollment) await this.applyStatus(enrollment);
    return receiptDto(receipt);
  }

  @Atomic("payments")
  async allocate(
    actor: string,
    clubId: string,
    receiptId: string,
    enrollmentId: string,
    reason: string,
  ) {
    await this.clubs.findForOwner(actor, clubId, "payments.write");
    await lockPaymentReference(
      this.payments.db,
      "manual_receipt_record",
      receiptId,
    );
    const receipt = await this.payments.findOne({
      _id: oid(receiptId),
      clubId: oid(clubId),
    });
    if (!receipt) throw missing();
    if (receipt.voidedAt) throw conflict("RECEIPT_VOIDED", "رسید باطل شده است");
    if (receipt.enrollmentId) {
      if (String(receipt.enrollmentId) === enrollmentId)
        return receiptDto(receipt);
      throw conflict(
        "RECEIPT_ALREADY_ALLOCATED",
        "رسید قبلاً به ثبت‌نام دیگری وصل شده است",
      );
    }
    const item = await this.lockEnrollment(oid(clubId), enrollmentId);
    await this.validateAllocation(
      item,
      receipt.studentId,
      receipt.amount - (receipt.refundedAmount ?? 0),
      receipt.currency,
    );
    receipt.enrollmentId = item._id;
    receipt.allocationChanges.push({
      actorId: actor,
      at: new Date(),
      enrollmentId,
      reason,
    });
    await receipt.save();
    await this.applyStatus(item);
    return receiptDto(receipt);
  }

  @Atomic("payments")
  async voidReceipt(
    actor: string,
    clubId: string,
    receiptId: string,
    reason: string,
  ) {
    await this.clubs.findForOwner(actor, clubId, "payments.write");
    await lockPaymentReference(
      this.payments.db,
      "manual_receipt_record",
      receiptId,
    );
    const receipt = await this.payments.findOne({
      _id: oid(receiptId),
      clubId: oid(clubId),
    });
    if (!receipt) throw missing();
    if (receipt.voidedAt) return receiptDto(receipt);
    if (receipt.refundedAmount > 0)
      throw conflict(
        "REFUNDED_RECEIPT_CANNOT_BE_VOIDED",
        "رسید دارای بازگشت وجه قابل ابطال نیست",
      );
    const item = receipt.enrollmentId
      ? await this.lockEnrollment(oid(clubId), String(receipt.enrollmentId))
      : null;
    receipt.voidedAt = new Date();
    receipt.voidedBy = oid(actor);
    receipt.voidReason = reason;
    await receipt.save();
    if (item) await this.applyStatus(item);
    return receiptDto(receipt);
  }

  @Atomic("payments")
  async refundReceipt(
    actor: string,
    clubId: string,
    receiptId: string,
    input: RefundManualReceiptDto,
  ) {
    await this.clubs.findForOwner(actor, clubId, "payments.write");
    await lockPaymentReference(
      this.payments.db,
      "manual_receipt_record",
      receiptId,
    );
    const receipt = await this.payments.findOne({
      _id: oid(receiptId),
      clubId: oid(clubId),
    });
    if (!receipt) throw missing();
    const existing = receipt.refunds.find(
      (row) => row.idempotencyKey === input.idempotencyKey,
    );
    if (existing) {
      if (
        existing.amount !== input.amount ||
        existing.method !== input.method ||
        existing.reason !== input.reason ||
        new Date(existing.paidAt).toISOString() !== input.paidAt
      )
        throw conflict(
          "IDEMPOTENCY_KEY_REUSED",
          "این شناسه با اطلاعات دیگری استفاده شده است",
        );
      return receiptDto(receipt);
    }
    if (receipt.voidedAt) throw conflict("RECEIPT_VOIDED", "رسید باطل شده است");
    if (input.amount > receipt.amount - (receipt.refundedAmount ?? 0))
      throw conflict(
        "REFUND_EXCEEDS_RECEIPT",
        "مبلغ بازگشت از ماندهٔ رسید بیشتر است",
      );
    const item = receipt.enrollmentId
      ? await this.lockEnrollment(oid(clubId), String(receipt.enrollmentId))
      : null;
    receipt.refundedAmount = (receipt.refundedAmount ?? 0) + input.amount;
    receipt.refunds.push({
      ...input,
      actorId: actor,
      at: new Date(),
      paidAt: new Date(input.paidAt),
    });
    await receipt.save();
    if (item) await this.applyStatus(item);
    return receiptDto(receipt);
  }

  @Atomic("enrollments")
  async reconcile(
    actor: string,
    clubId: string,
    enrollmentId: string,
    input: ReconcileClassBillingDto,
  ) {
    await this.clubs.findForOwner(actor, clubId, "payments.write");
    const item = await this.lockEnrollment(oid(clubId), enrollmentId);
    this.assertManual(item);
    if (item.billingMode === "ledger")
      throw conflict(
        "BILLING_ALREADY_RECONCILED",
        "حساب قبلاً تطبیق داده شده است",
      );
    if (item.billingRevision !== input.expectedRevision + 1)
      throw conflict(
        "BILLING_CHANGED",
        "حساب تغییر کرده است؛ دوباره بارگذاری کنید",
      );
    if (input.openingPaidAmount + input.waivedAmount > item.agreedPrice)
      throw conflict(
        "BILLING_EXCEEDS_PRICE",
        "جمع پرداخت و بخشودگی از شهریه بیشتر است",
      );
    const before = {
      paymentStatus: item.paymentStatus,
      agreedPrice: item.agreedPrice,
    };
    item.billingMode = "ledger";
    item.openingPaidAmount = input.openingPaidAmount;
    item.waivedAmount = input.waivedAmount;
    item.billingChanges.push({
      actorId: actor,
      at: new Date(),
      action: "reconcile",
      reason: input.reason,
      before,
      after: {
        openingPaidAmount: input.openingPaidAmount,
        waivedAmount: input.waivedAmount,
      },
    });
    await this.applyStatus(item);
    return this.balance(item);
  }

  // Caller holds the enrollment transaction. Newly declared paid amounts get a real receipt row.
  async initialize(
    item: BusinessClassEnrollmentDocument,
    actor: string,
    declared: string,
  ) {
    if (!["pending", "paid", "waived"].includes(declared))
      throw conflict(
        "RECEIPT_AMOUNT_REQUIRED",
        "برای پرداخت جزئی، ابتدا ثبت‌نام و سپس رسید مبلغ را ثبت کنید",
      );
    item.billingMode = "ledger";
    item.openingPaidAmount = 0;
    item.waivedAmount = declared === "waived" ? item.agreedPrice : 0;
    item.paymentExpiresAt = null;
    item.paymentSeatHeld = false;
    item.billingChanges.push({
      actorId: actor,
      at: new Date(),
      action: "open",
      reason: "ثبت قرارداد کلاس",
      before: {},
      after: { agreedPrice: item.agreedPrice, waivedAmount: item.waivedAmount },
    });
    await item.save();
    if (declared === "paid" && item.agreedPrice > 0) {
      await this.createReceipt(actor, String(item.clubId), {
        studentId: String(item.studentId),
        enrollmentId: String(item._id),
        type: "tuition",
        title: "شهریه هنگام ثبت‌نام",
        amount: item.agreedPrice,
        currency: "IRR",
        paidAt: new Date().toISOString(),
        method: "other",
        notes: "پرداخت دریافت‌شده طبق اعلام مسئول ثبت‌نام",
        idempotencyKey: `enrollment:${item._id}:${item.enrolledAt.getTime()}`,
      });
      item.paymentStatus = "paid";
    } else await this.applyStatus(item);
  }

  async transferAccount(
    source: BusinessClassEnrollmentDocument,
    target: BusinessClassEnrollmentDocument,
    actor: string,
  ) {
    this.assertManual(source);
    if (source.billingMode !== "ledger") {
      if (["paid", "partial", "waived"].includes(source.paymentStatus))
        throw conflict(
          "BILLING_RECONCILIATION_REQUIRED",
          "ابتدا حساب قدیمی را تطبیق دهید",
        );
      await this.initialize(target, actor, "pending");
      return;
    }
    const oldClass = await this.classes.findById(source.classId);
    const nextClass = await this.classes.findById(target.classId);
    if (
      source.agreedPrice !== target.agreedPrice ||
      source.totalSessions !== target.totalSessions ||
      oldClass?.currency !== nextClass?.currency
    )
      throw conflict(
        "TRANSFER_CONTRACT_MISMATCH",
        "انتقال با حفظ پرداخت فقط به قرارداد هم‌قیمت و هم‌سهمیه ممکن است",
      );
    if (target.status !== "active")
      throw conflict(
        "TRANSFER_CAPACITY_REQUIRED",
        "برای انتقال قرارداد مالی، کلاس مقصد باید ظرفیت داشته باشد",
      );
    target.billingMode = "ledger";
    target.openingPaidAmount = source.openingPaidAmount ?? 0;
    target.waivedAmount = source.waivedAmount ?? 0;
    target.remainingSessions = source.remainingSessions;
    target.billingChanges.push({
      actorId: actor,
      at: new Date(),
      action: "transfer_in",
      reason: "انتقال قرارداد با حفظ پرداخت و سهمیه",
      before: { enrollmentId: String(source._id) },
      after: { enrollmentId: String(target._id) },
    });
    await this.payments.updateMany(
      { enrollmentId: source._id, clubId: source.clubId },
      {
        $set: { enrollmentId: target._id },
        $push: {
          allocationChanges: {
            actorId: actor,
            at: new Date(),
            enrollmentId: String(target._id),
            reason: "انتقال قرارداد کلاس",
          },
        },
      },
    );
    source.openingPaidAmount = 0;
    source.waivedAmount = 0;
    source.paymentStatus = "pending";
    source.billingChanges.push({
      actorId: actor,
      at: new Date(),
      action: "transfer_out",
      reason: "انتقال حساب به کلاس مقصد",
      before: { enrollmentId: String(source._id) },
      after: { enrollmentId: String(target._id) },
    });
    await this.applyStatus(target);
  }

  async changeTerms(
    item: BusinessClassEnrollmentDocument,
    actor: string,
    price: number | undefined,
    status: string | undefined,
  ) {
    if (
      price === undefined &&
      (status === undefined || status === item.paymentStatus)
    )
      return;
    this.assertManual(item);
    if (item.billingMode !== "ledger")
      throw conflict(
        "BILLING_RECONCILIATION_REQUIRED",
        "ابتدا ماندهٔ قدیمی را تطبیق دهید",
      );
    const before = {
      agreedPrice: item.agreedPrice,
      paymentStatus: item.paymentStatus,
    };
    if (price !== undefined) {
      if (!Number.isSafeInteger(price) || price < 0)
        throw conflict(
          "INVALID_RECEIPT_AMOUNT",
          "شهریه باید عدد صحیح به ریال باشد",
        );
      const balance = await this.balance(item);
      if (price < balance.paidAmount! + balance.waivedAmount!)
        throw conflict(
          "PRICE_BELOW_RECEIPTS",
          "شهریه از مبلغ وصول‌شده و بخشودگی کمتر است",
        );
      item.agreedPrice = price;
    }
    if (status !== undefined && status !== item.paymentStatus)
      throw conflict(
        "PAYMENT_STATUS_REQUIRES_RECEIPT",
        "وضعیت پرداخت با ثبت یا ابطال رسید تغییر می‌کند",
      );
    item.billingChanges.push({
      actorId: actor,
      at: new Date(),
      action: "price",
      reason: "اصلاح مبلغ قرارداد",
      before,
      after: { agreedPrice: item.agreedPrice },
    });
    await this.applyStatus(item);
  }
}

export function receiptDto(item: ClubManualPaymentDocument) {
  return {
    id: String(item._id),
    clubId: String(item.clubId),
    studentId: String(item.studentId),
    enrollmentId: item.enrollmentId ? String(item.enrollmentId) : null,
    type: item.type,
    title: item.title,
    amount: item.amount,
    currency: item.currency,
    paidAt: item.paidAt.toISOString(),
    method: item.method,
    notes: item.notes,
    recordedBy: String(item.recordedBy),
    voidedAt: item.voidedAt?.toISOString() ?? null,
    voidedBy: item.voidedBy ? String(item.voidedBy) : null,
    voidReason: item.voidReason ?? "",
    refundedAmount: item.refundedAmount ?? 0,
    refunds: item.refunds ?? [],
    allocationChanges: item.allocationChanges ?? [],
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
function oid(value: string) {
  if (!Types.ObjectId.isValid(value)) throw missing();
  return new Types.ObjectId(value);
}
function missing() {
  return new AppError(404, "BILLING_RECORD_NOT_FOUND", "حساب یا رسید یافت نشد");
}
function conflict(code: string, message: string) {
  return new AppError(409, code, message);
}
