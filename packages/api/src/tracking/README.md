# Club4Me product telemetry

Typed first-party ingestion with a durable MongoDB → PostHog destination. Source of truth: `.telemetry/tracking-plan.yaml` v3. Setup and report semantics: `docs/posthog-analytics-fa.md`.

Import explicit wrappers from `@repo/api`/`@api/tracking`. Never call the telemetry endpoint directly. New contracts must update the tracking plan, both event registries, types, wrapper, backend DTO and tests together.

| Event | Hook/source |
|---|---|
| app.opened | ProductTelemetry; allowlisted screen after consent |
| request.completed | selected API response status/duration; analytics calls excluded |
| discovery.club_viewed | successful club detail |
| discovery.entity_viewed | successful business class, catalog class and coach detail |
| search.performed | completed discovery search response |
| checkout.started | explicit reserve action for a club session |
| user.signed_up / onboarding.completed | existing signup/role wrappers, subject to consent |
| favorite.added / review.submitted | successful user mutation |
| notification_preference.changed | successful preference mutation |
| session.published | existing session publication wrapper |
| reservation.created / reservation.cancelled | committed database records via OutcomeSyncService |
| payment.started / payment.succeeded / payment.failed | committed payment intents via OutcomeSyncService |
| account.deleted | legacy wrapper; backend deletion removes local telemetry |

The legacy client reservation/payment wrappers remain for source compatibility but server ingestion deliberately discards these outcome events. New features must not add client-side payment-success tracking. Outcomes are reconciled with stable per-record/event UUIDs after commit and only with the current server-side analytics consent.

No name, phone, search text, exact coordinates, URLs, request/response payloads, authentication tokens or recording data belongs in telemetry. Explicit IDs are pseudonymous and subject to consent. The client queue is capped at 100, survives temporary network loss and isolates account changes. The local store expires after 180 days. Configure retention/deletion separately in PostHog. Admin/system activity is excluded. Development requires a separate PostHog project.

No external SDK dependency: the backend uses PostHog's documented batch HTTP API, durable retries, identity/alias mapping and club groups. Provision internal PostHog dashboards with `node scripts/setup-posthog.mjs --dry-run` first; run without `--dry-run` only after project/key configuration.
