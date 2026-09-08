import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { createHmac } from "node:crypto";
import { AppError } from "../../common/errors/app.exception";

import { AppConfigService } from "../../config/app-config.service";
import type { AuthTokenPayload } from "../auth/services/token.service";
import type {
  GroupTelemetryDto,
  IdentifyTelemetryDto,
  TrackTelemetryDto,
} from "./dto/telemetry.dto";
import {
  ProductTelemetry,
  type ProductTelemetryDocument,
} from "./schemas/product-telemetry.schema";

const RETENTION_DAYS = 180;

@Injectable()
export class TelemetryService {
  constructor(
    @InjectModel(ProductTelemetry.name)
    private readonly telemetry: Model<ProductTelemetryDocument>,
    private readonly config: AppConfigService,
  ) {}

  identify(actor: AuthTokenPayload, body: IdentifyTelemetryDto) {
    return this.persist(actor, body, {
      kind: "identify",
      traits: { ...body.traits, roles: actor.roles },
    });
  }

  group(actor: AuthTokenPayload, body: GroupTelemetryDto) {
    return this.persist(actor, body, {
      kind: "group",
      groupType: body.groupType,
      groupId: new Types.ObjectId(body.groupId),
      traits: body.traits,
    });
  }

  track(actor: AuthTokenPayload, body: TrackTelemetryDto) {
    const group = deriveGroup(body.event, body.properties);
    return this.persist(actor, body, {
      kind: "track",
      event: body.event,
      properties: body.properties,
      ...group,
    });
  }

  trackAnonymous(body: TrackTelemetryDto) {
    if (!body.anonymousId)
      throw new AppError(400, "ANONYMOUS_ID_REQUIRED", "Anonymous identity is required");
    if (!["search.performed", "discovery.club_viewed", "checkout.started"].includes(body.event))
      throw new AppError(403, "ANONYMOUS_EVENT_NOT_ALLOWED", "This event requires authentication");
    const group = deriveGroup(body.event, body.properties);
    return this.persist(null, body, { kind: "track", event: body.event, properties: body.properties, ...group });
  }

