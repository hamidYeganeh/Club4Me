import { EVENTS } from "./events";
import { PRIVACY_POLICY_VERSION } from "../auth/privacy.service";
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

  async group(actor: AuthTokenPayload, body: GroupTelemetryDto) {
    const clubId =
      body.groupType === "club"
        ? body.groupId
        : String(body.traits.parent_group_id);
    const club = await this.telemetry.db.collection("clubs").findOne({
      _id: new Types.ObjectId(clubId),
      ownerId: new Types.ObjectId(actor.sub),
    });
    if (!club)
      throw new AppError(
        403,
        "GROUP_ACCESS_DENIED",
        "Group does not belong to this owner",
      );
    return this.persist(actor, body, {
      kind: "group",
      groupType: body.groupType,
      groupId: new Types.ObjectId(body.groupId),
      traits: body.traits,
    });
  }

  track(actor: AuthTokenPayload, body: TrackTelemetryDto) {
    // Older clients can still send these, but only committed server records count.
    if (
      [
        EVENTS.RESERVATION_CREATED,
        EVENTS.RESERVATION_CANCELLED,
        EVENTS.PAYMENT_SUCCEEDED,
        EVENTS.PAYMENT_STARTED,
        EVENTS.PAYMENT_FAILED,
      ].some((event) => event === body.event)
    )
      return Promise.resolve({ accepted: true as const });
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
      throw new AppError(
        400,
        "ANONYMOUS_ID_REQUIRED",
        "Anonymous identity is required",
      );
    if (
      ![
        EVENTS.REQUEST_COMPLETED,
        EVENTS.APP_OPENED,
        EVENTS.SEARCH_PERFORMED,
        EVENTS.DISCOVERY_CLUB_VIEWED,
        EVENTS.DISCOVERY_ENTITY_VIEWED,
        EVENTS.CHECKOUT_STARTED,
      ].some((event) => event === body.event)
    )
      throw new AppError(
        403,
        "ANONYMOUS_EVENT_NOT_ALLOWED",
        "This event requires authentication",
      );
    const group = deriveGroup(body.event, body.properties);
    return this.persist(null, body, {
      kind: "track",
      event: body.event,
      properties: body.properties,
      ...group,
    });
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
    if (actor?.roles.some((role) => ["admin", "system"].includes(role))) {
      return { accepted: true as const };
    }

    if (actor) {
      const consent = await this.telemetry.db
        .collection("data_consents")
        .findOne({
          userId: new Types.ObjectId(actor.sub),
          purpose: "analytics",
          version: PRIVACY_POLICY_VERSION,
          granted: true,
        });
      if (!consent) return { accepted: true as const };
    }
    const occurredAt = new Date(body.occurredAt);
    if (
      occurredAt.getTime() > Date.now() + 300_000 ||
      occurredAt.getTime() < Date.now() - 180 * 86400_000
    )
      throw new AppError(
        400,
        "INVALID_EVENT_TIME",
        "Event timestamp is outside the accepted window",
      );
    const expiresAt = new Date(occurredAt);
    expiresAt.setUTCDate(expiresAt.getUTCDate() + RETENTION_DAYS);

    try {
      await this.telemetry.create({
        ...payload,
        eventId: body.eventId,
        actorId: actor ? new Types.ObjectId(actor.sub) : null,
        anonymousHash: body.anonymousId
          ? createHmac("sha256", this.config.env.JWT_SECRET)
              .update(body.anonymousId)
              .digest("hex")
          : null,
        roles: actor?.roles ?? [],
        consentVersion: PRIVACY_POLICY_VERSION,
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

function deriveGroup(event: string, properties: Record<string, unknown>) {
  if (
    [
      EVENTS.RESERVATION_CREATED,
      EVENTS.RESERVATION_CANCELLED,
      EVENTS.SESSION_PUBLISHED,
    ].some((name) => name === event) &&
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
