import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";

import { AppController } from "./app.controller";
import { AppConfigModule } from "./config/app-config.module";
import { AppConfigService } from "./config/app-config.service";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { ApiResponseInterceptor } from "./common/interceptors/api-response.interceptor";
import { ZodValidationPipe } from "./common/pipes/zod-validation.pipe";
import { RedisModule } from "./infrastructure/redis/redis.module";
import { DiscoveryModule } from "./legacy/discovery.module";
import { ArticlesModule } from "./modules/articles/articles.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ClubsModule } from "./modules/clubs/clubs.module";
import { CoachingModule } from "./modules/coaching/coaching.module";
import { RoleRequestsModule } from "./modules/role-requests/role-requests.module";
import { MediaModule } from "./modules/media/media.module";
import { ReservationsModule } from "./modules/reservations/reservations.module";
import { ClubReviewsModule } from "./modules/reviews/club-reviews.module";
import { ResourcesModule } from "./modules/resources/resources.module";
import { UsersModule } from "./modules/users/users.module";
import { UserLocationsModule } from "./modules/user-locations/user-locations.module";

@Module({
  imports: [
    AppConfigModule,
    RedisModule,
    MongooseModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        uri: config.env.MONGODB_URL,
      }),
    }),
    UsersModule,
    UserLocationsModule,
    AuthModule,
    ClubsModule,
    CoachingModule,
    RoleRequestsModule,
    MediaModule,
    ReservationsModule,
    ClubReviewsModule,
    ResourcesModule,
    ArticlesModule,
    DiscoveryModule,
  ],
  controllers: [AppController],
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
export class AppModule {}
