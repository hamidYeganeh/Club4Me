import { Controller, Get } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import type { Connection } from "mongoose";

import { API_VERSIONS, CURRENT_API_VERSION } from "./lib/http";
import { RedisService } from "./infrastructure/redis/redis.service";

@Controller()
export class AppController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly redis: RedisService,
  ) {}

  @Get()
  root() {
    return {
      name: "Gym4Me API",
      version: "0.1.0",
    };
  }

  @Get("health")
  async health() {
    const db = this.connection.db;
    const mongoPing = db ? await db.command({ ping: 1 }) : { ok: 0 };
    const redisPing = await this.redis.ping();

    return {
      status: "ok",
      mongo: mongoPing.ok === 1 ? "connected" : "error",
      redis: redisPing === "PONG" ? "connected" : "error",
    };
  }

  @Get("health/live")
  liveness() {
    return { status: "ok", uptimeSeconds: Math.floor(process.uptime()) };
  }

  @Get("health/ready")
  readiness() {
    return this.health();
  }

  @Get("api")
  apiVersions() {
    return {
      current: CURRENT_API_VERSION,
      versions: API_VERSIONS,
    };
  }
}
