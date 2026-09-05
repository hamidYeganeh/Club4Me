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
  Reservation,
  type ReservationDocument,
} from "./schemas/reservation.schema";

const ACQUIRE_LOCK = `
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
  return 1
end
return 0
`.trim();

@Injectable()
export class ReservationRemindersService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ReservationRemindersService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    @InjectModel(Reservation.name)
    private readonly reservations: Model<ReservationDocument>,
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
    const token = crypto.randomUUID();
    const acquired = await this.redis.eval(
      ACQUIRE_LOCK,
      1,
      "jobs:reservation-reminders",
      token,
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
    const candidates = await this.reservations
      .find({
        status: "reserved",
        paymentStatus: { $in: ["paid", "not_required"] },
        sessionStartsAt: { $gte: from, $lt: to },
        [field]: null,
      })
      .limit(500);
    let sent = 0;
    for (const item of candidates) {
      const claimed = await this.reservations.findOneAndUpdate(
        { _id: item._id, [field]: null, status: "reserved" },
        { $set: { [field]: new Date() } },
        { new: true },
      );
      if (!claimed) continue;
      await this.notifications.notifyBookingReminder({
        userId: claimed.userId,
        bookingId: claimed._id,
        title: claimed.sessionTitle,
        startAt: claimed.sessionStartsAt,
      });
      sent += 1;
    }
    return sent;
  }

  private async runSafely() {
    try {
      await this.run();
    } catch (error) {
      this.logger.error(
        `Reminder job failed: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  }
}
