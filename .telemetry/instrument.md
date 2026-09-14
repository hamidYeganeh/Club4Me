# Instrumentation guide — v3, 2026-09-13

TypeScript / Next.js + Capacitor / NestJS. Preserve the typed first-party tracking API and use its MongoDB event store as a durable PostHog outbox. Sentry remains the independent crash reporter.

## Client

`packages/api/src/tracking/events.ts` is the event registry, types.ts supplies the contracts, tracking.ts owns the explicit wrappers, identity and bounded offline queue. `ProductTelemetry` configures platform/version and captures allowlisted screen categories after consent. Entity detail views and checkout record explicit IDs. HTTP request observation sends only category, status and bounded duration; it never sends URLs, parameters, request bodies or error text. Analytics requests never observe themselves.

Local analytics consent is versioned. Server consent must match the current privacy-policy version, now including disclosure of PostHog. Admin/system identities are excluded. Logout/account switching resets queued identity state; retries remain bound to the account that enqueued them.

## Server

`TelemetryService` validates allowlisted client events and persists after consent. The public endpoint accepts only anonymous engagement events. Financial/reservation outcome submissions from old clients are ignored. `OutcomeSyncService` reconciles committed `session_reservations` and `payment_intents` with stable UUIDs; its durable cursor starts at the first deployment of this version, with a five-minute overlap. This avoids coupling business transactions to analytics. No implicit historical export.

`PosthogDeliveryService` polls 50 pending records every ten seconds, rechecks consent and excludes missing/internal users. Each batch includes original timestamps, UUID/$insert_id, explicit club/session groups, and sanitized context. Identify records also generate deterministic alias events. Club group traits come from server records. Delivery acknowledgement and retry time/attempts persist on the event itself. Backoff is bounded, HTTP times out after eight seconds, shutdown awaits the current batch. Missing configuration disables external delivery; environment mismatch fails configuration validation.

Capture API: POST `${POSTHOG_HOST}/batch/` with `{api_key:POSTHOG_PROJECT_TOKEN,batch:[...]}`. No SDK dependency is needed for this documented HTTP contract. `$identify`, `$create_alias`, `$groupidentify`, `$groups`, and `$process_person_profile` follow https://posthog.com/docs/api/capture.

## Reporting

`AnalyticsReportService`: internal dashboards read behavioral records from the same first-party store and financial facts from the ledger/payment database. Business reports enforce `reports.read`, tenant scope and `payments.read`. No personal API key or unrestricted PostHog query is exposed to clients. PostHog is available for deeper internal exploration after activation; setup-posthog.mjs provisions the internal dashboard definitions.

See `docs/posthog-analytics-fa.md` for settings, startup, report semantics, retention/deletion responsibilities and test commands. PostHog's own retention/deletion is separate from the 180-day local MongoDB TTL. No replay or autocapture is enabled.
