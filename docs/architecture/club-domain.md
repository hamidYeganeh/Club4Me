# Club domain

## Aggregate boundary

The `clubs` document contains bounded profile data owned and edited together:

- name, description, slug, tags
- titled gallery references
- club-type references
- rules and social links
- location and GeoJSON point
- amenity/equipment references with quantities
- owner-defined cancellation policies
- review and visibility state

Classes, coach relationships, reviews, courts, sessions, and reservations are
separate collections. They can grow without limit, have their own permissions
and lifecycle, and must not make a club document unbounded.

## Cancellation policy semantics

Each policy has a display title such as `آخر هفته` and a descending set of
thresholds. A threshold means “when cancellation happens at least this many
hours before start”. Every policy must include an `hoursBefore: 0` fallback.

```json
{
  "title": "آخر هفته",
  "tiers": [
    { "hoursBefore": 72, "refundPercent": 40 },
    { "hoursBefore": 24, "refundPercent": 20 },
    { "hoursBefore": 0, "refundPercent": 0 }
  ]
}
```

At cancellation time the reservation stores a snapshot of the matched policy
and calculated refund. Later edits to a club policy therefore cannot change an
existing reservation's financial result.

## Reservation entities

`courts`:

```text
_id, clubId, name, courtTypeId, description, capacity, isReservable, status
```

`reservable_sessions`:

```text
_id, clubId, courtId?, classId?, coachId?, startsAt, endsAt,
capacity, reservedCount, cancellationPolicySnapshot,
options: [{
  type: "equipment" | "amenity",
  resourceId,
  titleOverride?,
  availableQuantity,
  maxPerReservation,
  unitPrice
}],
status, createdAt, updatedAt
```

Both `courtId` and `coachId` are optional. This supports a general session,
court-only reservation, coached session, and coached court reservation without
separate slot models.

`reservations`:

```text
_id, clubId, sessionId, userId, participantCount,
selectedOptions: [{ type, resourceId, quantity, unitPriceSnapshot }],
priceSnapshot, cancellationPolicySnapshot,
paymentStatus: "not_required" | "pending" | "paid" | "failed" | "refunded",
status: "reserved" | "cancelled" | "completed" | "no_show",
createdAt, cancelledAt?
```

Capacity and option inventory must be claimed atomically. Reservation creation
and cancellation/refund are transaction boundaries.

## Direct coach booking

Direct coach bookings use the coaching calendar as their source of truth:

```text
coach_services -> class_sessions -> session_bookings
```

A public coach session must reference a published service. The service supplies
the price and cancellation policy, while the session supplies the exact time,
delivery mode, venue, and capacity. `session_bookings` stores snapshots of the
price and cancellation policy so later service edits do not alter an existing
booking.

The athlete reservation timeline composes club reservations and coach bookings
into one read model. The original source identifier is retained so cancellation
is routed to the correct aggregate.

Coach availability is checked across both calendars. Creating a club session
with a coach checks `class_sessions`; creating a direct coach session checks
`reservable_sessions`. A court-backed direct coach session also checks the court
buffer window before it is created.

Paid club and coach bookings start with `paymentStatus: "pending"`; free
bookings use `paymentStatus: "not_required"`. The MVP exposes an intentionally
local mock gateway with approve and reject actions. Approval marks the payment
as paid and confirms direct coach bookings. Rejection marks the payment failed,
cancels/rejects the booking, and releases claimed session and option capacity.
Athletes can resume any unresolved mock payment from their reservation timeline.
Real gateway capture, payout, and settlement remain separate future transaction
boundaries.

## Authorization

- Only a user with the `owner` role may create a club.
- Business APIs always query by both `_id` and `ownerId`; knowing another club's
  ID does not grant access.
- Public discovery only returns approved, public clubs.
- Adding a coach uses a separate `club_coaches` relationship and consent flow.
