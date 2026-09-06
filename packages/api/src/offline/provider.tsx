"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onlineManager, type QueryClient } from "@tanstack/react-query";
import { tokenStore } from "../http/token-store";
import { sessionRequest } from "../http/client";
import type {
  FavoriteEntityType,
  FavoritesResponse,
} from "../domains/favorites/favorites.dto";
import { createOfflineStorage } from "./storage";
import { restoreOfflineCache, saveOfflineCache } from "./cache";
import { OfflineOutbox, type OfflineAction } from "./outbox";

type FavoriteIntent = {
  entityType: FavoriteEntityType;
  entityId: string;
  saved: boolean;
  createdAt: string;
};
type OfflineServices = {
  pending: number;
  failed: number;
  unavailable: boolean;
  saveFavorite?: (intent: FavoriteIntent) => Promise<void>;
  overlayFavorites: (data: FavoritesResponse) => FavoritesResponse;
  retry: () => void;
  discardFailed: () => void;
};
const OfflineContext = createContext<OfflineServices | null>(null);
export const useOffline = () => useContext(OfflineContext);

function favoriteIntent(value: unknown): FavoriteIntent {
  const item = value as FavoriteIntent;
  if (
    !item ||
    !["club", "coach", "class", "article"].includes(item.entityType) ||
    !/^[a-f0-9]{24}$/i.test(item.entityId) ||
    typeof item.saved !== "boolean" ||
    typeof item.createdAt !== "string"
  ) {
    throw Object.assign(new Error("Invalid saved-item operation"), {
      status: 422,
    });
  }
  return item;
}

export function overlayFavoriteActions(
  data: FavoritesResponse,
  actions: OfflineAction[],
): FavoritesResponse {
  let items = data.items;
  for (const action of actions) {
    if (action.type !== "favorites.set" || action.status !== "pending")
      continue;
    const intent = favoriteIntent(action.payload);
    items = items.filter(
      (item) =>
        item.entityType !== intent.entityType ||
        item.entityId !== intent.entityId,
    );
    if (intent.saved)
      items = [
        {
          id: `offline:${action.entityKey}`,
          entityType: intent.entityType,
          entityId: intent.entityId,
          createdAt: intent.createdAt,
        },
        ...items,
      ];
  }
  return { items };
}

export function OfflineProvider({
  children,
  fallback,
  client,
  identity,
  namespace,
}: {
  children: ReactNode;
  fallback: ReactNode;
  client: QueryClient;
  identity: string;
  namespace: string;
}) {
  const [services, setServices] = useState<OfflineServices | null>(null);
  useEffect(() => {
    onlineManager.setOnline(navigator.onLine);
    let active = true;
    let actions: OfflineAction[] = [];
    let cleanup = () => {};
    const isCurrent = () => active && tokenStore.identity() === identity;
    const start = async () => {
      const storage = createOfflineStorage("gym4me-offline-v1");
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(`${namespace}:${identity}`),
      );
      if (!isCurrent()) return;
      const scope = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      const cacheKey = `cache:${scope}`;
      const queueKey = `outbox:${scope}`;
      let writes = Promise.resolve();
      let timer: ReturnType<typeof setTimeout> | undefined;
      let retryTimer: ReturnType<typeof setInterval> | undefined = undefined;
      const publish = () => {
        if (!isCurrent()) return;
        setServices({
          pending: actions.filter((item) => item.status === "pending").length,
          failed: actions.filter((item) => item.status === "failed").length,
          unavailable: false,
          saveFavorite:
            identity === "guest"
              ? undefined
              : async (intent) => {
                  favoriteIntent(intent);
                  await outbox.enqueue(
                    "favorites.set",
                    `${intent.entityType}:${intent.entityId}`,
                    intent,
                  );
                  setTimeout(flush, 0);
                },
          overlayFavorites: (data) => overlayFavoriteActions(data, actions),
          retry: flush,
          discardFailed: () => {
            void outbox
              .discardFailed()
              .then(() => client.invalidateQueries({ queryKey: ["favorites"] }))
              .catch(reportStorageFailure);
          },
        });
      };
      const outbox = new OfflineOutbox(
        storage,
        queueKey,
        {
          "favorites.set": async (payload) => {
            const intent = favoriteIntent(payload);
            await sessionRequest(
              identity,
              intent.saved ? "PUT" : "DELETE",
              `/saves/${intent.entityType}/${intent.entityId}`,
            );
          },
        },
        isCurrent,
        (next) => {
          actions = next;
          publish();
        },
      );
      const reportStorageFailure = () => {
        if (isCurrent())
          setServices((previous) =>
            previous
              ? { ...previous, unavailable: true, saveFavorite: undefined }
              : null,
          );
      };
      const flush = () => {
        if (
          !isCurrent() ||
          !navigator.onLine ||
          !actions.some((item) => item.status === "pending")
        )
          return;
        void outbox
          .flush()
          .then(() => {
            if (
              isCurrent() &&
              !actions.some((item) => item.status === "pending")
            ) {
              void client.invalidateQueries({ queryKey: ["favorites"] });
            }
          })
          .catch(reportStorageFailure);
      };
      const persist = () => {
        if (!isCurrent()) return;
        writes = writes
          .then(() =>
            isCurrent()
              ? saveOfflineCache(client, storage, cacheKey)
              : undefined,
          )
          .catch(reportStorageFailure);
      };
      const erase = () => {
        if (tokenStore.identity() === identity) return;
        void outbox.clear().catch(() => undefined);
        clearTimeout(timer);
        writes = writes
          .then(() => storage.remove(cacheKey))
          .catch(() => undefined);
      };
      const unsubscribeSession = tokenStore.subscribe(erase);
      cleanup = () => {
        unsubscribeSession();
        outbox.stop();
        clearTimeout(timer);
        clearInterval(retryTimer);
      };
      await restoreOfflineCache(client, storage, cacheKey);
      if (!isCurrent()) return;
      actions = await outbox.read();
      if (!isCurrent()) return;
      const cachedFavorites = client.getQueryData<FavoritesResponse>([
        "favorites",
      ]);
      if (cachedFavorites || actions.length)
        client.setQueryData(
          ["favorites"],
          overlayFavoriteActions(cachedFavorites ?? { items: [] }, actions),
        );
      const unsubscribeCache = client.getQueryCache().subscribe(() => {
        clearTimeout(timer);
        timer = setTimeout(persist, 250);
      });
      window.addEventListener("online", flush);
      const onVisibility = () => {
        persist();
        if (document.visibilityState === "visible") flush();
      };
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("pagehide", persist);
      const previousCleanup = cleanup;
      cleanup = () => {
        previousCleanup();
        unsubscribeCache();
        window.removeEventListener("online", flush);
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pagehide", persist);
      };
      retryTimer = setInterval(flush, 30_000);
      publish();
      flush();
    };
    void start().catch(() => {
      cleanup();
      if (isCurrent())
        setServices({
          pending: 0,
          failed: 0,
          unavailable: true,
          overlayFavorites: (data) => data,
          retry: () => {},
          discardFailed: () => {},
        });
    });
    return () => {
      active = false;
      cleanup();
    };
  }, [client, identity, namespace]);
  if (!services) return fallback;
  return (
    <OfflineContext.Provider value={services}>
      {children}
    </OfflineContext.Provider>
  );
}
