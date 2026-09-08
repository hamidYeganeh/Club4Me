import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomUUID } from "node:crypto";
import { Model, Types } from "mongoose";
import { AppError } from "../../common/errors/app.exception";
import { AppConfigService } from "../../config/app-config.service";
import {
  SMS_PROVIDER,
  type SmsProvider,
} from "../auth/providers/sms-provider.interface";
import { UsersRepository } from "../users/users.repository";
import {
  PushNotificationsService,
  categoryFor,
} from "./push-notifications.service";
import {
  Notification,
  type NotificationDocument,
} from "./schemas/notification.schema";

const CHANNELS = ["pushDelivery", "smsDelivery"] as const;
type Channel = (typeof CHANNELS)[number];

@Injectable()
export class NotificationOutboxService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationOutboxService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  constructor(
    @InjectModel(Notification.name)
    private readonly notifications: Model<NotificationDocument>,
    private readonly push: PushNotificationsService,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
    private readonly users: UsersRepository,
    private readonly config: AppConfigService,
  ) {}

  onModuleInit() {
    if (this.config.env.NODE_ENV === "test") return;
    this.timer = setInterval(() => void this.runSafely(), 15_000);
    this.timer.unref();
    void this.runSafely();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async runSafely(id?: Types.ObjectId) {
    try {
      await this.run(id);
    } catch {
      this.logger.error(
        "Notification outbox scan failed; pending deliveries retained",
      );
    }
  }

  async run(id?: Types.ObjectId) {
    if (this.running) return;
    this.running = true;
    try {
      for (const channel of CHANNELS) {
        for (let count = 0; count < 100; count++) {
          const now = new Date(),
            token = randomUUID();
          const item = await this.notifications.findOneAndUpdate(
            {
              ...(id ? { _id: id } : {}),
              $or: [
                {
                  [`${channel}.state`]: "pending",
                  [`${channel}.nextAttemptAt`]: { $lte: now },
                },
                {
                  [`${channel}.state`]: "processing",
                  [`${channel}.leaseUntil`]: { $lte: now },
                },
              ],
            },
            {
              $set: {
                [`${channel}.state`]: "processing",
                [`${channel}.leaseToken`]: token,
                [`${channel}.leaseUntil`]: new Date(now.getTime() + 120_000),
              },
              $inc: { [`${channel}.attempts`]: 1 },
            },
            { new: true, sort: { createdAt: 1 } },
          );
          if (!item) break;
          try {
            const state = await this.deliver(item, channel);
            await this.finish(item._id, channel, token, {
              state,
              acceptedAt: state === "accepted" ? new Date() : null,
              errorCode: null,
            });
          } catch {
            const attempts = item[channel]!.attempts;
            await this.finish(item._id, channel, token, {
              state: attempts >= 8 ? "failed" : "pending",
              nextAttemptAt: new Date(
                Date.now() +
                  Math.min(3600_000, 15_000 * 2 ** Math.min(attempts, 8)),
              ),
              errorCode: "DELIVERY_FAILED",
            });
          }
        }
      }
    } finally {
      this.running = false;
    }
  }

  private async deliver(item: NotificationDocument, channel: Channel) {
    const preferences = await this.push.getPreferences(String(item.userId));
    if (!preferences[categoryFor(item.type)]) return "skipped";
    if (channel === "pushDelivery") {
      return (
        (await this.push.sendToUsers(
          {
            userIds: [item.userId],
            type: item.type,
            title: item.title,
            body: item.body,
            href: item.href,
            deliveryId: String(item._id),
          },
          true,
        )) ?? "skipped"
      );
    }
    const user = await this.users.findById(String(item.userId));
    if (item.smsTemplate && item.smsTokens) {
      await this.sms.sendTemplate(user.phone, item.smsTemplate, item.smsTokens);
    } else if (this.sms.sendMessage) {
      await this.sms.sendMessage(user.phone, `${item.title}\n${item.body}`);
    } else return "skipped";
    return "accepted";
  }

  private finish(
    id: Types.ObjectId,
    channel: Channel,
    token: string,
    data: Record<string, unknown>,
  ) {
    return this.notifications.updateOne(
      { _id: id, [`${channel}.leaseToken`]: token },
      {
        $set: Object.fromEntries(
          Object.entries({ ...data, leaseToken: null, leaseUntil: null }).map(
            ([key, value]) => [`${channel}.${key}`, value],
          ),
        ),
      },
    );
  }

  async report() {
    const counts: Record<string, unknown> = {};
    for (const channel of CHANNELS)
      counts[channel] = await this.notifications.aggregate([
        { $match: { [channel]: { $ne: null } } },
        { $group: { _id: `$${channel}.state`, count: { $sum: 1 } } },
      ]);
    const failed = await this.notifications
      .find({ $or: CHANNELS.map((c) => ({ [`${c}.state`]: "failed" })) })
      .sort({ updatedAt: -1 })
      .limit(100)
      .select("type createdAt pushDelivery smsDelivery")
      .lean();
    return {
      counts,
      failed: failed.map((n) => ({
        id: String(n._id),
        type: n.type,
        createdAt: n.createdAt,
        pushDelivery: n.pushDelivery,
        smsDelivery: n.smsDelivery,
      })),
    };
  }

  async retry(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new AppError(404, "NOTIFICATION_NOT_FOUND", "اعلان پیدا نشد.");
    let changed = 0;
    for (const channel of CHANNELS) {
      const result = await this.notifications.updateOne(
        { _id: id, [`${channel}.state`]: "failed" },
        {
          $set: {
            [`${channel}.state`]: "pending",
            [`${channel}.attempts`]: 0,
            [`${channel}.nextAttemptAt`]: new Date(),
            [`${channel}.errorCode`]: null,
          },
        },
      );
      changed += result.modifiedCount;
    }
    if (!changed)
      throw new AppError(
        409,
        "NO_FAILED_DELIVERY",
        "ارسال ناموفقی برای تلاش مجدد وجود ندارد.",
      );
    return { queued: true };
  }
}
