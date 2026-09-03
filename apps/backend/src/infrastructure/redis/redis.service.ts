import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";

import { ROTATE_REFRESH_LUA } from "./rotate-refresh.lua";
import { REDIS_CLIENT } from "./redis.types";
import type { RedisClientLike } from "./redis.types";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClientLike) {}

  async onModuleInit(): Promise<void> {
    if (typeof this.client.connect === "function") {
      await this.client.connect();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  getClient(): RedisClientLike {
    return this.client;
  }

  ping(): Promise<string> {
    return this.client.ping();
  }

  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  set(
    key: string,
    value: string,
    expiryMode: "EX" | "PX",
    time: number,
  ): Promise<unknown> {
    return this.client.set(key, value, expiryMode, time);
  }

  del(...keys: string[]): Promise<number> {
    return this.client.del(...keys);
  }

  incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  pttl(key: string): Promise<number> {
    return this.client.pttl(key);
  }

  expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  sadd(key: string, member: string): Promise<number> {
    return this.client.sadd(key, member);
  }

  srem(key: string, member: string): Promise<number> {
    return this.client.srem(key, member);
  }

  smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  pipeline() {
    return this.client.pipeline();
  }

  eval(
    script: string,
    numKeys: number,
    ...args: Array<string | number>
  ): Promise<unknown> {
    return this.client.eval(script, numKeys, ...args);
  }

  rotateRefresh(
    previousKey: string,
    sessionsKey: string,
    nextKey: string,
    userId: string,
    previousJti: string,
    nextJti: string,
    ttlSeconds: number,
  ): Promise<unknown> {
    return this.client.eval(
      ROTATE_REFRESH_LUA,
      3,
      previousKey,
      sessionsKey,
      nextKey,
      userId,
      previousJti,
      nextJti,
      ttlSeconds,
    );
  }
}
