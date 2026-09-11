"use client";

import { useCallback, useSyncExternalStore } from "react";
import { tokenStore } from "./http/token-store";

const values = new Map<string, string>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

/** UI preferences only. These values never grant access to a role or resource. */
export function useAccountPreference(name: string) {
  const identity = useSyncExternalStore(tokenStore.subscribe, tokenStore.identity, () => "guest");
  // Never place an opaque access token in browser storage or a storage key.
  const key = identity.startsWith("user:")
    ? `club4me.preference.v1:${encodeURIComponent(identity)}:${name}`
    : null;
  const read = useCallback(() => {
    if (!key) return "";
    try { return window.localStorage.getItem(key) ?? values.get(key) ?? ""; }
    catch { return values.get(key) ?? ""; }
  }, [key]);
  const value = useSyncExternalStore(subscribe, read, () => "");
  const setValue = useCallback((next: string) => {
    if (!key) return;
    values.set(key, next);
    try { window.localStorage.setItem(key, next); } catch { /* Memory fallback for restricted storage. */ }
    notify();
  }, [key]);
  return [value, setValue] as const;
}
