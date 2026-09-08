"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  trainingStore,
  type LocalWorkout,
  type TrainingStore,
} from "@api/offline/training-store";
import { trainingApi, type SessionRecord } from "@api/domains/training";
import { tokenStore } from "@api/http/token-store";
import { errorText, useIdentity } from "./shared";

export function useWorkouts() {
  const identity = useIdentity();
  const [workouts, setWorkouts] = useState<LocalWorkout[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const store = useRef<TrainingStore | null>(null);
  const operation = useRef(false);
  const sync = useCallback(async () => {
    if (
      !store.current ||
      operation.current ||
      tokenStore.identity() !== identity
    )
      return;
    operation.current = true;
    setBusy(true);
    setError("");
    try {
      const state = await store.current.sync();
      if (tokenStore.identity() === identity) {
        setWorkouts(state.workouts);
        setConflict(false);
      }
    } catch (e) {
      if (tokenStore.identity() === identity) {
        try {
          const state = await store.current.read();
          setWorkouts(state.workouts);
          setConflict(state.workouts.some((w) => w.conflicted));
        } catch {
          /* Retain the last durable UI state if storage is unavailable. */
        }
        setError(errorText(e));
        if ((e as { status?: number }).status === 409) setConflict(true);
      }
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }, [identity]);
  useEffect(() => {
    let alive = true;
    store.current = null;
    if (identity === "guest") return;
    void trainingStore(identity)
      .then(async (s) => {
        const state = await s.read();
        if (!alive) return;
        store.current = s;
        setWorkouts(state.workouts);
        setReady(true);
        if (navigator.onLine) void sync();
      })
      .catch((e) => {
        if (alive) setError(`ذخیره‌سازی دستگاه در دسترس نیست: ${errorText(e)}`);
      });
    const online = () => void sync();
    window.addEventListener("online", online);
    return () => {
      alive = false;
      window.removeEventListener("online", online);
    };
  }, [identity, sync]);
  const save = async (session: SessionRecord, restUntil?: number) => {
    if (
      !store.current ||
      operation.current ||
      tokenStore.identity() !== identity
    )
      return false;
    operation.current = true;
    setBusy(true);
    setError("");
    try {
      await store.current.save(session, restUntil);
      const state = await store.current.read();
      if (tokenStore.identity() !== identity) return false;
      setWorkouts(state.workouts);
      return true;
    } catch (e) {
      setError(`ذخیره نشد: ${errorText(e)}`);
      return false;
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };
  const update = async (
    clientId: string,
    edit: (session: SessionRecord) => SessionRecord,
    restUntil?: number,
  ) => {
    if (!store.current || tokenStore.identity() !== identity) return false;
    try {
      await store.current.update(clientId, edit, restUntil);
      const state = await store.current.read();
      if (tokenStore.identity() !== identity) return false;
      setWorkouts(state.workouts);
      return true;
    } catch (e) {
      setError(`ذخیره نشد: ${errorText(e)}`);
      return false;
    }
  };
  const resolve = async () => {
    if (!store.current || operation.current) return;
    if (
      !window.confirm(
        "تغییرات محلیِ جلسات متعارض با نسخه سرور جایگزین می‌شوند. ابتدا نسخه پشتیبان بگیر. ادامه می‌دهی؟",
      )
    )
      return;
    operation.current = true;
    setBusy(true);
    try {
      const remote = await trainingApi.sessions();
      if (tokenStore.identity() !== identity) return;
      for (const local of workouts.filter((w) => w.conflicted)) {
        const session = remote.items.find(
          (s) => s.clientId === local.session.clientId,
        );
        if (session) await store.current.useServer(session);
      }
      setWorkouts((await store.current.read()).workouts);
      setConflict(false);
      setError("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };
  return {
    workouts,
    ready,
    busy,
    error,
    conflict,
    sync,
    save,
    update,
    resolve,
  };
}
