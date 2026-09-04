# Instrumentation Guide

## Target: Gym4Me first-party telemetry API

Generated from `tracking-plan.yaml` v2 on 2026-09-04. The codebase is TypeScript across a Capacitor/Next.js client and NestJS backend. Product analytics uses an authenticated first-party HTTP endpoint; Sentry remains a separate operational-error destination.

## SDK Setup

### Dependencies

No external analytics SDK is required. The existing authenticated `@repo/api` HTTP client is the transport, MongoDB is the bounded event store, and browser/Capacitor storage queues non-PII payloads during connectivity loss.

### Initialization

Mount one identity component after the API provider. Once the current authenticated user is available, call `identifyUser`. On logout, call `resetTelemetryIdentity`. Queue flushing runs at startup and on the browser `online` event.

### Environment Variables

| Variable                  | Purpose                                       | Required    |
| ------------------------- | --------------------------------------------- | ----------- |
| `NODE_ENV`                | Separates development/staging/production data | yes         |
| `APP_RELEASE`             | Backend release attached to received records  | recommended |
| `NEXT_PUBLIC_APP_RELEASE` | Client app release attached to calls          | recommended |

There is no analytics API token because ingestion is authenticated with the user's existing access token. Server-side service calls use the verified actor ID directly.

## Identity

### identify()

`identifyUser(traits: UserTraits): void` sends only durable non-PII traits. The server derives `user_id` and roles from the access token and ignores calls by admin/system actors.

| Trait        | Type             | PII | Notes                    |
| ------------ | ---------------- | --- | ------------------------ |
| `roles`      | string[]         | no  | Valid product roles only |
| `created_at` | ISO datetime     | no  | Account creation date    |
| `locale`     | string           | no  | Defaults to `fa-IR`      |
| `platform`   | `android \| web` | no  | Runtime platform         |

Call after authentication hydration, after role changes, and when platform/locale changes. Never send name, phone, birthdate, device token, or location.

### group()

`groupClub(groupId, traits)` establishes a top-level club. `groupSession(groupId, traits)` establishes a session with `parent_group_id` pointing to its club.

| Level   | Mapping              | ID source                   | Parent |
| ------- | -------------------- | --------------------------- | ------ |
| club    | `group_type=club`    | Club MongoDB ObjectId       | none   |
| session | `group_type=session` | Reservable session ObjectId | club   |

Call at group creation and trait changes. Event calls still carry explicit group context; they never depend on the most recently selected group.

## Events

### track()

Each public wrapper accepts the exact property interface for one event and queues a `POST /telemetry/events` call. Event constants are centralized in `EVENTS`; raw event-name strings are not allowed at call sites.

Representative calls:

```ts
trackReservationCreated({
  reservation_id: reservation.id,
  club_id: reservation.clubId,
  session_id: reservation.sessionId,
  session_type: reservation.sessionType,
  participant_count: reservation.participantCount,
});

trackSearchPerformed({
  result_type: "club",
  has_location_filter: true,
  result_count: result.items.length,
});
```

### Group-Level Attribution

The tracking wrapper derives group context from typed properties: reservation and session events use `session_id`; club-scoped favorites/reviews use `club_id` when present. The backend stores `group_type` and `group_id` alongside the event so queries can roll session events up through their `club_id` property.

## Complete Tracking Module

The copy-paste-ready implementation lives in `packages/api/src/tracking/` and contains:

- `types.ts`: exact plan-derived interfaces
- `events.ts`: the only event-name registry
- `tracking.ts`: identify/group/one wrapper per event, persistent queue, retry, flush, and reset
- `index.ts`: public exports
- `README.md`: hook mapping and operational notes

This repository-local implementation is the canonical module; duplicating it here would create a second source that can drift.

## Architecture

### Client vs Server

The client emits low-risk engagement outcomes after successful mutations. The API authenticates every payload, supplies actor identity from JWT, validates strict schemas, strips all unapproved keys, and persists a TTL-bounded record. Business-critical events can also be moved to a server-side transaction boundary later without changing event schemas.

### Queues and Batching

Calls are fire-and-forget. Failed non-PII calls remain in a capped local queue and retry when connectivity returns. The queue is bounded to avoid unbounded storage growth; event IDs make retries idempotent.

### Shutdown / Flush

The browser flushes on startup and `online`. The backend awaits the MongoDB insert before returning HTTP 202, so normal NestJS shutdown semantics are sufficient and no analytics SDK flush hook is needed.

### Error Handling

Telemetry failures are swallowed at the product boundary and never fail a user action. Unauthorized payloads are dropped after token cleanup; transient network/server errors stay queued. The backend unique index de-duplicates retried event IDs.

## Verification

### Confirming Delivery

In development, perform one identify, group, and track call and query the `product_telemetry` MongoDB collection by `event_id`. Verify that identity comes from JWT and forbidden fields are absent.

### Expected Latency

Online calls are visible after one HTTP round trip. Offline calls arrive after the next successful queue flush.

### Success vs Failure

HTTP 202 means the record was accepted or intentionally discarded by the internal-user policy. 400 means schema rejection, 401 means no valid session, and 429 means rate limiting. Duplicate event IDs are treated as successful idempotent retries.

### Development Testing

Use a separate development database. A dry-run test must cover one call of each method, invalid properties, admin exclusion, duplicate delivery, and network failure without throwing into the feature flow.

## Rollout Strategy

The owner requested the complete launch set, so all planned events ship together. Monitor accepted records, schema rejections, collection growth, and event volume during the first week.

## SDK-Specific Constraints

- There is no vendor dashboard; analysis reads the first-party collection or future aggregates.
- The local queue may contain IDs and approved event metadata, but never PII or free text.
- Client timestamps are preserved as `occurred_at`; server receipt time is separate.
- TTL retention is enforced by MongoDB and documented in the privacy notice.

## Coverage Gaps

Daily club snapshot traits need a production scheduler. The current repository has Redis but no background job runner, so snapshot synchronization is documented but not added as an unreliable in-process timer.
