import { ROTATE_REFRESH_LUA } from "./rotate-refresh.lua";
import type {
  RedisClientLike,
  RedisPipelineLike,
  RedisSetExpiry,
} from "./redis.types";

type KvEntry = {
  value: string;
  expireAt: number | null;
};

type SetEntry = {
  members: Set<string>;
  expireAt: number | null;
};

class InMemoryPipeline implements RedisPipelineLike {
  private readonly ops: Array<() => Promise<unknown>> = [];

  constructor(private readonly redis: InMemoryRedis) {}

  set(
    key: string,
    value: string,
    expiryMode: RedisSetExpiry,
    time: number,
  ): this {
    this.ops.push(() => this.redis.set(key, value, expiryMode, time));
    return this;
  }

  sadd(key: string, member: string): this {
    this.ops.push(() => this.redis.sadd(key, member));
    return this;
  }

  expire(key: string, seconds: number): this {
    this.ops.push(() => this.redis.expire(key, seconds));
    return this;
  }

  del(key: string): this {
    this.ops.push(() => this.redis.del(key));
    return this;
  }

  srem(key: string, member: string): this {
    this.ops.push(() => this.redis.srem(key, member));
    return this;
  }

  async exec(): Promise<unknown> {
    const results: unknown[] = [];
    for (const op of this.ops) {
      results.push(await op());
    }
    return results;
  }
}

export class InMemoryRedis implements RedisClientLike {
  private readonly kv = new Map<string, KvEntry>();
  private readonly sets = new Map<string, SetEntry>();

  private now(): number {
    return Date.now();
  }

  private isAlive(expireAt: number | null): boolean {
    return expireAt === null || expireAt > this.now();
  }

  private getKv(key: string): KvEntry | undefined {
    const entry = this.kv.get(key);
    if (!entry) {
      return undefined;
    }
    if (!this.isAlive(entry.expireAt)) {
      this.kv.delete(key);
      return undefined;
    }
    return entry;
  }

  private getSet(key: string): SetEntry | undefined {
    const entry = this.sets.get(key);
    if (!entry) {
      return undefined;
    }
    if (!this.isAlive(entry.expireAt)) {
      this.sets.delete(key);
      return undefined;
    }
    return entry;
  }

  async get(key: string): Promise<string | null> {
    return this.getKv(key)?.value ?? null;
  }

  async set(
    key: string,
    value: string,
    expiryMode?: RedisSetExpiry,
    time?: number,
  ): Promise<"OK"> {
    let expireAt: number | null = null;
    if (expiryMode === "EX" && time !== undefined) {
      expireAt = this.now() + time * 1000;
    }
    if (expiryMode === "PX" && time !== undefined) {
      expireAt = this.now() + time;
    }
    this.kv.set(key, { value, expireAt });
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let removed = 0;
    for (const key of keys) {
      if (this.kv.delete(key)) {
        removed += 1;
      }
      if (this.sets.delete(key)) {
        removed += 1;
      }
    }
    return removed;
  }

  async incr(key: string): Promise<number> {
    const current = this.getKv(key);
    const next = Number(current?.value ?? "0") + 1;
    this.kv.set(key, {
      value: String(next),
      expireAt: current?.expireAt ?? null,
    });
    return next;
  }

  async pttl(key: string): Promise<number> {
    const entry = this.getKv(key) ?? this.getSet(key);
    if (!entry) {
      return -2;
    }
    if (entry.expireAt === null) {
      return -1;
    }
    return Math.max(entry.expireAt - this.now(), 0);
  }

  async expire(key: string, seconds: number): Promise<number> {
    const kv = this.getKv(key);
    if (kv) {
      kv.expireAt = this.now() + seconds * 1000;
      return 1;
    }
    const set = this.getSet(key);
    if (set) {
      set.expireAt = this.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }

  async sadd(key: string, member: string): Promise<number> {
    const existing = this.getSet(key);
    const entry = existing ?? { members: new Set<string>(), expireAt: null };
    const sizeBefore = entry.members.size;
    entry.members.add(member);
    this.sets.set(key, entry);
    return entry.members.size === sizeBefore ? 0 : 1;
  }

  async srem(key: string, member: string): Promise<number> {
    const entry = this.getSet(key);
    if (!entry) {
      return 0;
    }
    return entry.members.delete(member) ? 1 : 0;
  }

  async smembers(key: string): Promise<string[]> {
    const entry = this.getSet(key);
    return entry ? [...entry.members] : [];
  }

  async ping(): Promise<string> {
    return "PONG";
  }

  async flush(): Promise<void> {
    this.kv.clear();
    this.sets.clear();
  }

  async quit(): Promise<"OK"> {
    await this.flush();
    return "OK";
  }

  pipeline(): RedisPipelineLike {
    return new InMemoryPipeline(this);
  }

  async eval(
    script: string,
    numKeys: number,
    ...args: Array<string | number>
  ): Promise<unknown> {
    if (script.trim() !== ROTATE_REFRESH_LUA) {
      throw new Error("Unsupported Lua script in InMemoryRedis");
    }

    const keys = args.slice(0, numKeys).map(String);
    const argv = args.slice(numKeys).map(String);
    const previousKey = keys[0];
    const sessionsKey = keys[1];
    const nextKey = keys[2];
    const userId = argv[0];
    const previousJti = argv[1];
    const nextJti = argv[2];
    const ttlSeconds = Number(argv[3]);

    if (
      !previousKey ||
      !sessionsKey ||
      !nextKey ||
      !userId ||
      !previousJti ||
      !nextJti ||
      !Number.isFinite(ttlSeconds)
    ) {
      return 0;
    }

    const stored = await this.get(previousKey);
    if (stored !== userId) {
      return 0;
    }

    await this.del(previousKey);
    await this.srem(sessionsKey, previousJti);
    await this.set(nextKey, userId, "EX", ttlSeconds);
    await this.sadd(sessionsKey, nextJti);
    await this.expire(sessionsKey, ttlSeconds);
    return 1;
  }
}
