import { Redis } from "ioredis";

import type { Env } from "../config/env.js";

let redis: Redis | undefined;

export function connectRedis(env: Env): Redis {
  if (redis) {
    return redis;
  }

  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  return redis;
}

export function getRedis(): Redis {
  if (!redis) {
    throw new Error("Redis is not connected. Call connectRedis() first.");
  }

  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = undefined;
  }
}
