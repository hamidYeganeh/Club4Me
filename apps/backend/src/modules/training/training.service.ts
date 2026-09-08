import { Injectable } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import { z } from "zod";
import { AppError } from "../../common/errors/app.exception";
import { parse } from "../../lib/validate";
import { trainingExercises } from "./vital-catalog";
import {
  assignmentSchema,
  objectId,
  planWriteSchema,
  sessionWriteSchema,
} from "./training.contracts";
import type {
  WorkoutAssignmentRecord,
  WorkoutPlanRecord,
  WorkoutSessionRecord,
} from "./training.models";

const id = (v: string) => new Types.ObjectId(parse(objectId, v));
const dto = <T extends { _id: unknown }>(v: T) => {
  const { _id, ...rest } = v;
  return { ...rest, id: String(_id) };
};
const missing = () => new AppError(404, "NOT_FOUND", "مورد پیدا نشد");
const conflict = () =>
  new AppError(
    409,
    "TRAINING_CONFLICT",
    "نسخه جدیدتری ذخیره شده؛ ابتدا آن را دریافت کنید",
  );
const consentVersion = "training-sharing-v1";

@Injectable()
export class TrainingService {
  constructor(
    @InjectConnection() private readonly db: Connection,
    @InjectModel("WorkoutPlan")
    private readonly plans: Model<WorkoutPlanRecord>,
    @InjectModel("WorkoutAssignment")
    private readonly assignments: Model<WorkoutAssignmentRecord>,
    @InjectModel("WorkoutSession")
    private readonly sessions: Model<WorkoutSessionRecord>,
  ) {}

  exercises() {
    return { items: trainingExercises() };
  }

  async coach(userId: string) {
    const coach = await this.db
      .collection("coaches")
      .findOne({ userId: id(userId), reviewStatus: "approved" });
    if (!coach)
      throw new AppError(
        403,
        "COACH_REQUIRED",
        "پروفایل مربی تأییدشده لازم است",
      );
    return coach._id as Types.ObjectId;
  }

  async relationship(
    coachId: Types.ObjectId,
    athleteId: Types.ObjectId,
    ref?: WorkoutAssignmentRecord["relationship"],
    at = new Date(),
  ) {
    const allowed = { $in: ["paid", "not_required"] };
    if (!ref || ref.type === "package") {
      const purchase = await this.db
        .collection("coach_package_purchases")
        .findOne({
          coachId,
          athleteId,
          status: "active",
          paymentStatus: allowed,
          ...(ref ? { _id: id(ref.id) } : {}),
          $or: [{ expiresAt: null }, { expiresAt: { $gt: at } }],
        });
      if (purchase)
        return { type: "package" as const, id: String(purchase._id) };
    }
    if (!ref || ref.type === "class") {
      const enrollments = await this.db
        .collection("class_enrollments")
        .find({
          athleteId,
          status: "active",
          paymentStatus: allowed,
          ...(ref ? { classId: id(ref.id) } : {}),
        })
        .toArray();
      for (const enrollment of enrollments) {
        const course = await this.db.collection("classes").findOne({
          _id: enrollment.classId,
          ownerCoachId: coachId,
          status: {
            $in: ["published", "registration_closed", "in_progress"],
          },
          courseEndAt: { $gt: at },
        });
        if (course) return { type: "class" as const, id: String(course._id) };
      }
    }
    if (!ref || ref.type === "booking") {
      const bookings = await this.db
        .collection("session_bookings")
        .find({
          coachId,
          athleteId,
          status: "confirmed",
          paymentStatus: allowed,
          ...(ref ? { _id: id(ref.id) } : {}),
        })
        .toArray();
      for (const booking of bookings) {
        const session = await this.db.collection("class_sessions").findOne({
          _id: booking.sessionId,
          endAt: { $gt: at },
          status: { $nin: ["cancelled", "rescheduled"] },
        });
        if (session)
          return { type: "booking" as const, id: String(booking._id) };
      }
    }
    return null;
  }

