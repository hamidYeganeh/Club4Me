import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, type TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";

import { AppConfigModule } from "../src/config/app-config.module";
import { GlobalExceptionFilter } from "../src/common/filters/global-exception.filter";
import { ApiResponseInterceptor } from "../src/common/interceptors/api-response.interceptor";
import { ZodValidationPipe } from "../src/common/pipes/zod-validation.pipe";
import { RedisModule } from "../src/infrastructure/redis/redis.module";
import { REDIS_CLIENT } from "../src/infrastructure/redis/redis.types";
import { InMemoryRedis } from "../src/infrastructure/redis/in-memory-redis";
import { AuthModule } from "../src/modules/auth/auth.module";
import { SMS_PROVIDER } from "../src/modules/auth/providers/sms-provider.interface";
import { UsersModule } from "../src/modules/users/users.module";
import { TelemetryModule } from "../src/modules/telemetry/telemetry.module";
import { CapturingSmsProvider } from "./capturing-sms.provider";

export type AuthTestApp = {
  app: INestApplication;
  moduleRef: TestingModule;
  redis: InMemoryRedis;
  sms: CapturingSmsProvider;
};

export async function createAuthTestApp(
  mongoUri: string,
): Promise<AuthTestApp> {
  const redis = new InMemoryRedis();
  const sms = new CapturingSmsProvider();

  const moduleRef = await Test.createTestingModule({
    imports: [
      AppConfigModule,
      RedisModule,
      MongooseModule.forRoot(mongoUri),
      UsersModule,
      AuthModule,
      TelemetryModule,
    ],
    providers: [
      {
        provide: APP_FILTER,
        useClass: GlobalExceptionFilter,
      },
      {
        provide: APP_INTERCEPTOR,
        useClass: ApiResponseInterceptor,
      },
      {
        provide: APP_PIPE,
        useClass: ZodValidationPipe,
      },
    ],
  })
    .overrideProvider(REDIS_CLIENT)
    .useValue(redis)
    .overrideProvider(SMS_PROVIDER)
    .useValue(sms)
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  return { app, moduleRef, redis, sms };
}
