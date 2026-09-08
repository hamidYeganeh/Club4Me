import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { AppError } from "../../common/errors/app.exception";

export const supportReferenceTypes = [
  "reservation",
  "coach_booking",
  "class_enrollment",
  "business_class_enrollment",
  "payment",
  "benefit_purchase",
] as const;
export type SupportReferenceType = (typeof supportReferenceTypes)[number];
const sources = {
  reservation: ["session_reservations", "userId"],
  coach_booking: ["session_bookings", "athleteId"],
  class_enrollment: ["class_enrollments", "athleteId"],
  business_class_enrollment: ["business_class_enrollments", null],
  payment: ["payment_intents", "userId"],
  benefit_purchase: ["benefit_purchases", "userId"],
} as const;
const projection = {
  _id: 1,
  studentId: 1,
  clubId: 1,
  sessionTitle: 1,
  title: 1,
  classTitle: 1,
  status: 1,
  paymentStatus: 1,
  totalPrice: 1,
  agreedPrice: 1,
  amount: 1,
  currency: 1,
  priceSnapshot: 1,
  createdAt: 1,
  cancelledAt: 1,
};

@Injectable()
export class SupportReferencesService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async requireOwned(
    userId: string,
    type: SupportReferenceType,
    referenceId: string,
  ) {
    const source = sources[type];
    if (
      !source ||
      !Types.ObjectId.isValid(referenceId) ||
      !Types.ObjectId.isValid(userId)
    )
      throw new AppError(
        400,
        "SUPPORT_REFERENCE_INVALID",
        "ارجاع درخواست معتبر نیست.",
      );
    const [collection, ownerField] = source;
    const item = await this.connection.collection(collection).findOne(
      {
        _id: new Types.ObjectId(referenceId),
        ...(ownerField ? { [ownerField]: new Types.ObjectId(userId) } : {}),
      },
      { projection },
    );
    if (!item) throw unavailable();
    if (!ownerField) {
      const student = await this.connection.collection("club_students").findOne(
        {
          _id: item.studentId,
          clubId: item.clubId,
          userId: new Types.ObjectId(userId),
        },
        { projection: { _id: 1 } },
      );
      if (!student) throw unavailable();
    }
    return item;
  }

  async context(
    userId: string,
    type: SupportReferenceType,
    referenceId: string,
  ) {
    const item = await this.requireOwned(userId, type, referenceId);
    const payments = await this.connection
      .collection("payment_intents")
      .find(
        {
          userId: new Types.ObjectId(userId),
          ...(type === "payment"
            ? { _id: item._id }
            : {
                referenceType:
                  type === "class_enrollment" ? "coach_class_enrollment" : type,
                referenceId: item._id,
              }),
        },
        {
          projection: {
            _id: 1,
            status: 1,
            amount: 1,
            grossAmount: 1,
            refundedAmount: 1,
            currency: 1,
            providerReference: 1,
            createdAt: 1,
            paidAt: 1,
            failedAt: 1,
            updatedAt: 1,
          },
        },
      )
      .sort({ createdAt: 1 })
      .limit(100)
      .toArray();
    return {
      order: {
        id: String(item._id),
        type,
        title:
          item.sessionTitle ?? item.classTitle ?? item.title ?? "سفارش مرتبط",
        status: item.status,
        paymentStatus:
          item.paymentStatus ?? (type === "payment" ? item.status : null),
        amount:
          item.totalPrice ??
          item.agreedPrice ??
          item.priceSnapshot?.amount ??
          item.amount ??
          null,
        currency: item.currency ?? item.priceSnapshot?.currency ?? "IRR",
        createdAt: iso(item.createdAt),
        cancelledAt: iso(item.cancelledAt),
      },
      payments: payments.map((payment) => ({
        id: String(payment._id),
        status: payment.status,
        amount: payment.amount,
        grossAmount: payment.grossAmount,
        refundedAmount: payment.refundedAmount ?? 0,
        currency: payment.currency ?? "IRR",
        providerReference: payment.providerReference ?? null,
        createdAt: iso(payment.createdAt),
        paidAt: iso(payment.paidAt),
        failedAt: iso(payment.failedAt),
        updatedAt: iso(payment.updatedAt),
      })),
    };
  }
}
function unavailable() {
  return new AppError(
    404,
    "SUPPORT_REFERENCE_NOT_FOUND",
    "سفارش متعلق به حساب شما یافت نشد.",
  );
}
function iso(value: unknown) {
  return value instanceof Date ? value.toISOString() : null;
}