  async productAnalytics(daysInput?: string) {
    const days = Math.min(180, Math.max(7, Number(daysInput) || 30));
    const since = new Date(Date.now() - days * 86_400_000);
    const [events, identityLinks] = await Promise.all([this.telemetry
      .find({
        kind: "track",
        occurredAt: { $gte: since },
        event: {
          $in: [
            "search.performed",
            "discovery.club_viewed",
            "checkout.started",
            "reservation.created",
            "payment.succeeded",
          ],
        },
      })
      .select("+anonymousHash actorId event occurredAt properties")
      .sort({ occurredAt: 1 })
      .lean(), this.telemetry.find({ actorId: { $ne: null }, anonymousHash: { $ne: null } }).select("+anonymousHash actorId").lean()]);
    const stages = [
      ["discovery", "کشف", ["search.performed", "discovery.club_viewed"]],
      ["checkout", "شروع رزرو", ["checkout.started"]],
      ["reservation", "ثبت رزرو", ["reservation.created"]],
      ["payment", "پرداخت موفق", ["payment.succeeded"]],
    ] as const;
    const aliases = new Map<string, string>();
    for (const event of identityLinks) if (event.actorId && event.anonymousHash) aliases.set(event.anonymousHash, String(event.actorId));
    const identity = (event: typeof events[number]) => event.actorId ? String(event.actorId) : event.anonymousHash ? aliases.get(event.anonymousHash) ?? `anon:${event.anonymousHash}` : `event:${event._id}`;
    const funnel = stages.map(([key, label, names]) => {
      const actors = new Set(
        events
          .filter((event) => names.includes(event.event as never))
          .map(identity),
      );
      return { key, label, users: actors.size };
    });
    const base = funnel[0]?.users ?? 0;
    const reservations = events.filter(
      (event) => event.event === "reservation.created",
    );
    const activityByActor = new Map<string, Set<string>>();
    for (const event of reservations) {
      const actorId = identity(event);
      const weeks = activityByActor.get(actorId) ?? new Set<string>();
      weeks.add(weekStart(event.occurredAt).toISOString());
      activityByActor.set(actorId, weeks);
    }
    const cohorts = new Map<string, Array<Set<string>>>();
    for (const [actorId, activeWeeks] of activityByActor) {
      const first = [...activeWeeks].sort()[0];
      if (!first) continue;
      const buckets =
        cohorts.get(first) ??
        Array.from({ length: 5 }, () => new Set<string>());
      const firstTime = new Date(first).getTime();
      for (const activeWeek of activeWeeks) {
        const offset = Math.floor(
          (new Date(activeWeek).getTime() - firstTime) / (7 * 86_400_000),
        );
        if (offset >= 0 && offset < buckets.length)
          buckets[offset]?.add(actorId);
      }
      cohorts.set(first, buckets);
    }
    const breakdown = (property: string) => [...events.reduce((map, event) => {
      const value = event.properties?.[property];
      if (typeof value === "string" && value) map.set(value, (map.get(value) ?? 0) + 1);
      return map;
    }, new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([key, count]) => ({ key, count }));
    return {
      days,
      funnel: funnel.map((stage) => ({
        ...stage,
        conversionPercent: base
          ? Math.round((stage.users / base) * 1000) / 10
          : 0,
      })),
      cohorts: [...cohorts.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 8)
        .map(([week, buckets]) => ({
          week: week.slice(0, 10),
          users: buckets[0]?.size ?? 0,
          retention: buckets.map((bucket) =>
            buckets[0]?.size
              ? Math.round((bucket.size / buckets[0].size) * 1000) / 10
              : 0,
          ),
        })),
      breakdowns: {
        acquisitionChannel: breakdown("acquisition_channel"),
        sport: breakdown("sport_id"),
        serviceType: breakdown("service_type"),
      },
      definitions: {
        discovery: "کاربر یا نصب یکتایی که جست‌وجو یا صفحه باشگاه را دیده است",
        conversion: "نسبت هویت‌های یکتای هر مرحله به مرحله کشف در بازه انتخابی",
        retention: "بازگشت همان هویت برای رزرو در هفته‌های بعد؛ رویداد تکراری با eventId حذف می‌شود",
      },
    };
  }

  private async persist(
    actor: AuthTokenPayload | null,
    body: {
      eventId: string;
      occurredAt: string;
      platform: "android" | "web";
      appVersion: string;
      anonymousId?: string;
    },
    payload: Partial<ProductTelemetry>,
  ) {
    if (actor?.roles.includes("admin")) {
      return { accepted: true as const };
    }

    const expiresAt = new Date();
    expiresAt.setUTCDate(expiresAt.getUTCDate() + RETENTION_DAYS);

    try {
      await this.telemetry.create({
        ...payload,
        eventId: body.eventId,
        actorId: actor ? new Types.ObjectId(actor.sub) : null,
        anonymousHash: body.anonymousId ? createHmac("sha256", this.config.env.JWT_SECRET).update(body.anonymousId).digest("hex") : null,
        roles: actor?.roles ?? [],
        occurredAt: new Date(body.occurredAt),
        platform: body.platform,
        appVersion: body.appVersion,
        backendRelease: this.config.env.APP_RELEASE,
        environment: this.config.env.NODE_ENV,
        expiresAt,
      });
    } catch (error: unknown) {
      if (!isDuplicateKey(error)) throw error;
    }

    return { accepted: true as const };
  }
}

function weekStart(value: Date) {
  const result = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
  const day = result.getUTCDay() || 7;
  result.setUTCDate(result.getUTCDate() - day + 1);
  return result;
}

function deriveGroup(event: string, properties: Record<string, unknown>) {
  if (
    [
      "reservation.created",
      "reservation.cancelled",
      "session.published",
    ].includes(event) &&
    typeof properties.session_id === "string"
  ) {
    return {
      groupType: "session" as const,
      groupId: new Types.ObjectId(properties.session_id),
    };
  }
  if (typeof properties.club_id === "string") {
    return {
      groupType: "club" as const,
      groupId: new Types.ObjectId(properties.club_id),
    };
  }
  return {};
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}
