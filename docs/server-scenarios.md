# Server scenario dataset

Created on the existing `gym4me-vps` server in database `gym4me` at 2026-09-09T06:51:37.949Z.

Batch: `scenarios-2026-09-v1`. Total: **355 records**, inserted atomically. Existing records were not overwritten. No application deployment or container restart was required.

All entity names are labeled `سناریو` and descriptions explain that they are fictional scenario records. Reference categories are the existing server resources. Scenario users are suspended, use non-dialable `scenario:` identifiers, and have no passwords. They are not login accounts. No real payments, wallet credits, messages, or payment intents were created.

## Coverage

- 15 club types across Tehran, Karaj, Shiraz, Isfahan, Mashhad, Rasht and Tabriz: gym, studio, pool, sports complex, academy, martial arts, football, tennis, volleyball, basketball, futsal, aquatic center, climbing, padel and cycling.
- Men, women, mixed, children and family audiences; indoor/outdoor courts; accessibility, equipment, hours and first-visit details.
- Approved/public, pending, draft and rejected clubs; maintenance and temporary closure states.
- 12 coaches: varied experience and specialties; club, online, home and outdoor delivery; approved, pending-review, draft and rejected profiles. Sport credentials remain unverified.
- Private, semi-private, group and assessment offerings, including session and package pricing; weekly availability rules.
- 14 coach-owned classes: paid/free, beginner/advanced, open/full, registration closed, future registration, in progress, completed, cancelled, archived and draft.
- 8 business-owned classes: group, private, course, single and open models; monthly, course, session and package pricing; active, draft, paused and cancelled states.
- Branches, staff profiles, students, free active enrollments and a waitlist. Capacity counters are backed by linked enrollments, reservations or bookings.
- Future bookable and completed club sessions, a full free session, 8-session packs and 30-day memberships, active/inactive products.
- Three labeled review scenarios (positive, neutral, negative), linked to completed free reservations; review counts/averages match the records. Two published scenario articles and one draft.
- New records intentionally use the apps' missing-image state; no unrelated entity photographs were attached.

## Record counts

| Collection | Verified records |
| --- | ---: |
| `users` | 25 |
| `clubs` | 15 |
| `club_memberships` | 23 |
| `courts` | 15 |
| `coaches` | 12 |
| `coach_sports` | 12 |
| `coach_availability_rules` | 36 |
| `coach_services` | 12 |
| `classes` | 14 |
| `class_sessions` | 28 |
| `class_enrollments` | 5 |
| `session_bookings` | 6 |
| `reservable_sessions` | 30 |
| `benefit_products` | 20 |
| `session_reservations` | 5 |
| `club_reviews` | 3 |
| `club_branches` | 8 |
| `club_coach_profiles` | 8 |
| `business_training_classes` | 8 |
| `club_students` | 24 |
| `business_class_sessions` | 40 |
| `business_class_enrollments` | 3 |
| `articles` | 3 |

## Examples

- [Gym](https://app.gym4me.ir/discovery/clubs/scenario-gym)
- [Coach](https://app.gym4me.ir/discovery/coaches/scenario-coach-1)
- [Full swimming class](https://app.gym4me.ir/discovery/classes/scenario-class-3)

Public API checks passed for lists and details, full-class capacity and available club sessions. Pending/draft/rejected club detail endpoints returned 404 as expected.

## Reproducibility

`deploy/seed-scenarios.cjs` runs inside the existing backend container, using its compiled schemas and Mongoose driver. Without `--apply` it only validates and reports. `--apply` inserts the complete batch in a MongoDB transaction. Stable IDs and the `scenario_seed_runs` manifest prevent overwrites and duplicate insertion. Partial batches or conflicting IDs/unique keys cause a failure.

Every inserted record carries `seedBatch` and `seedKey`. The manifest preserves the original time anchor; reruns do not shift schedules. Existing data is never deleted by the script. Use a new reviewed batch/version for a fresh set of dates.
