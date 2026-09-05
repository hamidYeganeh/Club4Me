export const EVENTS = {
  USER_SIGNED_UP: "user.signed_up",
  ONBOARDING_COMPLETED: "onboarding.completed",
  SEARCH_PERFORMED: "search.performed",
  DISCOVERY_CLUB_VIEWED: "discovery.club_viewed",
  CHECKOUT_STARTED: "checkout.started",
  PAYMENT_SUCCEEDED: "payment.succeeded",
  FAVORITE_ADDED: "favorite.added",
  REVIEW_SUBMITTED: "review.submitted",
  RESERVATION_CREATED: "reservation.created",
  RESERVATION_CANCELLED: "reservation.cancelled",
  SESSION_PUBLISHED: "session.published",
  NOTIFICATION_PREFERENCE_CHANGED: "notification_preference.changed",
  ACCOUNT_DELETED: "account.deleted",
} as const;

export type TelemetryEventName = (typeof EVENTS)[keyof typeof EVENTS];
