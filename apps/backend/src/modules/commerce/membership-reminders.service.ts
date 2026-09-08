import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AppConfigService } from "../../config/app-config.service";
import { atomicOperation } from "../../infrastructure/database/atomic-operation";
import { NotificationsService } from "../notifications/notifications.service";
import {
  UserEntitlement,
  type UserEntitlementDocument,
} from "./schemas/entitlement.schema";

@Injectable()
export class MembershipRemindersService
  implements OnModuleInit, OnModuleDestroy
{
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private readonly logger = new Logger(MembershipRemindersService.name);
  constructor(
    @InjectModel(UserEntitlement.name)
    private readonly entitlements: Model<UserEntitlementDocument>,
    private readonly notifications: NotificationsService,
    private readonly config: AppConfigService,
  ) {}
  onModuleInit() {
    if (this.config.env.NODE_ENV === "test") return;
    this.timer = setInterval(() => void this.runSafely(), 60_000);
    this.timer.unref();
    void this.runSafely();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  private async runSafely() {
    if (this.running) return;
    this.running = true;
    try {
      await this.run();
    } catch {
      this.logger.error("Membership reminder scan failed; retry scheduled");
    } finally {
      this.running = false;
    }
  }
  async run() {
    const now = new Date();
    const filter = {
      status: "active",
      endsAt: { $gt: now, $lte: new Date(now.getTime() + 3 * 86_400_000) },
      $expr: { $ne: ["$endsAt", { $ifNull: ["$expiryRemindedFor", null] }] },
    };
    const candidates = await this.entitlements.find(filter).limit(100);
    for (const candidate of candidates)
      await atomicOperation(this.entitlements.db, async () => {
        const item = await this.entitlements.findOneAndUpdate(
          { $and: [filter, { _id: candidate._id, endsAt: candidate.endsAt }] },
          {
            $set: { expiryRemindedFor: candidate.endsAt },
            $inc: { renewalRevision: 1 },
          },
          { new: true },
        );
        if (!item) return;
        if (
          await this.entitlements.exists({
            renewedFromId: item._id,
            status: "active",
            endsAt: { $gt: item.endsAt },
          })
        )
          return;
        await this.notifications.notifyMembershipExpiring({
          userId: item.userId,
          entitlementId: item._id,
          title: item.title,
          endsAt: item.endsAt,
        });
      });
  }
}
