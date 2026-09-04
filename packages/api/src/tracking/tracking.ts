import { http } from "../http/client";
import { EVENTS, type TelemetryEventName } from "./events";
import type {
  AccountDeletedEvent,
  ClubTraits,
  FavoriteAddedEvent,
  NotificationPreferenceChangedEvent,
  OnboardingCompletedEvent,
  ReservationCancelledEvent,
  ReservationCreatedEvent,
  ReviewSubmittedEvent,
  SearchPerformedEvent,
  SessionPublishedEvent,
  SessionTraits,
  TelemetryPlatform,
  UserSignedUpEvent,
  UserTraits,
} from "./types";

const QUEUE_KEY = "gym4me.telemetry.queue.v1";
const MAX_QUEUE_LENGTH = 100;

type TelemetryContext = {
  platform: TelemetryPlatform;
  appVersion: string;
};

type QueueItem = {
  method: "identify" | "groups" | "events";
  payload: Record<string, unknown>;
};

let context: TelemetryContext = {
  platform: "web",
  appVersion: process.env.NEXT_PUBLIC_APP_RELEASE ?? "development",
};
let flushPromise: Promise<void> | undefined;
let initialized = false;

export function configureTelemetryContext(next: TelemetryContext): void {
  context = next;
  initializeQueue();
  void flushTelemetryQueue();
}

export function identifyUser(traits: UserTraits): void {
  enqueue("identify", { traits });
}

export function groupClub(groupId: string, traits: ClubTraits): void {
  enqueue("groups", { groupType: "club", groupId, traits });
}

export function groupSession(groupId: string, traits: SessionTraits): void {
  enqueue("groups", { groupType: "session", groupId, traits });
}

export function trackUserSignedUp(properties: UserSignedUpEvent): void {
  track(EVENTS.USER_SIGNED_UP, properties);
}

export function trackOnboardingCompleted(
  properties: OnboardingCompletedEvent,
): void {
  track(EVENTS.ONBOARDING_COMPLETED, properties);
}

export function trackSearchPerformed(properties: SearchPerformedEvent): void {
  track(EVENTS.SEARCH_PERFORMED, properties);
}

export function trackFavoriteAdded(properties: FavoriteAddedEvent): void {
  track(EVENTS.FAVORITE_ADDED, properties);
}

export function trackReviewSubmitted(properties: ReviewSubmittedEvent): void {
  track(EVENTS.REVIEW_SUBMITTED, properties);
}

export function trackReservationCreated(
  properties: ReservationCreatedEvent,
): void {
  track(EVENTS.RESERVATION_CREATED, properties);
}

export function trackReservationCancelled(
  properties: ReservationCancelledEvent,
): void {
  track(EVENTS.RESERVATION_CANCELLED, properties);
}

export function trackSessionPublished(properties: SessionPublishedEvent): void {
  track(EVENTS.SESSION_PUBLISHED, properties);
}

export function trackNotificationPreferenceChanged(
  properties: NotificationPreferenceChangedEvent,
): void {
  track(EVENTS.NOTIFICATION_PREFERENCE_CHANGED, properties);
}

export function trackAccountDeleted(properties: AccountDeletedEvent): void {
  track(EVENTS.ACCOUNT_DELETED, properties);
}

export function resetTelemetryIdentity(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(QUEUE_KEY);
  }
}

export function flushTelemetryQueue(): Promise<void> {
  initializeQueue();
  flushPromise ??= deliverQueue().finally(() => {
    flushPromise = undefined;
  });
  return flushPromise;
}

function track<TProperties extends object>(
  event: TelemetryEventName,
  properties: TProperties,
): void {
  enqueue("events", { event, properties });
}

function enqueue(
  method: QueueItem["method"],
  payload: Record<string, unknown>,
): void {
  initializeQueue();
  const item: QueueItem = {
    method,
    payload: {
      ...payload,
      eventId: createEventId(),
      occurredAt: new Date().toISOString(),
      platform: context.platform,
      appVersion: context.appVersion,
    },
  };
  const queue = [...readQueue(), item].slice(-MAX_QUEUE_LENGTH);
  writeQueue(queue);
  void flushTelemetryQueue();
}

async function deliverQueue(): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine) return;

  let queue = readQueue();
  while (queue.length > 0) {
    const item = queue[0];
    if (!item) return;
    try {
      await http.post<{ accepted: true }>(
        `/telemetry/${item.method}`,
        item.payload,
      );
      queue = queue.slice(1);
      writeQueue(queue);
    } catch (error: unknown) {
      const status = readStatus(error);
      if (status && status >= 400 && status < 500 && status !== 429) {
        queue = queue.slice(1);
        writeQueue(queue);
        continue;
      }
      return;
    }
  }
}

function initializeQueue(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  window.addEventListener("online", () => void flushTelemetryQueue());
}

function readQueue(): QueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(QUEUE_KEY) ?? "[]",
    );
    return Array.isArray(value) ? (value as QueueItem[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueueItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Telemetry must never interrupt the product flow.
  }
}

function createEventId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
      const random = Math.floor(Math.random() * 16);
      const value = character === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    })
  );
}

function readStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }
  return typeof error.status === "number" ? error.status : undefined;
}
