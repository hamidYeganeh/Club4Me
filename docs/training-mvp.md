# Training MVP

Implemented on `codex/training-sandow`; the subsequent local HeroUI kit request supersedes Sandow as the UI component reference. Existing dirty worktree changes are preserved. No AI service, paid provider, OpenGym source code, or third-party exercise media was added.

## Entry points

- Athlete home → `/athlete/training`: assigned plan, explicit results-sharing consent, prescribed day details, active workout, set logging, rest deadline, notes, completion/cancellation, synchronization and backup.
- `/athlete/training/exercises` and `/coach/training/exercises`: 12 authored Persian text guides, searchable/filterable by muscle and equipment. Video/image demonstrations are not included.
- `/athlete/training/progress`: completed-session and set counts, logged volume, 28-day activity calendar, maximum logged weights and session history. Volume is the sum of logged repetitions × external weight, not a physiological performance estimate.
- Coach home → `/coach/training`: day/exercise/set/repetition/weight/rest/note editor, immutable plan versions, assignment of a chosen version to a qualified athlete or active paid class membership, withdrawal and consent-scoped results.

## Backend and privacy

The JWT-protected `/api/v1/training` module uses `workout_plans`, `workout_assignments`, and `workout_sessions`. Coach access requires an approved coach record. Assignment eligibility is resolved from active, paid/not-required packages, class enrollments or session bookings. Every assignment captures its plan snapshot/version. Editing a plan cannot silently change a previously sent workout.

Athletes explicitly accept results sharing before starting a new assigned workout. Consent withdrawal, program revocation, expiration or loss of the service relationship blocks coach result access. Existing athlete logs can still be saved after withdrawal. A new session requires a current service relationship; rejected offline submissions remain locally available for backup. Sessions are scoped by authenticated athlete, immutable assignment/day/start, expected revision and idempotent mutation UUID. Completed sessions cannot be overwritten. New uploads must start within assignment validity and within the previous seven days.

## Offline behavior and boundaries

IndexedDB stores per-account workout drafts and stable pending payloads before network requests. Account namespaces are SHA-256 hashes, never raw tokens. Replay checks the captured identity before sending and after authentication refresh. Web Locks, where available, serialize operations across tabs; server revision checks detect cross-device conflicts. Valid field edits are serialized against the latest durable local session. A lost response retries the same mutation before subsequent edits. Permanent rejection does not acknowledge or erase the local workout or block unrelated eligible workouts.

Workouts resume on reopening the locally bundled native app. Cached assignment/library data is available during API outages. Starting a new workout and accepting consent require fresh online assignment data. The web build does **not** add a service worker: a cold offline browser navigation is not promised. Sync runs on entering the training screens, after completion, on the browser online event, or manually; it is not an OS background job. Pending sessions are visible and exportable. Explicit server replacement affects only conflict-marked sessions. Local storage is not an encrypted medical-record vault; use a trusted device.

Progress merges this device's logs with up to 1,000 recent server sessions. Library text is a starter catalog, not a licensed video library. No automatic coaching, AI plan generation, body measurement tracking or medical advice is introduced.

## Verification commands

```sh
npm run test --workspace backend -- --runInBand training.service.spec.ts
npm run test:offline --workspace application
npm run e2e --workspace application -- training.spec.ts
npm run lint --workspace application -- modules/training
npm run check-types --workspace application
npm run check-types --workspace @repo/api
npm run build --workspace application
npm run build:cap --workspace application
```

The backend service tests use temporary MongoDB and require permission to bind local ports. Browser tests mock only API responses and verify actual mobile UI flows, Persian dates, API outage/reload, edited field persistence and light/dark overflow. They do not claim a deployed end-to-end environment or physical-device testing. Run the commands on the final checkout before release; unrelated Discovery test constructor mismatches were observed during the repository-wide backend type check.

Verified on 2026-09-08: 5 training backend tests, 24 offline/native-support unit tests (5 training-specific), and 3 training mobile-browser tests passed. Application/API type checks, training UI lint, production web/backend builds and the native web bundle succeeded. The repository-wide backend type check still reports six unrelated Discovery test constructor argument errors. No APK/device run, deployment, commit or push was performed.
# Vital Free50 integration

The authenticated exercise catalog now loads 50 Vital entries from `TRAINING_CATALOG_DIR/catalog.json`, with media in `media/0051.mp4` through `media/0100.mp4`. The directory is the private output of `scripts/exercise-catalog/import-vital.mjs`. No upstream API is used at runtime. Development also detects `data/exercise-catalog/runs/vital-active` from the repo or backend working directory; production requires an explicit absolute `TRAINING_CATALOG_DIR` and a mounted copy of the licensed package. Restart the backend after changing the package. An explicitly configured missing/invalid package fails closed; an unconfigured installation retains its starter library.

Vital IDs are namespaced and the 12 previous starter IDs remain valid, so existing plans are not rewritten or broken. Thus there are 50 animated entries plus 12 legacy text entries when configured. Coach plan validation and selectors use the same combined catalog. Titles and filter labels are localized to Persian; the original English instructions are labeled and kept unchanged. These are not represented as professionally reviewed Persian instructions.

`GET /api/v1/training/exercises/:id/animation` uses the existing JWT/account guard and an exact server-side ID-to-file map (no user-provided filesystem paths). Files are private/no-store, never exposed under public static URLs. The application requests a video Blob using its authenticated API client only when the user chooses to view it, loops it inline, and revokes/aborts it when closed, unmounted or the session changes. Native video controls allow pausing. This is access control, not DRM. There is no permanent browser media cache or offline-video guarantee yet.

The original media is still about 203 MB total and is not yet transcoded. A server deployment and a low-volume optimized media package remain separate steps. Preserve Vital's license/provenance and do not publish the raw assets or database in a public repository. No production deployment or AI service activation was performed.
