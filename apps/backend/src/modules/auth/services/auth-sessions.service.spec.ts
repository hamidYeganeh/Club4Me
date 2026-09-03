import { InMemoryRedis } from "../../../infrastructure/redis/in-memory-redis";
import { RedisService } from "../../../infrastructure/redis/redis.service";
import { AuthSessionsService } from "./auth-sessions.service";

describe("AuthSessionsService", () => {
  const userId = "507f1f77bcf86cd799439011";
  let sessions: AuthSessionsService;
  let redis: InMemoryRedis;

  beforeEach(() => {
    redis = new InMemoryRedis();
    sessions = new AuthSessionsService(new RedisService(redis));
  });

  it("rotates refresh sessions atomically and rejects replay", async () => {
    await sessions.storeRefreshSession(userId, "jti-1", 60);

    const rotated = await sessions.replaceRefreshSession(
      userId,
      "jti-1",
      "jti-2",
      60,
    );
    expect(rotated).toBe(true);
    await expect(sessions.refreshSessionExists(userId, "jti-1")).resolves.toBe(
      false,
    );
    await expect(sessions.refreshSessionExists(userId, "jti-2")).resolves.toBe(
      true,
    );

    const replayed = await sessions.replaceRefreshSession(
      userId,
      "jti-1",
      "jti-3",
      60,
    );
    expect(replayed).toBe(false);
    await expect(sessions.refreshSessionExists(userId, "jti-2")).resolves.toBe(
      true,
    );
  });

  it("revokes every refresh session for a user", async () => {
    await sessions.storeRefreshSession(userId, "jti-a", 60);
    await sessions.storeRefreshSession(userId, "jti-b", 60);

    await sessions.revokeUserSessions(userId);

    await expect(sessions.refreshSessionExists(userId, "jti-a")).resolves.toBe(
      false,
    );
    await expect(sessions.refreshSessionExists(userId, "jti-b")).resolves.toBe(
      false,
    );
    await expect(redis.smembers(`auth:sessions:${userId}`)).resolves.toEqual(
      [],
    );
  });
});
