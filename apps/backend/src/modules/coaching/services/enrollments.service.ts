import { paymentDeadline } from "../../commerce/payment-deadline";
import {
  Atomic,
  inAtomicOperation,
} from "../../../infrastructure/database/atomic-operation";
import { CommerceService } from "../../commerce/commerce.service";
import { assertMockPaymentsEnabled } from "../../commerce/mock-payment-policy";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { AppError } from "../../../common/errors/app.exception";
import { UsersRepository } from "../../users/users.repository";
import type { EnrollmentStatus } from "../coaching.constants";
import {
  ClassEnrollment,
  type ClassEnrollmentDocument,
  TrainingClass,
  type TrainingClassDocument,
} from "../schemas/coaching.schemas";
import { objectId, toPublicDocument } from "../coaching.utils";
import { CoachesService } from "./coaches.service";
import { NotificationsService } from "../../notifications/notifications.service";

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(ClassEnrollment.name)
    private readonly enrollments: Model<ClassEnrollmentDocument>,
    @InjectModel(TrainingClass.name)
    private readonly classes: Model<TrainingClassDocument>,
    private readonly coaches: CoachesService,
    private readonly users: UsersRepository,
    private readonly notifications: NotificationsService,
    private readonly commerce: CommerceService,
  ) {}

  async list(userId: string, classId: string) {
    const trainingClass = await this.requireOwnedClass(userId, classId);
    const items = await this.enrollments
      .find({ classId: trainingClass._id })
      .sort({ registeredAt: -1 })
      .exec();
    const users = await this.users.findManyByIds(
      items.map((item) => item.athleteId),
    );
    const usersById = new Map(users.map((item) => [item.id, item]));
    return {
      items: items.map((item) => ({
        ...serializeEnrollment(item),
        athlete: usersById.get(String(item.athleteId)) ?? null,
      })),
    };
  }

  async listForAthlete(athleteUserId: string) {
    const items = await this.enrollments
      .find({ athleteId: objectId(athleteUserId, "ATHLETE_NOT_FOUND") })
      .sort({ registeredAt: -1 })
      .exec();
    const classIds = items.map((item) => item.classId);
    const classes = await this.classes.find({ _id: { $in: classIds } }).exec();
    const classesById = new Map(
      classes.map((item) => [String(item._id), item]),
    );
    return {
      items: items.flatMap((item) => {
        const trainingClass = classesById.get(String(item.classId));
        return trainingClass ? [serializeEnrollment(item, trainingClass)] : [];
      }),
    };
  }

  async addByCoach(userId: string, classId: string, athleteId: string) {
    return this.createEnrollment(userId, classId, athleteId, true);
  }

  async enrollSelf(athleteUserId: string, classId: string) {
    return this.createEnrollment(athleteUserId, classId, athleteUserId, false);
  }

  @Atomic("enrollments")
  async cancelByAthlete(athleteUserId: string, enrollmentId: string) {
    const enrollment = await this.enrollments
      .findOne({
        _id: objectId(enrollmentId, "ENROLLMENT_NOT_FOUND"),
        athleteId: objectId(athleteUserId, "ATHLETE_NOT_FOUND"),
        status: { $in: ["pending", "active"] },
      })
      .exec();
    if (!enrollment) {
      throw new AppError(404, "ENROLLMENT_NOT_FOUND", "Enrollment not found");
    }
    const trainingClass = await this.classes
      .findById(enrollment.classId)
      .exec();
    if (!trainingClass) {
      throw new AppError(404, "CLASS_NOT_FOUND", "Class not found");
    }
    if (trainingClass.courseStartAt <= new Date()) {
      throw new AppError(
        409,
        "CLASS_ALREADY_STARTED",
        "Enrollment cannot be cancelled after the class starts",
      );
    }
    const refundAmount =
      enrollment.paymentStatus === "paid" ? enrollment.priceSnapshot.amount : 0;
    const cancelled = await this.enrollments
      .findOneAndUpdate(
        { _id: enrollment._id, status: enrollment.status },
        {
          $set: {
            status: "cancelled",
            cancelledAt: new Date(),
            refundPercent: refundAmount > 0 ? 100 : 0,
            refundAmount,
            ...(refundAmount > 0 ? { paymentStatus: "refunded" } : {}),
          },
        },
        { new: true },
      )
      .exec();
    if (!cancelled) {
      throw new AppError(
        409,
        "ENROLLMENT_STATUS_CHANGED",
        "Enrollment status changed before cancellation",
      );
    }
    await this.releaseCapacity(cancelled.classId);
    if (refundAmount > 0)
      await this.commerce.refundCoaching(
        "coach_class_enrollment",
        cancelled._id,
        refundAmount,
      );
    await this.notifications.notifyBookingCancelled({
      userId: cancelled.athleteId,
      bookingId: cancelled._id,
      title: trainingClass.title,
    });
    return serializeEnrollment(cancelled, trainingClass);
  }

  async approveMockPayment(userId: string, enrollmentId: string) {
    return this.resolvePayment(userId, enrollmentId, "paid");
  }
  async rejectMockPayment(userId: string, enrollmentId: string) {
    return this.resolvePayment(userId, enrollmentId, "failed");
  }
  private async resolvePayment(
    userId: string,
    enrollmentId: string,
    status: "paid" | "failed",
  ) {
    assertMockPaymentsEnabled();
    const enrollment = await this.requireAthleteEnrollment(
      userId,
      enrollmentId,
    );
    if (enrollment.paymentStatus !== status) {
      const intent = await this.commerce.createIntent(userId, {
        referenceType: "coach_class_enrollment",
        referenceId: enrollmentId,
        idempotencyKey: `coach-class-${enrollmentId}-${enrollment.registeredAt.getTime()}`,
        walletAmount: 0,
        returnUrl: "https://app.gym4me.ir/athlete/classes",
      });
      await this.commerce.simulate(userId, intent.id, status);
    }
    const current = await this.requireAthleteEnrollment(userId, enrollmentId);
    const trainingClass = await this.classes.findById(current.classId).exec();
    if (!trainingClass)
      throw new AppError(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
    return serializeEnrollment(current, trainingClass);
  }

  @Atomic("enrollments")
  async updateStatus(
    userId: string,
    enrollmentId: string,
    status: EnrollmentStatus,
  ) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    const enrollment = await this.enrollments
      .findOne({
        _id: objectId(enrollmentId, "ENROLLMENT_NOT_FOUND"),
        coachId: coach._id,
      })
      .exec();
    if (!enrollment)
      throw new AppError(404, "ENROLLMENT_NOT_FOUND", "Enrollment not found");
    if (status === "active" && enrollment.paymentStatus === "pending") {
      throw new AppError(
        409,
        "PAYMENT_REQUIRED",
        "Payment must be completed before enrollment approval",
      );
    }
    assertEnrollmentTransition(enrollment.status, status);
    const wasOccupying = occupiesCapacity(enrollment.status);
    const willOccupy = occupiesCapacity(status);
    if (wasOccupying && !willOccupy) {
      await this.classes.updateOne(
        { _id: enrollment.classId, enrollmentCount: { $gt: 0 } },
        { $inc: { enrollmentCount: -1 } },
      );
      enrollment.cancelledAt = new Date();
    }
    if (!wasOccupying && willOccupy) {
      const updated = await this.classes.findOneAndUpdate(
        {
          _id: enrollment.classId,
          $expr: { $lt: ["$enrollmentCount", "$capacity"] },
        },
        { $inc: { enrollmentCount: 1 } },
      );
      if (!updated)
        throw new AppError(
          409,
          "CLASS_FULL",
          "Class capacity has been reached",
        );
      enrollment.cancelledAt = undefined;
    }
    enrollment.status = status;
    if (
      wasOccupying &&
      !willOccupy &&
      enrollment.paymentStatus === "paid" &&
      ["rejected", "cancelled"].includes(status)
    ) {
      const amount = enrollment.priceSnapshot.amount;
      await this.commerce.refundCoaching(
        "coach_class_enrollment",
        enrollment._id,
        amount,
      );
      enrollment.refundAmount = amount;
      enrollment.refundPercent = 100;
      enrollment.paymentStatus = "refunded";
    }
    await enrollment.save();
    const trainingClass = await this.classes
      .findById(enrollment.classId)
      .exec();
    if (trainingClass && status === "active") {
      await this.notifications.notifyBookingConfirmed({
        userId: enrollment.athleteId,
        bookingId: enrollment._id,
        title: trainingClass.title,
      });
    } else if (
      trainingClass &&
      (status === "rejected" || status === "cancelled")
    ) {
      await this.notifications.notifyBookingCancelled({
        userId: enrollment.athleteId,
        bookingId: enrollment._id,
        title: trainingClass.title,
      });
    }
    return serializeEnrollment(enrollment);
  }

  @Atomic("enrollments")
  private async createEnrollment(
    actorUserId: string,
    classId: string,
    athleteId: string,
    byCoach: boolean,
  ) {
    const classObjectId = objectId(classId, "CLASS_NOT_FOUND");
    const trainingClass = byCoach
      ? await this.requireOwnedClass(actorUserId, classId)
      : await this.classes.findById(classObjectId).exec();
    if (!trainingClass)
      throw new AppError(404, "CLASS_NOT_FOUND", "Class not found");
    if (trainingClass.status !== "published" && !byCoach) {
      throw new AppError(
        409,
        "CLASS_NOT_OPEN",
        "Class is not open for enrollment",
      );
    }
    const now = new Date();
    if (trainingClass.courseStartAt <= now) {
      throw new AppError(
        409,
        "REGISTRATION_CLOSED",
        "زمان ثبت‌نام این دوره گذشته است.",
      );
    }
    if (
      !byCoach &&
      trainingClass.registrationStartAt &&
      now < trainingClass.registrationStartAt
    ) {
      throw new AppError(
        409,
        "REGISTRATION_NOT_STARTED",
        "Registration has not started",
      );
    }
    if (
      !byCoach &&
      trainingClass.registrationEndAt &&
      now > trainingClass.registrationEndAt
    ) {
      throw new AppError(409, "REGISTRATION_CLOSED", "Registration is closed");
    }
    const athleteObjectId = objectId(athleteId, "ATHLETE_NOT_FOUND");
    const existing = await this.enrollments
      .findOne({ classId: trainingClass._id, athleteId: athleteObjectId })
      .exec();
    if (existing && !["cancelled", "rejected"].includes(existing.status)) {
      throw new AppError(
        409,
        "ALREADY_ENROLLED",
        "Athlete is already enrolled in this class",
      );
    }
    const reserved = await this.classes.findOneAndUpdate(
      {
        _id: trainingClass._id,
        $expr: { $lt: ["$enrollmentCount", "$capacity"] },
      },
      { $inc: { enrollmentCount: 1 } },
      { new: true },
    );
    if (!reserved)
      throw new AppError(409, "CLASS_FULL", "Class capacity has been reached");
    try {
      const requiresPayment = trainingClass.price.amount > 0;
      const status =
        !requiresPayment &&
        (byCoach || trainingClass.enrollmentMode === "automatic")
          ? "active"
          : "pending";
      const enrollmentPayload = {
        classId: trainingClass._id,
        coachId: trainingClass.ownerCoachId,
        athleteId: athleteObjectId,
        status,
        priceSnapshot: trainingClass.price,
        paymentStatus: requiresPayment ? "pending" : "not_required",
        paymentExpiresAt: requiresPayment
          ? paymentDeadline(trainingClass.courseStartAt)
          : null,
        createdBy: objectId(actorUserId, "USER_NOT_FOUND"),
        registeredAt: now,
        cancelledAt: undefined,
        refundPercent: null,
        refundAmount: null,
      } as const;
      const created = existing
        ? await this.enrollments
            .findOneAndUpdate(
              {
                _id: existing._id,
                status: { $in: ["cancelled", "rejected"] },
              },
              { $set: enrollmentPayload, $unset: { cancelledAt: 1 } },
              { new: true },
            )
            .orFail()
            .exec()
        : await this.enrollments.create(enrollmentPayload);
      if (created.status === "active") {
        await this.notifications.notifyBookingConfirmed({
          userId: created.athleteId,
          bookingId: created._id,
          title: trainingClass.title,
        });
      }
      return serializeEnrollment(created, trainingClass);
    } catch (error) {
      if (inAtomicOperation()) {
        if (isDuplicateKey(error))
          throw new AppError(409, "ALREADY_ENROLLED", "ثبت‌نام تکراری است.");
        throw error;
      }
      await this.classes.updateOne(
        { _id: trainingClass._id, enrollmentCount: { $gt: 0 } },
        { $inc: { enrollmentCount: -1 } },
      );
      if (isDuplicateKey(error)) {
        throw new AppError(
          409,
          "ALREADY_ENROLLED",
          "Athlete is already enrolled in this class",
        );
      }
      throw error;
    }
  }

  private async requireOwnedClass(userId: string, classId: string) {
    const coach = await this.coaches.requireOwnedCoach(userId);
    const trainingClass = await this.classes
      .findOne({
        _id: objectId(classId, "CLASS_NOT_FOUND"),
        ownerCoachId: coach._id,
      })
      .exec();
    if (!trainingClass)
      throw new AppError(404, "CLASS_NOT_FOUND", "Class not found");
    return trainingClass;
  }

  private async requireAthleteEnrollment(
    athleteUserId: string,
    enrollmentId: string,
  ) {
    const enrollment = await this.enrollments
      .findOne({
        _id: objectId(enrollmentId, "ENROLLMENT_NOT_FOUND"),
        athleteId: objectId(athleteUserId, "ATHLETE_NOT_FOUND"),
      })
      .exec();
    if (!enrollment) {
      throw new AppError(404, "ENROLLMENT_NOT_FOUND", "Enrollment not found");
    }
    return enrollment;
  }

  private async releaseCapacity(classId: TrainingClassDocument["_id"]) {
    await this.classes.updateOne(
      { _id: classId, enrollmentCount: { $gt: 0 } },
      { $inc: { enrollmentCount: -1 } },
    );
  }
}

