# Gym4Me product telemetry

This module is generated from `.telemetry/tracking-plan.yaml`. It provides a centralized event registry, exact TypeScript property types, authenticated first-party delivery, idempotency IDs, and a bounded offline queue.

## Usage

Import only typed functions from `@repo/api`:

```ts
trackNotificationPreferenceChanged({
  preference_name: "reminders",
  is_enabled: true,
});
```

Do not call the telemetry endpoint directly or add raw event-name strings in feature code. Add or change an event in the tracking plan first, then update `types.ts`, `events.ts`, the corresponding explicit wrapper, and the backend DTO schema together.

## Hook locations

| Event                             | Canonical hook                        |
| --------------------------------- | ------------------------------------- |
| `user.signed_up`                  | successful first OTP account creation |
| `onboarding.completed`            | successful initial role selection     |
| `search.performed`                | completed discovery search response   |
| `favorite.added`                  | successful favorite mutation          |
| `review.submitted`                | successful review mutation            |
| `reservation.created`             | successful reservation mutation       |
| `reservation.cancelled`           | successful cancellation mutation      |
| `session.published`               | successful provider session creation  |
| `notification_preference.changed` | successful preference/device change   |
| `account.deleted`                 | successful backend deletion boundary  |

## Privacy and operations

- Never add phone, name, free text, precise coordinates, or push tokens.
- The client queue is capped at 100 non-PII records.
- Backend records expire after 180 days.
- Admin activity is discarded.
- Test against a development MongoDB database and verify one identify, group, and track record.
