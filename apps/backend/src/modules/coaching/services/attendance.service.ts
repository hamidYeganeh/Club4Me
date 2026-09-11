import { Atomic } from "../../../infrastructure/database/atomic-operation";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../../common/errors/app.exception";
import { UsersRepository } from "../../users/users.repository";
import type { BulkAttendanceDto } from "../dto/coaching.dto";
import {
  ClassEnrollment,
  type ClassEnrollmentDocument,
  SessionAttendance,
  type SessionAttendanceDocument,
  SessionBooking,
  type SessionBookingDocument,
} from "../schemas/coaching.schemas";
import { objectId, toPublicDocument } from "../coaching.utils";
import { SessionsService } from "./sessions.service";

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(SessionAttendance.name)
    private readonly attendance: Model<SessionAttendanceDocument>,
    @InjectModel(ClassEnrollment.name)
    private readonly enrollments: Model<ClassEnrollmentDocument>,
    @InjectModel(SessionBooking.name)
    private readonly bookings: Model<SessionBookingDocument>,
    private readonly sessions: SessionsService,
    private readonly users: UsersRepository,
  ) {}

  async list(userId: string, sessionId: string) {
    const session = await this.sessions.requireOwnedDocument(userId, sessionId);
    const [records, enrollments, bookings] = await Promise.all([
      this.attendance.find({ sessionId: session._id }).exec(),
      session.classId
        ? this.enrollments
            .find({
              classId: session.classId,
              status: { $in: ["active", "completed"] },
            })
            .exec()
        : Promise.resolve([]),
      this.bookings
        .find({
          sessionId: session._id,
          status: { $in: ["confirmed", "completed", "no_show"] },
        })
        .exec(),
    ]);
    const participants = new Map<
      string,
      { sourceType: "enrollment" | "booking"; sourceId: Types.ObjectId }
    >();
    for (const enrollment of enrollments) {
      participants.set(String(enrollment.athleteId), {
        sourceType: "enrollment",
        sourceId: enrollment._id,
      });
    }
    for (const booking of bookings) {
      participants.set(String(booking.athleteId), {
        sourceType: "booking",
        sourceId: booking._id,
      });
    }
    const users = await this.users.findManyByIds([...participants.keys()]);
    const usersById = new Map(users.map((item) => [item.id, item]));
    const recordsByAthlete = new Map(
      records.map((item) => [String(item.athleteId), item]),
    );
    return {
      session: {
        id: String(session._id),
        title: session.title,
        startAt: session.startAt.toISOString(),
        endAt: session.endAt.toISOString(),
      },
      items: [...participants].map(([athleteId, source]) => {
        const record = recordsByAthlete.get(athleteId);
        return {
          ...(record ? toPublicDocument(record) : {}),
          athleteId,
          ...source,
          sourceId: String(source.sourceId),
          athlete: usersById.get(athleteId) ?? null,
          status: record?.status ?? "unrecorded",
          note: record?.note ?? null,
          checkedInAt: record?.checkedInAt?.toISOString() ?? null,
          checkedOutAt: record?.checkedOutAt?.toISOString() ?? null,
        };
      }),
    };
  }

  @Atomic("attendance")
  async record(
    userId: string,
    sessionId: string,
    input: BulkAttendanceDto["items"],
  ) {
    const session = await this.sessions.requireOwnedDocument(userId, sessionId);
    if (session.status === "cancelled") throw new AppError(409, "CLASS_SESSION_CANCELLED", "Cancelled sessions cannot record attendance");
    if (!input.length) return this.list(userId, sessionId);
    const previousRecords = await this.attendance.find({sessionId: session._id}).exec();
    const previousByAthlete = new Map(previousRecords.map(item => [String(item.athleteId), item]));
    for (const item of input) {
      const previous = previousByAthlete.get(item.athleteId);
      if (item.checkedOut && (!["present", "late"].includes(item.status) || !previous?.checkedInAt || !["present", "late"].includes(previous.status))) {
        throw new AppError(409, "ATTENDANCE_CHECKOUT_REQUIRES_CHECKIN", "Record arrival before departure");
      }
    }
    const athleteIds = input.map((item) =>
      objectId(item.athleteId, "ATHLETE_NOT_FOUND"),
    );
    const [enrollments, bookings] = await Promise.all([
      session.classId
        ? this.enrollments
            .find({
              classId: session.classId,
              athleteId: { $in: athleteIds },
              status: { $in: ["active", "completed"] },
            })
            .exec()
        : Promise.resolve([]),
      this.bookings
        .find({
          sessionId: session._id,
          athleteId: { $in: athleteIds },
          status: { $in: ["confirmed", "completed", "no_show"] },
        })
        .exec(),
    ]);
    const sources = new Map<
      string,
      { sourceType: "enrollment" | "booking"; sourceId: Types.ObjectId }
    >();
    for (const enrollment of enrollments) {
      sources.set(String(enrollment.athleteId), {
        sourceType: "enrollment",
        sourceId: enrollment._id,
      });
    }
    for (const booking of bookings) {
      sources.set(String(booking.athleteId), {
        sourceType: "booking",
        sourceId: booking._id,
      });
    }
    const unknown = input
      .filter((item) => !sources.has(objectId(item.athleteId).toHexString()))
      .map((item) => item.athleteId);
    if (unknown.length) {
      throw new AppError(
        400,
        "ATTENDANCE_PARTICIPANT_INVALID",
        "Attendance can only be recorded for session participants",
        { athleteIds: unknown },
      );
    }
    const recordedBy = objectId(userId, "USER_NOT_FOUND");
    await this.attendance.bulkWrite(
      input.map((item) => {
        const source = sources.get(objectId(item.athleteId).toHexString())!;
        const previous = previousByAthlete.get(item.athleteId);
        const now = new Date();
        const present = item.status === "present" || item.status === "late";
        const event = item.checkedOut && !previous?.checkedOutAt ? "checked_out" : item.status;
        return {
          updateOne: {
            filter: {
              sessionId: session._id,
              athleteId: objectId(item.athleteId),
            },
            update: {
              ...(event !== previous?.status && !(event === "checked_out" && previous?.checkedOutAt) ? {$push: {changes: {actorId: userId, at: now, before: previous?.status ?? "unrecorded", after: event}}} : {}),
              $set: {
                coachId: session.ownerCoachId,
                ...source,
                status: item.status,
                note: item.note?.trim(),
                checkedInAt: present ? previous?.checkedInAt ?? now : null,
                checkedOutAt: present ? previous?.checkedOutAt ?? (item.checkedOut ? now : null) : null,
                recordedBy,
              },
            },
            upsert: true,
          },
        };
      }),
    );
    return this.list(userId, sessionId);
  }
}
