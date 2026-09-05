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
import { UsersRepository } from "../users/users.repository";
import { SupportTicket, type SupportTicketDocument } from "./support.schema";

const LOCK = `
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
  return 1
end
return 0
`.trim();

@Injectable()
export class SupportSlaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SupportSlaService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    @InjectModel(SupportTicket.name)
    private readonly tickets: Model<SupportTicketDocument>,
    private readonly redis: RedisService,
    private readonly config: AppConfigService,
    private readonly users: UsersRepository,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    if (this.config.env.NODE_ENV === "test") return;
    this.timer = setInterval(() => void this.runSafely(), 60_000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async run(now = new Date()) {
    const acquired = await this.redis.eval(
      LOCK,
      1,
      "jobs:support-sla",
      crypto.randomUUID(),
      55_000,
    );
    if (Number(acquired) !== 1) return { skipped: true, escalated: 0 };
    await this.backfillSla();
    const candidates = await this.tickets
      .find({
        status: { $nin: ["resolved", "closed"] },
        firstRespondedAt: null,
        escalationLevel: { $in: [0, 1, 2, null] },
        $or: [
          { slaBreachedAt: null, slaDueAt: { $lte: now } },
          { nextEscalationAt: { $lte: now } },
        ],
      })
      .sort({ slaDueAt: 1 })
      .limit(100);
    if (!candidates.length) return { skipped: false, escalated: 0 };
    const admins = await this.users.findIdsByRole("admin");
    let escalated = 0;
    for (const ticket of candidates) {
      const level = Math.min(3, (ticket.escalationLevel ?? 0) + 1);
      const updated = await this.tickets.findOneAndUpdate(
        {
          _id: ticket._id,
          firstRespondedAt: null,
          escalationLevel:
            (ticket.escalationLevel ?? 0) === 0
              ? { $in: [0, null] }
              : ticket.escalationLevel,
        },
        {
          $set: {
            escalationLevel: level,
            slaBreachedAt: ticket.slaBreachedAt ?? now,
            nextEscalationAt:
              level < 3 ? new Date(now.getTime() + 60 * 60_000) : null,
          },
        },
        { new: true },
      );
      if (!updated) continue;
      escalated += 1;
      if (admins.length) {
        await this.notifications.notifySupportEscalated({
          userIds: admins,
          ticketId: updated._id,
          subject: updated.subject,
          level,
        });
      }
    }
    return { skipped: false, escalated };
  }

  private async runSafely() {
    try {
      await this.run();
    } catch (error) {
      this.logger.error(
        `Support SLA job failed: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  }

  private async backfillSla() {
    await this.tickets.updateMany({ slaDueAt: null }, [
      {
        $set: {
          priority: { $ifNull: ["$priority", "normal"] },
          slaDueAt: {
            $add: [
              { $ifNull: ["$createdAt", "$$NOW"] },
              {
                $multiply: [
                  {
                    $switch: {
                      branches: [
                        {
                          case: { $eq: ["$priority", "urgent"] },
                          then: this.config.env.SUPPORT_SLA_URGENT_MINUTES,
                        },
                        {
                          case: { $eq: ["$priority", "high"] },
                          then: this.config.env.SUPPORT_SLA_HIGH_MINUTES,
                        },
                        {
                          case: { $eq: ["$priority", "low"] },
                          then: this.config.env.SUPPORT_SLA_NORMAL_MINUTES * 2,
                        },
                      ],
                      default: this.config.env.SUPPORT_SLA_NORMAL_MINUTES,
                    },
                  },
                  60_000,
                ],
              },
            ],
          },
          escalationLevel: { $ifNull: ["$escalationLevel", 0] },
        },
      },
    ]);
  }
}
