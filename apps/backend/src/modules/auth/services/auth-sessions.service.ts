import { Injectable } from "@nestjs/common";

import { RedisService } from "../../../infrastructure/redis/redis.service";

const refreshKey = (jti: string) => `auth:refresh:${jti}`;
const sessionsKey = (userId: string) => `auth:sessions:${userId}`;

@Injectable()
export class AuthSessionsService {
  constructor(private readonly redis: RedisService) {}

  async storeRefreshSession(
    userId: string,
    jti: string,
    ttlSeconds: number,
  ): Promise<void> {
    const pipeline = this.redis.pipeline();

    pipeline.set(refreshKey(jti), userId, "EX", ttlSeconds);
    pipeline.sadd(sessionsKey(userId), jti);
    pipeline.expire(sessionsKey(userId), ttlSeconds);

    await pipeline.exec();
  }

  async refreshSessionExists(userId: string, jti: string): Promise<boolean> {
    const storedUserId = await this.redis.get(refreshKey(jti));
    return storedUserId === userId;
  }

  async replaceRefreshSession(
    userId: string,
    previousJti: string,
    nextJti: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const rotated = await this.redis.rotateRefresh(
      refreshKey(previousJti),
      sessionsKey(userId),
      refreshKey(nextJti),
      userId,
      previousJti,
      nextJti,
      ttlSeconds,
    );

    return rotated === 1;
  }

  async revokeUserSessions(userId: string): Promise<void> {
    const jtis = await this.redis.smembers(sessionsKey(userId));
    const pipeline = this.redis.pipeline();

    for (const jti of jtis) {
      pipeline.del(refreshKey(jti));
    }

    pipeline.del(sessionsKey(userId));
    await pipeline.exec();
  }
}