  async clients(userId: string) {
    const coachId = await this.coach(userId);
    const classes = await this.db
      .collection("classes")
      .find({
        ownerCoachId: coachId,
        status: { $in: ["published", "registration_closed", "in_progress"] },
        courseEndAt: { $gt: new Date() },
      })
      .project({ title: 1 })
      .toArray();
    const [packages, bookings, enrollments] = await Promise.all([
      this.db
        .collection("coach_package_purchases")
        .find({ coachId, status: "active" })
        .project({ athleteId: 1 })
        .toArray(),
      this.db
        .collection("session_bookings")
        .find({ coachId, status: "confirmed" })
        .project({ athleteId: 1 })
        .toArray(),
      this.db
        .collection("class_enrollments")
        .find({ classId: { $in: classes.map((c) => c._id) }, status: "active" })
        .project({ athleteId: 1 })
        .toArray(),
    ]);
    const athleteIds = [
      ...new Set(
        [...packages, ...bookings, ...enrollments].map((x) =>
          String(x.athleteId),
        ),
      ),
    ];
    const items = [];
    for (const athlete of athleteIds) {
      if (!(await this.relationship(coachId, id(athlete)))) continue;
      const user = await this.db
        .collection("users")
        .findOne(
          { _id: id(athlete), status: "active" },
          { projection: { firstName: 1, lastName: 1 } },
        );
      if (user)
        items.push({
          id: athlete,
          name:
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            "ورزشکار",
        });
    }
    return {
      items,
      classes: classes.map((c) => ({ id: String(c._id), title: c.title })),
    };
  }

  async listPlans(userId: string) {
    const coachId = await this.coach(userId);
    return {
      items: (
        await this.plans.find({ coachId }).sort({ updatedAt: -1 }).lean()
      ).map(dto),
    };
  }

  async savePlan(userId: string, planId: string, body: unknown) {
    const input = parse(planWriteSchema, body),
      coachId = await this.coach(userId);
    const key = id(planId);
    for (const day of input.plan.days)
      for (const exercise of day.exercises)
        if (!trainingExercises().some((e) => e.id === exercise.exerciseId))
          throw new AppError(400, "INVALID_EXERCISE", "حرکت معتبر نیست");
    const previous = await this.plans.findOne({ _id: key, coachId }).lean();
    if (previous?.versions.some((v) => v.mutationId === input.mutationId))
      return dto(previous);
    const version = {
      version: input.expectedVersion + 1,
      mutationId: input.mutationId,
      createdAt: new Date(),
      plan: input.plan,
    };
    if (!previous) {
      if (input.expectedVersion !== 0) throw conflict();
      try {
        return dto(
          (
            await this.plans.create({
              _id: key,
              coachId,
              version: 1,
              versions: [version],
            })
          ).toObject(),
        );
      } catch (error) {
        if ((error as { code?: number }).code === 11000) throw conflict();
        throw error;
      }
    }
    if (previous.versions.length >= 200)
      throw new AppError(
        400,
        "VERSION_LIMIT",
        "برای ادامه یک برنامه تازه بسازید",
      );
    const saved = await this.plans
      .findOneAndUpdate(
        { _id: key, coachId, version: input.expectedVersion },
        { $inc: { version: 1 }, $push: { versions: version } },
        { new: true },
      )
      .lean();
    if (!saved) throw conflict();
    return dto(saved);
  }

