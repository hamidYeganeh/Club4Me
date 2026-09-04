# Delta: Current → Target

**Implementation status:** Completed on 2026-09-04.

The current state is greenfield: no product analytics SDK or event calls were detected.

## Add (not tracked today)

| Event                             | Category      | Priority | Why                                                         |
| --------------------------------- | ------------- | -------- | ----------------------------------------------------------- |
| `reservation.created`             | core value    | P0       | Primary marketplace value action                            |
| `reservation.cancelled`           | core value    | P0       | Reservation quality and churn signal                        |
| `session.published`               | core value    | P0       | Supply creation signal                                      |
| `user.signed_up`                  | lifecycle     | P0       | Acquisition baseline                                        |
| `onboarding.completed`            | lifecycle     | P1       | Measures signup-to-ready conversion                         |
| `search.performed`                | feature usage | P1       | Measures discovery effectiveness without storing query text |
| `favorite.added`                  | feature usage | P1       | Return-intent signal                                        |
| `review.submitted`                | collaboration | P1       | Marketplace trust contribution                              |
| `notification_preference.changed` | configuration | P2       | Notification opt-in and preference health                   |
| `account.deleted`                 | lifecycle     | P1       | Explicit churn/privacy signal                               |

## Remove

None. No current events exist.

## Rename

None. No current events exist.

## Keep

None. No current events exist.

## Change

None. No current event shapes exist.

## Accounting

- Target events: 10
- Add: 10
- Rename: 0
- Keep: 0
- Accounted for: 10/10

## Implementation order

1. Central first-party ingestion, schema validation, retention, and exclusion rules.
2. P0 server-side lifecycle and marketplace outcomes.
3. P1 client/server engagement outcomes.
4. P2 notification preference signal and daily aggregate snapshots.
