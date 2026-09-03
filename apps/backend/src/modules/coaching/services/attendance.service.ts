import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../../common/errors/app.exception";
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
  ) {}

  async list(userId: string, sessionId: string) {
    const session = await this.sessions.requireOwnedDocument(userId, sessionId);
    const items = await this.attendance
      .find({ sessionId: session._id })
      .sort({ updatedAt: -1 })
      .exec();
    return { items: items.map(toPublicDocument) };
  }

  async record(
    userId: string,
    sessionId: string,
    input: BulkAttendanceDto["items"],
  ) {
    const session = await this.sessions.requireOwnedDocument(userId, sessionId);
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
        return {
          updateOne: {
            filter: {
              sessionId: session._id,
              athleteId: objectId(item.athleteId),
            },
            update: {
              $set: {
                coachId: session.ownerCoachId,
                ...source,
                status: item.status,
                note: item.note?.trim(),
                checkedInAt:
                  item.status === "present" || item.status === "late"
                    ? new Date()
                    : undefined,
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