  async assign(userId: string, body: unknown) {
    const input = parse(assignmentSchema, body),
      coachId = await this.coach(userId);
    const record = await this.plans
      .findOne({ _id: id(input.planId), coachId })
      .lean();
    const version = record?.versions.find((v) => v.version === input.version);
    if (!record || !version) throw missing();
    let athletes: string[];
    if (input.recipient === "class") {
      const course = await this.db
        .collection("classes")
        .findOne({ _id: id(input.recipientId), ownerCoachId: coachId });
      if (!course) throw missing();
      athletes = (
        await this.db
          .collection("class_enrollments")
          .find({
            classId: course._id,
            status: "active",
            paymentStatus: { $in: ["paid", "not_required"] },
          })
          .toArray()
      ).map((e) => String(e.athleteId));
    } else athletes = [input.recipientId];
    if (!athletes.length)
      throw new AppError(400, "NO_ATHLETES", "این کلاس شاگرد فعال ندارد");
    const targets = [];
    for (const athlete of athletes) {
      const relationship = await this.relationship(
        coachId,
        id(athlete),
        input.recipient === "class"
          ? { type: "class", id: input.recipientId }
          : undefined,
      );
      if (!relationship)
        throw new AppError(
          403,
          "NO_RELATIONSHIP",
          "خدمت فعال با این ورزشکار ندارید",
        );
      targets.push({ athlete, relationship });
    }
    const items = [];
    for (const target of targets) {
      const assignment = await this.assignments
        .findOneAndUpdate(
          {
            coachId,
            athleteId: id(target.athlete),
            mutationId: input.mutationId,
          },
          {
            $setOnInsert: {
              coachId,
              athleteId: id(target.athlete),
              mutationId: input.mutationId,
              planId: record._id,
              version: input.version,
              snapshot: version.plan,
              startsAt: new Date(input.startsAt),
              endsAt: new Date(input.endsAt),
              relationship: target.relationship,
              status: "active",
              consentAt: null,
              consentVersion: null,
            },
          },
          { new: true, upsert: true },
        )
        .lean();
      items.push(dto(assignment!));
    }
    return { items };
  }

  async listAssignments(userId: string, asCoach = false) {
    const filter = asCoach
      ? { coachId: await this.coach(userId) }
      : { athleteId: id(userId) };
    const records = await this.assignments
      .find(filter)
      .sort({ createdAt: -1 })
      .lean();
    return {
      items: await Promise.all(
        records.map(async (a) => {
          const available =
            a.status === "active" &&
            a.endsAt > new Date() &&
            !!(await this.relationship(a.coachId, a.athleteId, a.relationship));
          return { ...dto(a), available };
        }),
      ),
    };
  }

  async consent(userId: string, assignmentId: string, body: unknown) {
    const { accepted } = parse(z.object({ accepted: z.boolean() }), body);
    const assignment = await this.assignments.findOne({
      _id: id(assignmentId),
      athleteId: id(userId),
    });
    if (!assignment) throw missing();
    if (
      accepted &&
      (assignment.status !== "active" ||
        assignment.endsAt <= new Date() ||
        !(await this.relationship(
          assignment.coachId,
          assignment.athleteId,
          assignment.relationship,
        )))
    )
      throw new AppError(403, "INACTIVE_ASSIGNMENT", "برنامه دیگر فعال نیست");
    assignment.consentAt = accepted ? new Date() : null;
    assignment.consentVersion = accepted ? consentVersion : null;
    await assignment.save();
    return { accepted };
  }

  async revoke(userId: string, assignmentId: string) {
    const coachId = await this.coach(userId);
    const saved = await this.assignments
      .findOneAndUpdate(
        { _id: id(assignmentId), coachId },
        { $set: { status: "revoked", consentAt: null, consentVersion: null } },
        { new: true },
      )
      .lean();
    if (!saved) throw missing();
    return dto(saved);
  }

