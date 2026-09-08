import type { SessionRecord, SessionWrite } from "../domains/training";
import { sessionRequest } from "../http/client";
import { tokenStore } from "../http/token-store";
import { createOfflineStorage, type OfflineStorage } from "./storage";

export type LocalWorkout = {
  session: SessionRecord;
  dirty: boolean;
  pending?: SessionWrite;
  restUntil?: number;
  conflicted?: boolean;
};
export type WorkoutState = { workouts: LocalWorkout[] };
/** Acknowledged payloads are retained verbatim for safe replay after a lost response. */
export class TrainingStore {
  private serial: Promise<unknown> = Promise.resolve();
  constructor(
    private storage: OfflineStorage,
    private key: string,
    private send: (id: string, body: SessionWrite) => Promise<SessionRecord>,
  ) {}
  private locked<T>(action: () => Promise<T>): Promise<T> {
    const run = async (): Promise<T> =>
      typeof navigator !== "undefined" && navigator.locks
        ? await navigator.locks.request(
            `training:${this.key}`,
            async () => await action(),
          )
        : await action();
    const next = this.serial.then(run, run);
    this.serial = next.catch(() => {});
    return next;
  }
  read() {
    return this.locked(
      async () =>
        (await this.storage.get<WorkoutState>(this.key)) ?? { workouts: [] },
    );
  }
  save(session: SessionRecord, restUntil?: number) {
    return this.locked(async () => {
      const state = (await this.storage.get<WorkoutState>(this.key)) ?? {
        workouts: [],
      };
      const previous = state.workouts.find(
        (w) => w.session.clientId === session.clientId,
      );
      const workout = {
        session: {
          ...session,
          revision: previous?.session.revision ?? session.revision,
        },
        dirty: true,
        pending: previous?.pending,
        conflicted: previous?.conflicted,
        restUntil,
      };
      state.workouts = [
        ...state.workouts.filter(
          (w) => w.session.clientId !== session.clientId,
        ),
        workout,
      ];
      await this.storage.set(this.key, state);
      return workout;
    });
  }
  update(
    clientId: string,
    edit: (session: SessionRecord) => SessionRecord,
    restUntil?: number,
  ) {
    return this.locked(async () => {
      const state = (await this.storage.get<WorkoutState>(this.key)) ?? {
        workouts: [],
      };
      const workout = state.workouts.find(
        (w) => w.session.clientId === clientId,
      );
      if (!workout || workout.session.status !== "active")
        throw new Error("جلسه دیگر فعال نیست");
      workout.session = edit(workout.session);
      workout.dirty = true;
      if (restUntil !== undefined) workout.restUntil = restUntil;
      await this.storage.set(this.key, state);
    });
  }
  sync() {
    // Serialization also prevents a network acknowledgement from overwriting a newer local edit.
    return this.locked(async () => {
      const state = (await this.storage.get<WorkoutState>(this.key)) ?? {
        workouts: [],
      };
      let firstRejection: unknown;
      for (const workout of state.workouts) {
        if (!workout.dirty && !workout.pending) continue;
        for (;;) {
          const s = workout.session;
          if (!workout.pending) {
            workout.pending = {
              assignmentId: s.assignmentId,
              dayId: s.dayId,
              startedAt: s.startedAt,
              finishedAt: s.finishedAt,
              status: s.status,
              sets: s.sets,
              note: s.note,
              mutationId: crypto.randomUUID(),
              expectedRevision: s.revision,
            };
            workout.dirty = false;
            await this.storage.set(this.key, state);
          }
          let acknowledged: SessionRecord;
          try {
            acknowledged = await this.send(s.clientId, workout.pending);
          } catch (error) {
            const status = (error as { status?: number }).status;
            if (status && status >= 400 && status < 500 && status !== 401) {
              workout.conflicted = status === 409;
              await this.storage.set(this.key, state);
              firstRejection ??= error;
              break;
            }
            throw error;
          }
          workout.session = workout.dirty
            ? { ...workout.session, revision: acknowledged.revision }
            : acknowledged;
          workout.pending = undefined;
          workout.conflicted = false;
          await this.storage.set(this.key, state);
          if (!workout.dirty) break;
        }
      }
      if (firstRejection) throw firstRejection;
      return state;
    });
  }
  /** Explicit conflict resolution: only the user may replace an unsynced draft. */
  useServer(session: SessionRecord) {
    return this.locked(async () => {
      const state = (await this.storage.get<WorkoutState>(this.key)) ?? {
        workouts: [],
      };
      state.workouts = [
        ...state.workouts.filter(
          (w) => w.session.clientId !== session.clientId,
        ),
        { session, dirty: false },
      ];
      await this.storage.set(this.key, state);
    });
  }
}
const stores = new Map<string, Promise<TrainingStore>>();
export function trainingStore(identity: string) {
  if (identity === "guest") throw new Error("برای تمرین وارد حساب شوید");
  if (!stores.has(identity))
    stores.set(
      identity,
      (async () => {
        const hash = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(identity),
        );
        const key = Array.from(new Uint8Array(hash), (b) =>
          b.toString(16).padStart(2, "0"),
        ).join("");
        return new TrainingStore(
          createOfflineStorage("gym4me-training-v1"),
          key,
          (id, body) => {
            if (tokenStore.identity() !== identity)
              throw new Error("حساب کاربری تغییر کرده است");
            return sessionRequest<SessionRecord>(
              identity,
              "PUT",
              `/training/sessions/${id}`,
              body,
            );
          },
        );
      })(),
    );
  return stores.get(identity)!;
}
