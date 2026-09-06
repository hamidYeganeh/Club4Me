import type { OfflineStorage } from "./storage";

export type OfflineAction = {
  id: string;
  type: string;
  entityKey: string;
  payload: unknown;
  createdAt: number;
  status: "pending" | "failed";
};
export type OfflineActionHandler = (payload: unknown) => Promise<void>;

/** Only registered, replay-safe operations can enter this queue. Never enqueue arbitrary HTTP requests. */
export class OfflineOutbox {
  private serial: Promise<unknown> = Promise.resolve();
  private stopped = false;
  constructor(
    private storage: OfflineStorage,
    private key: string,
    private handlers: Record<string, OfflineActionHandler>,
    private isCurrentSession: () => boolean,
    private onChange: (actions: OfflineAction[]) => void,
  ) {}

  stop() {
    this.stopped = true;
  }
  clear() {
    this.stop();
    // Wait for any in-flight write before deleting this session's queue.
    return this.exclusive(() => this.storage.remove(this.key));
  }
  private active() {
    return !this.stopped && this.isCurrentSession();
  }
  private exclusive<T>(work: () => Promise<T>): Promise<T> {
    const execute = async (): Promise<T> =>
      typeof navigator !== "undefined" && navigator.locks
        ? await navigator.locks.request(this.key, work)
        : await work();
    const next = this.serial.then(execute, execute);
    this.serial = next.catch(() => undefined);
    return next;
  }
  async read(): Promise<OfflineAction[]> {
    const value = await this.storage.get<OfflineAction[]>(this.key);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.entityKey === "string" &&
        typeof item.type === "string" &&
        (item.status === "pending" || item.status === "failed"),
    );
  }
  enqueue(type: string, entityKey: string, payload: unknown) {
    return this.exclusive(async () => {
      if (!this.active() || !this.handlers[type])
        throw new Error("Offline operation is unavailable");
      const actions = (await this.read()).filter(
        (item) => item.entityKey !== entityKey,
      );
      if (actions.length >= 200) throw new Error("Offline queue is full");
      const action: OfflineAction = {
        id: crypto.randomUUID(),
        type,
        entityKey,
        payload,
        createdAt: Date.now(),
        status: "pending",
      };
      actions.push(action);
      await this.storage.set(this.key, actions);
      if (!this.active()) throw new Error("Session changed");
      this.onChange(actions);
    });
  }
  flush() {
    return this.exclusive(async () => {
      if (
        !this.active() ||
        (typeof navigator !== "undefined" && navigator.onLine === false)
      )
        return;
      const actions = await this.read();
      for (const action of [...actions]) {
        if (!this.active()) return;
        if (action.status === "failed") continue;
        const handler = this.handlers[action.type];
        try {
          if (!handler)
            throw Object.assign(new Error("Unknown offline operation"), {
              status: 422,
            });
          await handler(action.payload);
          actions.splice(actions.indexOf(action), 1);
        } catch (error) {
          const status = (error as { status?: number })?.status;
          // Authentication and temporary failures retain the action for a later retry.
          if (
            !status ||
            status === 401 ||
            status === 408 ||
            status === 429 ||
            status >= 500
          )
            break;
          action.status = "failed";
        }
        if (!this.active()) return;
        await this.storage.set(this.key, actions);
        this.onChange([...actions]);
      }
    });
  }
  discardFailed() {
    return this.exclusive(async () => {
      if (!this.active()) return;
      const actions = (await this.read()).filter(
        (action) => action.status !== "failed",
      );
      await this.storage.set(this.key, actions);
      this.onChange(actions);
    });
  }
}