function serializeEnrollment(
  enrollment: ClassEnrollmentDocument,
  trainingClass?: TrainingClassDocument,
) {
  return {
    ...toPublicDocument(enrollment),
    ...(trainingClass
      ? {
          classTitle: trainingClass.title,
          classSlug: trainingClass.slug,
          courseStartAt: trainingClass.courseStartAt.toISOString(),
          courseEndAt: trainingClass.courseEndAt.toISOString(),
          deliveryMode: trainingClass.deliveryMode,
          venue: trainingClass.venue
            ? toPublicDocumentValue(trainingClass.venue)
            : null,
        }
      : {}),
  };
}

function toPublicDocumentValue(value: unknown): unknown {
  if (value && typeof value === "object" && "toObject" in value) {
    return (value as { toObject: () => unknown }).toObject();
  }
  return value;
}

function occupiesCapacity(status: EnrollmentStatus) {
  return status === "pending" || status === "active";
}

function assertEnrollmentTransition(
  from: EnrollmentStatus,
  to: EnrollmentStatus,
) {
  const allowed: Record<EnrollmentStatus, EnrollmentStatus[]> = {
    pending: ["active", "rejected", "cancelled"],
    active: ["cancelled", "completed"],
    rejected: [],
    cancelled: ["active"],
    completed: [],
  };
  if (from !== to && !allowed[from].includes(to)) {
    throw new AppError(
      409,
      "ENROLLMENT_STATUS_TRANSITION_INVALID",
      `Cannot change enrollment status from ${from} to ${to}`,
    );
  }
}

function isDuplicateKey(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === 11000,
  );
}
