import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const context = {
  eventId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  platform: z.enum(["android", "web"]),
  appVersion: z.string().trim().min(1).max(40),
};

const trackSchemas = [
  z.object({
    ...context,
    event: z.literal("user.signed_up"),
    properties: z
      .object({
        signup_method: z.enum(["otp", "password"]),
        initial_role: z.enum(["athlete", "coach", "owner"]),
      })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal("onboarding.completed"),
    properties: z
      .object({ selected_role: z.enum(["athlete", "coach", "owner"]) })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal("search.performed"),
    properties: z
      .object({
        result_type: z.enum(["all", "club", "coach", "class"]),
        has_location_filter: z.boolean(),
        result_count: z.number().int().nonnegative(),
      })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal("favorite.added"),
    properties: z
      .object({
        favorite_type: z.enum(["club", "coach", "class"]),
        favorite_id: objectId,
        club_id: objectId.optional(),
      })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal("review.submitted"),
    properties: z
      .object({
        review_target_type: z.enum(["club", "coach"]),
        review_target_id: objectId,
        rating: z.number().int().min(1).max(5),
      })
      .strict(),
  }),
  z.object({
    ...context,
    event: z.literal("reservation.created"),
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
    event: z.literal("reservation.cancelled"),
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
    event: z.literal("session.published"),
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
    event: z.literal("notification_preference.changed"),
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
    event: z.literal("account.deleted"),
    properties: z.object({ had_active_roles: z.boolean() }).strict(),
  }),
] as const;

export class TrackTelemetryDto {
  static schema = z.discriminatedUnion("event", trackSchemas);

  eventId: string;
  occurredAt: string;
  platform: "android" | "web";
  appVersion: string;
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
  groupType: "club" | "session";
  groupId: string;
  traits: Record<string, unknown>;
}
