"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@heroui/react";
import { tokenStore } from "@api/http/token-store";
import { createOfflineStorage } from "@api/offline/storage";
import { ButtonLink } from "@/components/button-link";
import { Activity, Dumbbell, Trophy } from "lucide-react";
import progressStyles from "./progress.module.css";
import type { SessionRecord } from "@api/domains/training";

export const weekdays = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];
export const number = (n: number) =>
  n.toLocaleString("fa-IR", { maximumFractionDigits: 1 });
export const date = (s: string) => new Date(s).toLocaleDateString("fa-IR");
export const errorText = (e: unknown) => {
  const error = e as { code?: string; message?: string; status?: number };
  if (error.code === "NETWORK_ERROR" || error.message === "Network Error")
    return "ارتباط با سرور برقرار نشد؛ دوباره تلاش کن.";
  if (error.status === 409)
    return "نسخه جدیدتری روی سرور وجود دارد؛ تغییرات محلی حفظ شده‌اند.";
  return e instanceof Error ? e.message : "ارتباط برقرار نشد؛ دوباره تلاش کنید";
};
export const fieldClass =
  "w-full min-h-11 rounded-xl border border-border bg-field px-3 py-2 text-foreground focus:outline-2 focus:outline-accent";
export function useIdentity() {
  return useSyncExternalStore(
    tokenStore.subscribe,
    tokenStore.identity,
    () => "guest",
  );
}
const cache = createOfflineStorage("gym4me-training-read-v1");
export function useTrainingData<T>(
  key: string,
  fetcher: () => Promise<T>,
  offline = false,
) {
  const identity = useIdentity();
  const [state, setState] = useState<{
    data?: T;
    error?: string;
    loading: boolean;
    stale: boolean;
  }>({ loading: true, stale: false });
  const [generation, refresh] = useState(0);
  useEffect(() => {
    let cancelled = false;
    if (identity === "guest") return;
    void (async () => {
      const bytes = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(identity),
      );
      const cacheKey = `${Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("")}:${key}`;
      let cached: T | undefined;
      if (offline) {
        try {
          cached = await cache.get<T>(cacheKey);
        } catch {
          /* Network still works if storage is disabled. */
        }
      }
      if (!cancelled && cached)
        setState({ data: cached, loading: false, stale: true });
      try {
        const data = await fetcher();
        if (cancelled || tokenStore.identity() !== identity) return;
        setState({ data, loading: false, stale: false });
        if (offline) {
          try {
            await cache.set(cacheKey, data);
          } catch {
            /* Session persistence reports its own failures. */
          }
        }
      } catch (e) {
        if (!cancelled)
          setState({
            data: cached,
            loading: false,
            stale: !!cached,
            error: cached ? undefined : errorText(e),
          });
      }
    })().catch((e) => {
      if (!cancelled)
        setState({ loading: false, stale: false, error: errorText(e) });
    });
    return () => {
      cancelled = true;
    };
  }, [identity, key, fetcher, offline, generation]);
  const reload = useCallback(() => {
    setState({ loading: true, stale: false });
    refresh((v) => v + 1);
  }, []);
  return { ...state, reload };
}
export function TrainingFrame({
  title,
  coach = false,
  children,
}: {
  title: string;
  coach?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main
      className="app-page gap-6 [&_.button]:min-h-11 [&_.button]:rounded-3xl [&_.card]:rounded-3xl"
      dir="rtl"
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted mb-2">GYM4ME / TRAINING</p>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <ButtonLink variant="tertiary" href={coach ? "/coach" : "/athlete"}>
          بازگشت به خانه
        </ButtonLink>
      </header>
      <nav aria-label="بخش تمرین" className="flex flex-wrap gap-2">
        <ButtonLink
          variant="secondary"
          href={coach ? "/coach/training" : "/athlete/training"}
        >
          {coach ? "برنامه‌های شاگردان" : "برنامه من"}
        </ButtonLink>
        <ButtonLink
          variant="tertiary"
          href={
            coach ? "/coach/training/exercises" : "/athlete/training/exercises"
          }
        >
          کتابخانه حرکات
        </ButtonLink>
        {!coach && (
          <ButtonLink variant="tertiary" href="/athlete/training/progress">
            روند پیشرفت
          </ButtonLink>
        )}
      </nav>
      {children}
    </main>
  );
}
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-xl border border-border bg-surface-secondary p-4 text-sm leading-7"
    >
      {children}
    </p>
  );
}
export function LoadState({
  loading,
  error,
  reload,
}: {
  loading: boolean;
  error?: string;
  reload: () => void;
}) {
  return loading ? (
    <Notice>در حال دریافت اطلاعات…</Notice>
  ) : error ? (
    <div role="alert" className="space-y-3">
      <p>{error}</p>
      <Button variant="secondary" onPress={reload}>
        تلاش دوباره
      </Button>
    </div>
  ) : null;
}
export function TrainingSummary({ sessions }: { sessions: SessionRecord[] }) {
  const complete = sessions.filter((s) => s.status === "completed");
  const sets = complete.flatMap((s) => s.sets.filter((x) => x.done));
  const metrics = [
    ["جلسه کامل‌شده", complete.length, Trophy],
    ["ست انجام‌شده", sets.length, Activity],
    [
      "حجم ثبت‌شده · کیلوگرم",
      sets.reduce((total, s) => total + s.reps * s.weight, 0),
      Dumbbell,
    ],
  ] as const;
  return (
    <div className={progressStyles.summary}>
      {metrics.map(([label, value, Icon]) => (
        <div key={label} className={progressStyles.stat}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold leading-6">{label}</h3>
            <Icon size={22} className="shrink-0" aria-hidden="true" />
          </div>
          <p className={progressStyles.statValue}>{number(value)}</p>
        </div>
      ))}
    </div>
  );
}
