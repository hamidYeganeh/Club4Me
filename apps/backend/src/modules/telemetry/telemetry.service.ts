import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

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

  private async persist(
    actor: AuthTokenPayload,
    body: {
      eventId: string;
      occurredAt: string;
      platform: "android" | "web";
      appVersion: string;
    },
    payload: Partial<ProductTelemetry>,
  ) {
    if (actor.roles.includes("admin")) {
      return { accepted: true as const };
    }

    const expiresAt = new Date();
    expiresAt.setUTCDate(expiresAt.getUTCDate() + RETENTION_DAYS);

    try {
      await this.telemetry.create({
        ...payload,
        eventId: body.eventId,
        actorId: new Types.ObjectId(actor.sub),
        roles: actor.roles,
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
