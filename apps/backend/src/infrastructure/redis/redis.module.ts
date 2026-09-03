import { Global, Module } from "@nestjs/common";
import Redis from "ioredis";

import { AppConfigService } from "../../config/app-config.service";
import { AppConfigModule } from "../../config/app-config.module";
import { REDIS_CLIENT, type RedisClientLike } from "./redis.types";
import { RedisService } from "./redis.service";

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        return new Redis(config.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        }) as unknown as RedisClientLike;
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
