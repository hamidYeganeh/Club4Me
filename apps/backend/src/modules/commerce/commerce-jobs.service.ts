import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";

import { AppConfigService } from "../../config/app-config.service";
import { RedisService } from "../../infrastructure/redis/redis.service";
import { CommerceService } from "./commerce.service";

const LOCK = `
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
  return 1
end
return 0
`.trim();

@Injectable()
export class CommerceJobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CommerceJobsService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly commerce: CommerceService,
    private readonly redis: RedisService,
    private readonly config: AppConfigService,
  ) {}

  onModuleInit() {
    if (this.config.env.NODE_ENV === "test") return;
    this.timer = setInterval(
      () => void this.runSafely(),
      this.config.env.PAYMENT_SWEEP_SECONDS * 1000,
    );
    this.timer.unref();
    void this.runSafely();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async run() {
    const token = crypto.randomUUID();
    const acquired = await this.redis.eval(
      LOCK,
      1,
      "jobs:payment-reconciliation",
      token,
      4 * 60_000,
    );
    if (Number(acquired) !== 1) return { skipped: true };
    try {
      const expiration = await this.commerce.expirePendingPayments();
      if (expiration.errors.length)
        this.logger.warn(
          `Payment expiry cleanup needs retry for ${expiration.errors.length} records`,
        );
      return {
        skipped: false,
        ...expiration,
        ...(await this.commerce.reconcile()),
      };
    } finally {
      await this.redis.eval(
        "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0",
        1,
        "jobs:payment-reconciliation",
        token,
      );
    }
  }

  private async runSafely() {
    try {
      const result = await this.run();
      if (!result.skipped && "mismatches" in result && result.mismatches.length)
        this.logger.warn(
          `Payment reconciliation found ${result.mismatches.length} mismatch(es)`,
        );
    } catch (error) {
      this.logger.error(
        `Payment reconciliation failed: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  }
}
