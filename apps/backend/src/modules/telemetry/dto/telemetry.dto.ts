import { EVENTS } from "../events";
import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const context = {
  eventId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  platform: z.enum(["android", "web"]),
  appVersion: z.string().trim().min(1).max(40),
  anonymousId: z.string().uuid().optional(),
};

const trackSchemas = [
  z.object({
    ...context,
    event: z.literal(EVENTS.REQUEST_COMPLETED),
    properties: z
      .object({
        category: z.enum(["discovery", "reservation", "payment"]),
        status: z.number().int().min(0).max(599),
        duration_ms: z.number().int().min(0).max(120000),
      })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal(EVENTS.APP_OPENED),
    properties: z
      .object({
        screen: z.enum([
          "discovery",
          "athlete",
          "coach",
          "reservations",
          "profile",
          "other",
        ]),
      })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal(EVENTS.DISCOVERY_ENTITY_VIEWED),
    properties: z
      .object({
        entity_type: z.enum(["class", "coach"]),
        entity_id: objectId,
        club_id: objectId.optional(),
      })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal(EVENTS.USER_SIGNED_UP),
    properties: z
      .object({
        signup_method: z.enum(["otp", "password"]),
        initial_role: z.enum(["athlete", "coach", "owner"]),
      })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal(EVENTS.ONBOARDING_COMPLETED),
    properties: z
      .object({ selected_role: z.enum(["athlete", "coach", "owner"]) })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal(EVENTS.SEARCH_PERFORMED),
    properties: z
      .object({
        result_type: z.enum(["all", "club", "coach", "class"]),
        has_location_filter: z.boolean(),
        result_count: z.number().int().nonnegative(),
        acquisition_channel: z.string().trim().min(1).max(80).optional(),
        sport_id: objectId.optional(),
        service_type: z.enum(["club", "coach", "class", "court"]).optional(),
      })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal(EVENTS.DISCOVERY_CLUB_VIEWED),
    properties: z.object({ club_id: objectId }).strict(),
  }),
  z.object({
    ...context,
    event: z.literal(EVENTS.CHECKOUT_STARTED),
    properties: z.object({ club_id: objectId, session_id: objectId }).strict(),
  }),
  z.object({
    ...context,
    event: z.literal(EVENTS.PAYMENT_SUCCEEDED),
    properties: z
      .object({ reservation_id: objectId, club_id: objectId })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal(EVENTS.FAVORITE_ADDED),
    properties: z
      .object({
        favorite_type: z.enum(["club", "coach", "class", "article"]),
        favorite_id: objectId,
        club_id: objectId.optional(),
      })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal(EVENTS.REVIEW_SUBMITTED),
    properties: z
      .object({
        review_target_type: z.enum(["club", "coach", "class"]),
        review_target_id: objectId,
        rating: z.number().int().min(1).max(5),
      })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal(EVENTS.RESERVATION_CREATED),
    properties: z
      .object({
        reservation_id: objectId,
        club_id: objectId,
        session_id: objectId,
        session_type: z.enum(["court", "class", "coached_session"]),
        participant_count: z.number().int().positive().max(1000),
      })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal(EVENTS.RESERVATION_CANCELLED),
    properties: z
      .object({
        reservation_id: objectId,
        club_id: objectId,
        session_id: objectId,
        cancelled_by: z.enum(["athlete", "provider"]),
      })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal(EVENTS.SESSION_PUBLISHED),
    properties: z
      .object({
        club_id: objectId,
        session_id: objectId,
        session_type: z.enum(["court", "class", "coached_session"]),
      })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal(EVENTS.NOTIFICATION_PREFERENCE_CHANGED),
    properties: z
      .object({
        preference_name: z.enum([
          "push_enabled",
          "booking_updates",
          "reminders",
          "discovery",
          "marketing",
        ]),
        is_enabled: z.boolean(),
      })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal(EVENTS.ACCOUNT_DELETED),
    properties: z.object({ had_active_roles: z.boolean() }).strict(),
  }),
] as const;

export class TrackTelemetryDto {
  static schema = z.discriminatedUnion("event", trackSchemas);

  eventId: string;
  occurredAt: string;
  platform: "android" | "web";
  appVersion: string;
  anonymousId?: string;
  event: string;
  properties: Record<string, unknown>;
}

export class IdentifyTelemetryDto {
  static schema = z.object({
    ...context,
    traits: z
      .object({
        created_at: z.string().datetime(),
        locale: z.string().trim().min(2).max(20),
        platform: z.enum(["android", "web"]),
      })
      .strict(),
  });

  eventId: string;
  occurredAt: string;
  platform: "android" | "web";
  appVersion: string;
  anonymousId?: string;
  traits: Record<string, unknown>;
}

const clubGroup = z.object({
  ...context,
  groupType: z.literal("club"),
  groupId: objectId,
  traits: z
    .object({
      status: z.string().trim().min(1).max(40),
      club_type_id: objectId.optional(),
      city_id: objectId.optional(),
      created_at: z.string().datetime(),
    })
    .strict(),
});

const sessionGroup = z.object({
  ...context,
  groupType: z.literal("session"),
  groupId: objectId,
  traits: z
    .object({
      parent_group_id: objectId,
      session_type: z.enum(["court", "class", "coached_session"]),
      status: z.string().trim().min(1).max(40),
      starts_at: z.string().datetime(),
    })
    .strict(),
});

export class GroupTelemetryDto {
  static schema = z.discriminatedUnion("groupType", [clubGroup, sessionGroup]);

  eventId: string;
  occurredAt: string;
  platform: "android" | "web";
  appVersion: string;
  anonymousId?: string;
  groupType: "club" | "session";
  groupId: string;
  traits: Record<string, unknown>;
}
