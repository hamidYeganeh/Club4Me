import {
  dehydrate,
  hydrate,
  type DehydratedState,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import type { OfflineStorage } from "./storage";

export const OFFLINE_MAX_AGE = 7 * 24 * 60 * 60_000;
const CACHE_VERSION = 1;
const MAX_QUERIES = 150;
const MAX_BYTES = 4 * 1024 * 1024;

/** Explicitly exclude balances, payment state, capacity and administrative data. */
export function canPersistQuery(key: QueryKey): boolean {
  if (key[0] === "account")
    return key[1] === "me" || key[1] === "profile-choices";
  if (["favorites", "notifications", "reservations"].includes(String(key[0])))
    return true;
  if (key[0] === "public" && key[1] === "clubs")
    return key.length === 3 || (key.length === 4 && key[3] === "reviews");
  if (key[0] === "athlete")
    return ["coach-bookings", "class-enrollments"].includes(String(key[1]));
  if (key[0] === "coach")
    return ["profile", "calendar", "bookings", "classes"].includes(
      String(key[1]),
    );
  if (key[0] === "discovery")
    return !key.includes("reservable-sessions") && !key.includes("slots");
  return false;
}

type Snapshot = { version: number; savedAt: number; state: DehydratedState };

export async function restoreOfflineCache(
  client: QueryClient,
  storage: OfflineStorage,
  key: string,
  now = Date.now(),
) {
  const snapshot = await storage.get<Snapshot>(key);
  if (
    !snapshot ||
    snapshot.version !== CACHE_VERSION ||
    now - snapshot.savedAt > OFFLINE_MAX_AGE ||
    snapshot.savedAt > now
  ) {
    await storage.remove(key);
    return;
  }
  if (!Array.isArray(snapshot.state?.queries)) {
    await storage.remove(key);
    return;
  }
  hydrate(client, {
    mutations: [],
    queries: snapshot.state.queries.filter(
      (query) =>
        canPersistQuery(query.queryKey) &&
        query.state.status === "success" &&
        now - query.state.dataUpdatedAt <= OFFLINE_MAX_AGE,
    ).map(query => ({ ...query, state: { ...query.state, isInvalidated: true } })),
  });
}

export async function saveOfflineCache(
  client: QueryClient,
  storage: OfflineStorage,
  key: string,
) {
  const state = dehydrate(client, {
    shouldDehydrateMutation: () => false,
    shouldDehydrateQuery: (query) =>
      canPersistQuery(query.queryKey) &&
      query.state.status === "success" &&
      Date.now() - query.state.dataUpdatedAt <= OFFLINE_MAX_AGE,
  });
  // Retain the account snapshot even when other cached responses fill the budget.
  state.queries.sort(
    (a, b) =>
      Number(b.queryKey[0] === "account") -
        Number(a.queryKey[0] === "account") ||
      b.state.dataUpdatedAt - a.state.dataUpdatedAt,
  );
  state.queries = state.queries.slice(0, MAX_QUERIES);
  while (state.queries.length && JSON.stringify(state).length * 2 > MAX_BYTES)
    state.queries.pop();
  await storage.set<Snapshot>(key, {
    version: CACHE_VERSION,
    savedAt: Date.now(),
    state,
  });
}
