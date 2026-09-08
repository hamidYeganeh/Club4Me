import { ClubAccessService } from "../clubs/club-access.service";
import { BusinessPortalGuard } from "./guards/business-portal.guard";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";

import { AppConfigModule } from "../../config/app-config.module";
import { AppConfigService } from "../../config/app-config.service";
import { RedisModule } from "../../infrastructure/redis/redis.module";
import { UsersModule } from "../users/users.module";
import { AdminUsersController } from "../users/admin-users.controller";
import { AuthController } from "./auth.controller";
import {
  AdminAuthController,
  BusinessAuthController,
} from "./portal-auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { KavenegarSmsProvider } from "./providers/kavenegar-sms.provider";
import { SMS_PROVIDER } from "./providers/sms-provider.interface";
import { AuthSessionsService } from "./services/auth-sessions.service";
import { OtpService } from "./services/otp.service";
import { TokenService } from "./services/token.service";
import { SocialIdentity, SocialIdentitySchema } from "./schemas/social-identity.schema";
import { SocialAuthController } from "./social-auth.controller";
import { SocialAuthService } from "./social-auth.service";
import { DataConsent, DataConsentSchema } from "./schemas/data-consent.schema";
import { PrivacyService } from "./privacy.service";

@Module({
  imports: [
    AppConfigModule,
    RedisModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: SocialIdentity.name, schema: SocialIdentitySchema },
      { name: DataConsent.name, schema: DataConsentSchema },
    ]),
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.env.JWT_SECRET,
      }),
    }),
  ],
  controllers: [
    AuthController,
    AdminAuthController,
    BusinessAuthController,
    AdminUsersController,
    SocialAuthController,
  ],
  providers: [
    ClubAccessService,
    BusinessPortalGuard,
    AuthService,
    OtpService,
    TokenService,
    AuthSessionsService,
    JwtAuthGuard,
    RolesGuard,
    SocialAuthService,
    PrivacyService,
    {
      provide: SMS_PROVIDER,
      useClass: KavenegarSmsProvider,
    },
  ],
  exports: [
    ClubAccessService,
    BusinessPortalGuard,
    AuthService,
    TokenService,
    JwtAuthGuard,
    RolesGuard,
    SMS_PROVIDER,
    UsersModule,
  ],
})
export class AuthModule {}
