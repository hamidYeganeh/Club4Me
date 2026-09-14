import { outcomeId } from "./outcome-sync.service";
import { PRIVACY_POLICY_VERSION } from "../auth/privacy.service";
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AppConfigService } from "../../config/app-config.service";
import {
  ProductTelemetry,
  ProductTelemetryDocument,
} from "./schemas/product-telemetry.schema";

/** The event store is also the durable outbox. Retries preserve event UUIDs. */
@Injectable()
export class PosthogDeliveryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PosthogDeliveryService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running?: Promise<void>;
  constructor(
    @InjectModel(ProductTelemetry.name)
    private readonly events: Model<ProductTelemetryDocument>,
    private readonly config: AppConfigService,
  ) {}
  onModuleInit() {
    if (
      !this.config.env.POSTHOG_PROJECT_TOKEN ||
      this.config.env.NODE_ENV === "test"
    )
      return;
    this.timer = setInterval(() => this.start(), 10_000);
    this.timer.unref();
    this.start();
  }
  private start() {
    this.running ??= this.run()
      .catch(() => {
        this.logger.warn(
          "PostHog delivery deferred; events remain in the outbox",
        );
      })
      .finally(() => {
        this.running = undefined;
      });
  }
  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await this.running;
  }
  async run() {
    const env = this.config.env;
    if (!env.POSTHOG_PROJECT_TOKEN || env.POSTHOG_ENVIRONMENT !== env.NODE_ENV)
      return;
    const rows = await this.events
      .find({
        environment: env.NODE_ENV,
        consentVersion: PRIVACY_POLICY_VERSION,
        posthogDeliveredAt: null,
        expiresAt: { $gt: new Date() },
        $or: [
          { posthogRetryAt: null },
          { posthogRetryAt: { $lte: new Date() } },
        ],
      })
      .select("+anonymousHash")
      .sort({ receivedAt: 1 })
      .limit(50)
      .lean();
    if (!rows.length) return;
    const eligible: typeof rows = [];
    for (const row of rows) {
      if (row.actorId) {
        const [consent, user] = await Promise.all([
          this.events.db.collection("data_consents").findOne({
            userId: row.actorId,
            purpose: "analytics",
            version: PRIVACY_POLICY_VERSION,
            granted: true,
          }),
          this.events.db
            .collection("users")
            .findOne({ _id: row.actorId }, { projection: { roles: 1 } }),
        ]);
        if (
          !consent ||
          !user ||
          user.roles?.some((role: string) => ["admin", "system"].includes(role))
        ) {
          await this.events.deleteOne({ _id: row._id });
          continue;
        }
      }
      eligible.push(row);
    }
    if (!eligible.length) return;
    const ids = eligible.map((row) => row._id);
    const batch = eligible.flatMap((row) => {
      const mapped = toPosthogEvent(row);
      if (row.kind !== "identify" || !row.actorId || !row.anonymousHash)
        return [mapped];
      return [
        {
          uuid: outcomeId(`${row.eventId}:alias`),
          event: "$create_alias",
          timestamp: row.occurredAt.toISOString(),
          properties: {
            distinct_id: `anon:${row.anonymousHash}`,
            alias: `user:${row.actorId}`,
            $insert_id: outcomeId(`${row.eventId}:alias`),
            $ip: null,
            $geoip_disable: true,
            $process_person_profile: true,
            environment: row.environment,
          },
        },
        mapped,
      ];
    });
    // Group traits come from server-owned club records, never from page metadata.
    const clubIds = [
      ...new Set(
        eligible
          .map((r) => r.properties?.club_id)
          .filter(
            (id): id is string =>
              typeof id === "string" && /^[a-f\d]{24}$/i.test(id),
          ),
      ),
    ];
    for (const id of clubIds) {
      const club = await this.events.db
        .collection("clubs")
        .findOne(
          { _id: new Types.ObjectId(id) },
          { projection: { status: 1, cityId: 1, clubTypeId: 1, updatedAt: 1 } },
        );
      if (!club) continue;
      const uuid = outcomeId(
        `club:${id}:${club.updatedAt?.toISOString() ?? "initial"}`,
      );
      batch.unshift({
        uuid,
        event: "$groupidentify",
        timestamp: new Date().toISOString(),
        properties: {
          distinct_id: `group:club:${id}`,
          $insert_id: uuid,
          $group_type: "club",
          $group_key: id,
          $group_set: {
            status: club.status,
            city_id: club.cityId ? String(club.cityId) : undefined,
            club_type_id: club.clubTypeId ? String(club.clubTypeId) : undefined,
          },
          $ip: null,
          $geoip_disable: true,
          $process_person_profile: false,
          environment: env.NODE_ENV,
          consentVersion: PRIVACY_POLICY_VERSION,
        },
      });
    }
    try {
      const response = await fetch(new URL("/batch/", env.POSTHOG_HOST), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ api_key: env.POSTHOG_PROJECT_TOKEN, batch }),
      });
      if (!response.ok) throw new Error(`PostHog HTTP ${response.status}`);
      await this.events.updateMany(
        { _id: { $in: ids } },
        { $set: { posthogDeliveredAt: new Date(), posthogRetryAt: null } },
      );
    } catch {
      await Promise.all(
        eligible.map((row) =>
          this.events.updateOne(
            { _id: row._id },
            {
              $inc: { posthogAttempts: 1 },
              $set: {
                posthogRetryAt: new Date(
                  Date.now() +
                    Math.min(
                      3600,
                      10 * 2 ** Math.min(row.posthogAttempts ?? 0, 9),
                    ) *
                      1000,
                ),
              },
            },
          ),
        ),
      );
      this.logger.warn(
        "PostHog unavailable; retry scheduled without affecting product requests",
      );
    }
  }
}

export function toPosthogEvent(row: ProductTelemetry) {
  const distinctId = row.actorId
    ? `user:${row.actorId}`
    : `anon:${row.anonymousHash}`;
  const groups: Record<string, string> = {};
  if (typeof row.properties?.club_id === "string")
    groups.club = row.properties.club_id;
  if (typeof row.properties?.session_id === "string")
    groups.session = row.properties.session_id;
  if (row.groupType && row.groupId) groups[row.groupType] = String(row.groupId);
  const properties: Record<string, unknown> = {
    ...row.properties,
    distinct_id: distinctId,
    $insert_id: row.eventId,
    $ip: null,
    $geoip_disable: true,
    $process_person_profile: Boolean(row.actorId),
    environment: row.environment,
    platform: row.platform,
    app_version: row.appVersion,
    backend_release: row.backendRelease,
    source: row.source,
    $groups: groups,
  };
  let event = row.event;
  if (row.kind === "identify") {
    event = "$identify";
    properties.$set = row.traits;
    if (row.anonymousHash)
      properties.$anon_distinct_id = `anon:${row.anonymousHash}`;
  } else if (row.kind === "group") {
    event = "$groupidentify";
    properties.$group_type = row.groupType;
    properties.$group_key = String(row.groupId);
    properties.$group_set = row.traits;
  }
  return {
    uuid: row.eventId,
    event,
    timestamp: row.occurredAt.toISOString(),
    properties,
  };
}
