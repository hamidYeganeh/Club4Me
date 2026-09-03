import { getRedis } from "../db/redis.js";

const refreshKey = (jti: string) => `auth:refresh:${jti}`;
const sessionsKey = (userId: string) => `auth:sessions:${userId}`;

export async function storeRefreshSession(
  userId: string,
  jti: string,
  ttlSeconds: number,
): Promise<void> {
  const redis = getRedis();
  const pipeline = redis.pipeline();

  pipeline.set(refreshKey(jti), userId, "EX", ttlSeconds);
  pipeline.sadd(sessionsKey(userId), jti);
  pipeline.expire(sessionsKey(userId), ttlSeconds);

  await pipeline.exec();
}

export async function refreshSessionExists(
  userId: string,
  jti: string,
): Promise<boolean> {
  const storedUserId = await getRedis().get(refreshKey(jti));
  return storedUserId === userId;
}

export async function replaceRefreshSession(
  userId: string,
  previousJti: string,
  nextJti: string,
  ttlSeconds: number,
): Promise<boolean> {
  const redis = getRedis();
  const storedUserId = await redis.get(refreshKey(previousJti));

  if (storedUserId !== userId) {
    return false;
  }

  const pipeline = redis.pipeline();
  pipeline.del(refreshKey(previousJti));
  pipeline.srem(sessionsKey(userId), previousJti);
  pipeline.set(refreshKey(nextJti), userId, "EX", ttlSeconds);
  pipeline.sadd(sessionsKey(userId), nextJti);
  pipeline.expire(sessionsKey(userId), ttlSeconds);
  await pipeline.exec();

  return true;
}

export async function revokeUserSessions(userId: string): Promise<void> {
  const redis = getRedis();
  const jtis = await redis.smembers(sessionsKey(userId));
  const pipeline = redis.pipeline();

  for (const jti of jtis) {
    pipeline.del(refreshKey(jti));
  }

  pipeline.del(sessionsKey(userId));
  await pipeline.exec();
}
