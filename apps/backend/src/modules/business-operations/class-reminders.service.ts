import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { AppConfigService } from "../../config/app-config.service";
import { RedisService } from "../../infrastructure/redis/redis.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  ClubStudent,
  type ClubStudentDocument,
} from "./schemas/student.schema";
import {
  BusinessClassEnrollment,
  type BusinessClassEnrollmentDocument,
  BusinessClassSession,
  type BusinessClassSessionDocument,
  BusinessTrainingClass,
  type BusinessTrainingClassDocument,
} from "./schemas/training-class.schema";

const LOCK = `
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
  return 1
end
return 0
`.trim();

@Injectable()
export class ClassRemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ClassRemindersService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    @InjectModel(BusinessClassSession.name)
    private readonly sessions: Model<BusinessClassSessionDocument>,
    @InjectModel(BusinessTrainingClass.name)
    private readonly classes: Model<BusinessTrainingClassDocument>,
    @InjectModel(BusinessClassEnrollment.name)
    private readonly enrollments: Model<BusinessClassEnrollmentDocument>,
    @InjectModel(ClubStudent.name)
    private readonly students: Model<ClubStudentDocument>,
    private readonly notifications: NotificationsService,
    private readonly redis: RedisService,
    private readonly config: AppConfigService,
  ) {}

  onModuleInit() {
    if (this.config.env.NODE_ENV === "test") return;
    this.timer = setInterval(() => void this.runSafely(), 60_000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async run() {
    const acquired = await this.redis.eval(
      LOCK,
      1,
      "jobs:business-class-reminders",
      crypto.randomUUID(),
      55_000,
    );
    if (Number(acquired) !== 1) return { skipped: true, sent: 0 };
    const now = Date.now();
    const sent24h = await this.sendWindow(
      new Date(now + 23 * 60 * 60_000),
      new Date(now + 25 * 60 * 60_000),
      "reminder24hSentAt",
    );
    const sent2h = await this.sendWindow(
      new Date(now + 90 * 60_000),
      new Date(now + 150 * 60_000),
      "reminder2hSentAt",
    );
    return { skipped: false, sent: sent24h + sent2h };
  }

  private async sendWindow(
    from: Date,
    to: Date,
    field: "reminder24hSentAt" | "reminder2hSentAt",
  ) {
    const candidates = await this.sessions
      .find({
        status: "scheduled",
        startsAt: { $gte: from, $lt: to },
        [field]: null,
      })
      .limit(200);
    let sent = 0;
    for (const candidate of candidates) {
      const session = await this.sessions.findOneAndUpdate(
        { _id: candidate._id, status: "scheduled", [field]: null },
        { $set: { [field]: new Date() } },
        { new: true },
      );
      if (!session) continue;
      const [trainingClass, enrollments] = await Promise.all([
        this.classes.findById(session.classId),
        this.enrollments.find({ classId: session.classId, status: "active" }),
      ]);
      if (!trainingClass || !enrollments.length) continue;
      const students = await this.students.find({
        _id: { $in: enrollments.map((item) => item.studentId) },
        userId: { $ne: null },
        status: "active",
      });
      await Promise.all(
        students.flatMap((student) =>
          student.userId
            ? [
                this.notifications.notifyBookingReminder({
                  userId: student.userId,
                  bookingId: session._id,
                  title: trainingClass.title,
                  startAt: session.startsAt,
                  href: `/discovery/business-classes/${trainingClass._id}`,
                }),
              ]
            : [],
        ),
      );
      sent += students.length;
    }
    return sent;
  }

  private async runSafely() {
    try {
      await this.run();
    } catch (error) {
      this.logger.error(
        `Class reminder job failed: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  }
}
