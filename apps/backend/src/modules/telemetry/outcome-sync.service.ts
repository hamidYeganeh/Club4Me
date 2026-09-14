import { PRIVACY_POLICY_VERSION } from "../auth/privacy.service";
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { createHash } from "node:crypto";
import { AppConfigService } from "../../config/app-config.service";
import {
  ProductTelemetry,
  ProductTelemetryDocument,
} from "./schemas/product-telemetry.schema";
import { EVENTS } from "./events";

/** Reconciles committed records with a durable cursor. No analytics writes in payment transactions. */
@Injectable()
export class OutcomeSyncService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private running?: Promise<void>;
  private readonly logger = new Logger(OutcomeSyncService.name);
  constructor(
    @InjectModel(ProductTelemetry.name)
    private readonly events: Model<ProductTelemetryDocument>,
    private readonly config: AppConfigService,
  ) {}
  onModuleInit() {
    if (this.config.env.NODE_ENV === "test") return;
    this.timer = setInterval(() => this.start(), 30_000);
    this.timer.unref();
    this.start();
  }
  private start() {
    this.running ??= this.run()
      .catch(() =>
        this.logger.warn(
          "Outcome analytics sync deferred; cursor retained for retry",
        ),
      )
      .finally(() => {
        this.running = undefined;
      });
  }
  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await this.running;
  }
  async run() {
    const state = this.events.db.collection<{
      _id: string;
      startedAt: Date;
      through: Date;
    }>("analytics_sync_state");
    const key = `outcomes:${this.config.env.NODE_ENV}:v1`;
    const now = new Date();
    await state.updateOne(
      { _id: key },
      { $setOnInsert: { startedAt: now, through: now } },
      { upsert: true },
    );
    const checkpoint = (await state.findOne({ _id: key }))!;
    // A five-minute overlap handles delayed commits; deterministic IDs deduplicate every replay.
    const since = new Date(
      Math.max(
        checkpoint.startedAt.getTime(),
        checkpoint.through.getTime() - 300_000,
      ),
    );
    const until = new Date(Date.now() - 30_000);
    if (until <= since) return;
    for (const collection of [
      "session_reservations",
      "payment_intents",
    ] as const) {
      const cursor = this.events.db
        .collection(collection)
        .find({ updatedAt: { $gte: since, $lt: until } })
        .sort({ updatedAt: 1, _id: 1 })
        .batchSize(100);
      for await (const row of cursor) {
        if (!row.userId) continue;
        const [consent, user] = await Promise.all([
          this.events.db.collection("data_consents").findOne({
            userId: row.userId,
            purpose: "analytics",
            version: PRIVACY_POLICY_VERSION,
            granted: true,
          }),
          this.events.db
            .collection("users")
            .findOne({ _id: row.userId }, { projection: { roles: 1 } }),
        ]);
        if (
          !consent ||
          !user ||
          user.roles?.some((r: string) => ["admin", "system"].includes(r))
        )
          continue;
        const add = async (
          event: string,
          at: Date | null | undefined,
          properties: Record<string, unknown>,
        ) => {
          if (!at || at < checkpoint.startedAt || at < consent.decidedAt)
            return;
          const eventId = outcomeId(`${collection}:${row._id}:${event}`);
          await this.events.updateOne(
            { eventId },
            {
              $setOnInsert: {
                eventId,
                actorId: row.userId,
                kind: "track",
                event,
                properties,
                roles: user.roles ?? [],
                occurredAt: at,
                platform: "web",
                appVersion: "server",
                backendRelease: this.config.env.APP_RELEASE,
                environment: this.config.env.NODE_ENV,
                source: "server",
                consentVersion: PRIVACY_POLICY_VERSION,
                expiresAt: new Date(at.getTime() + 180 * 86400_000),
              },
            },
            { upsert: true },
          );
        };
        const club = row.clubId ? { club_id: String(row.clubId) } : {};
        if (collection === "session_reservations") {
          const props = {
            ...club,
            reservation_id: String(row._id),
            session_id: String(row.sessionId),
            session_type: row.sessionType,
            participant_count: row.participantCount,
          };
          await add(EVENTS.RESERVATION_CREATED, row.createdAt, props);
          if (row.cancelledAt)
            await add(EVENTS.RESERVATION_CANCELLED, row.cancelledAt, {
              ...props,
              reason:
                row.cancellationReason === "payment_failed"
                  ? "payment_failed"
                  : "cancelled",
            });
        } else {
          const props = {
            ...club,
            payment_id: String(row._id),
            reference_id: String(row.referenceId),
            reference_type: row.referenceType,
            ...(row.referenceType === "reservation"
              ? { reservation_id: String(row.referenceId) }
              : {}),
            amount: row.amount,
            currency: "IRR",
            payment_mode: row.provider === "mock" ? "simulation" : "live",
          };
          await add(EVENTS.PAYMENT_STARTED, row.createdAt, props);
          if (row.paidAt)
            await add(EVENTS.PAYMENT_SUCCEEDED, row.paidAt, props);
          if (row.failedAt)
            await add(EVENTS.PAYMENT_FAILED, row.failedAt, props);
        }
      }
    }
    await state.updateOne({ _id: key }, { $max: { through: until } });
  }
}
export function outcomeId(key: string) {
  const bytes = createHash("sha256").update(key).digest().subarray(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
