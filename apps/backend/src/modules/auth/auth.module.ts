import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AppConfigModule } from "../../config/app-config.module";
import { AppConfigService } from "../../config/app-config.service";
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

@Module({
  imports: [
    AppConfigModule,
    UsersModule,
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
  ],
  providers: [
    AuthService,
    OtpService,
    TokenService,
    AuthSessionsService,
    JwtAuthGuard,
    RolesGuard,
    {
      provide: SMS_PROVIDER,
      useClass: KavenegarSmsProvider,
    },
  ],
  exports: [
    AuthService,
    TokenService,
    JwtAuthGuard,
    RolesGuard,
    SMS_PROVIDER,
    UsersModule,
  ],
})
export class AuthModule {}