  async saveSession(userId: string, clientId: string, body: unknown) {
    parse(z.string().uuid(), clientId);
    const input = parse(sessionWriteSchema, body),
      athleteId = id(userId);
    const previous = await this.sessions
      .findOne({ athleteId, clientId })
      .lean();
    if (previous?.mutations.includes(input.mutationId)) return dto(previous);
    if (
      previous &&
      (previous.revision !== input.expectedRevision ||
        previous.status !== "active")
    )
      throw conflict();
    const assignment = await this.assignments
      .findOne({ _id: id(input.assignmentId), athleteId })
      .lean();
    if (!assignment) throw missing();
    // Revocation stops sharing immediately, but never prevents the athlete saving their own existing log.
    if (!previous && (!assignment.consentAt || assignment.status !== "active"))
      throw new AppError(
        403,
        "CONSENT_REQUIRED",
        "ابتدا دریافت برنامه و اشتراک نتیجه با مربی را تأیید کنید",
      );
    if (
      !previous &&
      !(await this.relationship(
        assignment.coachId,
        athleteId,
        assignment.relationship,
      ))
    )
      throw new AppError(
        403,
        "NO_RELATIONSHIP",
        "ارتباط فعال با مربی پایان یافته است؛ ثبت محلی را به‌عنوان پشتیبان نگه دارید",
      );
    const started = new Date(input.startedAt);
    if (
      started > new Date(Date.now() + 60000) ||
      started < assignment.startsAt ||
      started >= assignment.endsAt ||
      (!previous && started < new Date(Date.now() - 7 * 86400000))
    )
      throw new AppError(
        400,
        "INVALID_SESSION_TIME",
        "زمان شروع خارج از اعتبار برنامه است",
      );
    if (
      input.finishedAt &&
      new Date(input.finishedAt) > new Date(Date.now() + 60000)
    )
      throw new AppError(400, "INVALID_SESSION_TIME", "زمان پایان معتبر نیست");
    if (
      previous &&
      (String(previous.assignmentId) !== input.assignmentId ||
        previous.dayId !== input.dayId ||
        +previous.startedAt !== +started)
    )
      throw conflict();
    const snapshot = previous?.snapshot ?? assignment.snapshot;
    const day = snapshot.days.find((d) => d.id === input.dayId);
    if (
      !day ||
      input.sets.some(
        (s) =>
          !day.exercises[s.exerciseIndex] ||
          s.setIndex >= day.exercises[s.exerciseIndex]!.sets,
      )
    )
      throw new AppError(400, "INVALID_SET", "ست با نسخه برنامه مطابقت ندارد");
    const data = {
      assignmentId: assignment._id,
      dayId: input.dayId,
      snapshot,
      startedAt: started,
      finishedAt: input.finishedAt ? new Date(input.finishedAt) : null,
      status: input.status,
      sets: input.sets,
      note: input.note,
    };
    if (!previous) {
      if (input.expectedRevision !== 0) throw conflict();
      try {
        return dto(
          (
            await this.sessions.create({
              athleteId,
              clientId,
              ...data,
              revision: 1,
              mutations: [input.mutationId],
            })
          ).toObject(),
        );
      } catch (error) {
        if ((error as { code?: number }).code === 11000) throw conflict();
        throw error;
      }
    }
    const saved = await this.sessions
      .findOneAndUpdate(
        {
          athleteId,
          clientId,
          revision: input.expectedRevision,
          status: "active",
        },
        {
          $set: data,
          $inc: { revision: 1 },
          $push: { mutations: { $each: [input.mutationId], $slice: -100 } },
        },
        { new: true },
      )
      .lean();
    if (!saved) throw conflict();
    return dto(saved);
  }

  async listSessions(userId: string) {
    return {
      items: (
        await this.sessions
          .find({ athleteId: id(userId) })
          .sort({ startedAt: -1 })
          .limit(1000)
          .lean()
      ).map(dto),
    };
  }

  async coachSessions(userId: string, assignmentId: string) {
    const coachId = await this.coach(userId);
    const assignment = await this.assignments
      .findOne({ _id: id(assignmentId), coachId })
      .lean();
    if (!assignment) throw missing();
    if (
      !assignment.consentAt ||
      assignment.status !== "active" ||
      assignment.endsAt <= new Date() ||
      !(await this.relationship(
        coachId,
        assignment.athleteId,
        assignment.relationship,
      ))
    )
      throw new AppError(
        403,
        "SHARING_DISABLED",
        "دسترسی به نتایج این ورزشکار فعال نیست",
      );
    return {
      items: (
        await this.sessions
          .find({
            assignmentId: assignment._id,
            athleteId: assignment.athleteId,
          })
          .sort({ startedAt: -1 })
          .limit(1000)
          .lean()
      ).map(dto),
    };
  }
}
