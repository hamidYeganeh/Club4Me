import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { AppError } from "../../../common/errors/app.exception";
import type { EnrollmentStatus, PaymentStatus } from "../coaching.constants";
import {
  ClassEnrollment,
  type ClassEnrollmentDocument,
  TrainingClass,
  type TrainingClassDocument,
} from "../schemas/coaching.schemas";
import { objectId, toPublicDocument } from "../coaching.utils";
import { CoachesService } from "./coaches.service";

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(ClassEnrollment.name)
    private readonly enrollments: Model<ClassEnrollmentDocument>,
    @InjectModel(TrainingClass.name)
    private readonly classes: Model<TrainingClassDocument>,
    private readonly coaches: CoachesService,
  ) {}

  async list(userId: string, classId: string) {
    const trainingClass = await this.requireOwnedClass(userId, classId);
    const items = await this.enrollments
      .find({ classId: trainingClass._id })
      .sort({ registeredAt: -1 })
      .exec();
    return { items: items.map(toPublicDocument) };
  }

  async addByCoach(userId: string, classId: string, athleteId: string) {
    return this.createEnrollment(userId, classId, athleteId, true);
  }

  async enrollSelf(athleteUserId: string, classId: string) {
    return this.createEnrollment(athleteUserId, classId, athleteUserId, false);
  }

  async updateStatus(
    userId: string,
    enrollmentId: string,
    status: EnrollmentStatus,
    paymentStatus?: PaymentStatus,
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
    if (paymentStatus) enrollment.paymentStatus = paymentStatus;
    await enrollment.save();
    return toPublicDocument(enrollment);
  }

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
    if (
      !["published", "registration_closed"].includes(trainingClass.status) &&
      !byCoach
    ) {
      throw new AppError(
        409,
        "CLASS_NOT_OPEN",
        "Class is not open for enrollment",
      );
    }
    const now = new Date();
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
      const status =
        byCoach || trainingClass.enrollmentMode === "automatic"
          ? "active"
          : "pending";
      const created = await this.enrollments.create({
        classId: trainingClass._id,
        coachId: trainingClass.ownerCoachId,
        athleteId: objectId(athleteId, "ATHLETE_NOT_FOUND"),
        status,
        priceSnapshot: trainingClass.price,
        paymentStatus:
          trainingClass.price.amount > 0 ? "pending" : "not_required",
        createdBy: objectId(actorUserId, "USER_NOT_FOUND"),
      });
      return toPublicDocument(created);
    } catch (error) {
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
