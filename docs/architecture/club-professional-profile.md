# Professional club profiles

The existing club create/update API now accepts optional `profile`,
`trialBookingEnabled`, and `busyHours`. Old clubs default to an empty profile,
no busy-hour estimates, and disabled trials. Updating `profile` replaces that
bounded object; omitted top-level fields preserve existing values.

`profile.spaces` holds up to 30 named spaces, with floor type, roof configuration,
lighting, court count, area, and optional swimming-pool dimensions and treatment.
The remaining profile fields describe training area, typical class capacity,
ventilation, cooling, parking, wheelchair access and first-visit instructions.
Existing amenities retain their `included`, `paid`, or `unavailable` availability
and money; the business form now edits and preserves these values. Membership
products remain the source of pricing, session counts and validity periods.

Gallery items accept `category` (`training`, `equipment`, `changing_room`,
`entrance`, `other`) and an optional owner-reported `takenOn` ISO calendar date.
Dates in the future are rejected; a missing date is unknown, not an upload date.

## Busy hours

Each estimate is `{ dayOfWeek, hour, level }`, where Sunday is 0, Saturday is 6,
hour is 0–23 in the club's IANA timezone, and level is `quiet`, `moderate` or
`busy`. Keys are unique; at most 168 entries fit a weekly schedule.
Missing entries mean unknown. Scheduled closed hours display as closed.
The server sets `busyHoursSource: owner_reported` and maintains a separate
`busyHoursUpdatedAt` only when the estimates change. This is a typical-week
estimate, not live attendance and not a reservation-capacity ratio.

For a future measured mode, record actual entry AND exit timestamps per venue,
count current occupants, and aggregate historical occupancy by weekday/hour.
Display sample size, measurement freshness and source independently. Existing
class check-ins alone do not measure whole-club occupancy or departures; do not
label those counts as live crowding. Booking capacity can be shown separately
as availability, particularly for individually reservable courts.

## Free trial booking

Owners opt in using `trialBookingEnabled`. Athletes submit `isTrial: true` to
the existing reservation endpoint with one participant, no entitlement and no
options. The server verifies the club setting, normal session availability and
cutoffs, atomically claims normal inventory, and records zero total price with
`paymentStatus: not_required`. The client never silently downgrades a requested
trial into a paid booking if the owner disables the feature.

The `one_trial_per_club_user` unique partial index on reservations enforces one
trial per club/user across reserved, completed and no-show states, including
simultaneous requests for different sessions. A cancelled trial permits another
attempt. Duplicate creation compensates the inventory claim. Existing database
records have no true `isTrial` values; ensure this additive index is built before
enabling trials on a deployment that disables Mongoose automatic index creation.
No live database backfill or production writes were performed by this change.

## Admin-managed ratings and verification

Admins manage `/api/v1/clubs/club_review_criteria` through the resources UI/API.
Criteria use stable resource IDs as score keys and support names, ordering and
activation. Only active IDs are accepted for new 1–5 scores. Existing overall
ratings remain unchanged; skipped criteria do not count as zero. Reviews store
criterion-name snapshots for historical display. Public review responses include
active `criteria` and per-criterion `criteriaSummary` aggregates over all
published reviews, independently of the latest-100 review list.

Verified booking continues to require a completed reservation. Club verification
badges are independent of publishing approval. Only the admin-guarded
`PATCH /admin/clubs/:clubId/verification` accepts `{kind, verified}` for
`identity`, `documents`, or `on_site`. Public responses expose verification dates
but omit the internal verifying-admin identifier; owners cannot set these fields.

The coach section derives sport, student level, class format and upcoming days
from published business classes, linking to each class's booking page. Verified
credential counts come only from linked, approved public coach profiles with
reviewed coach-sport documents. Coach relationships and class records stay in
their existing collections rather than being duplicated inside club profiles.
