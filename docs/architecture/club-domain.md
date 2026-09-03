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
status: "reserved" | "cancelled" | "completed" | "no_show",
createdAt, cancelledAt?
```

Capacity and option inventory must be claimed atomically. Reservation creation
and cancellation/refund are transaction boundaries.

## Authorization

- Only a user with the `owner` role may create a club.
- Business APIs always query by both `_id` and `ownerId`; knowing another club's
  ID does not grant access.
- Public discovery only returns approved, public clubs.
- Adding a coach uses a separate `club_coaches` relationship and consent flow.
