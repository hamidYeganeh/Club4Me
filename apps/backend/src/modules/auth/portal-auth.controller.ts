import { BusinessPortalGuard } from "./guards/business-portal.guard";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "./decorators/current-user.decorator";
import { Roles } from "./decorators/roles.decorator";
import { ConfirmForgotPasswordDto } from "./dto/confirm-forgot-password.dto";
import { ConfirmOtpDto } from "./dto/confirm-otp.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { SetPasswordDto } from "./dto/set-password.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { AuthService } from "./auth.service";
import type { AuthTokenPayload } from "./services/token.service";

@Controller("api/v1/admin")
@Roles("admin")
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("auth/otp")
  @HttpCode(HttpStatus.CREATED)
  requestOtp(@Body() body: RequestOtpDto) {
    return this.authService.requestLoginOtp(body.phone, "admin");
  }

  @Post("auth/otp/confirm")
  @HttpCode(HttpStatus.OK)
  confirmOtp(@Body() body: ConfirmOtpDto) {
    return this.authService.confirmLoginOtp(body.phone, body.code, "admin");
  }

  @Post("auth/login")
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.authService.loginWithPassword(
      body.phone,
      body.password,
      "admin",
    );
  }

  @Post("auth/set-password")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  setPassword(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: SetPasswordDto,
  ) {
    return this.authService.setPassword(
      user.sub,
      body.password,
      body.currentPassword,
    );
  }

  @Post("auth/forgot-password")
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body.phone, "admin");
  }

  @Post("auth/forgot-password/confirm")
  @HttpCode(HttpStatus.OK)
  confirmForgotPassword(@Body() body: ConfirmForgotPasswordDto) {
    return this.authService.confirmPasswordReset(
      body.phone,
      body.code,
      body.password,
      "admin",
    );
  }

  @Post("auth/refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshAuth(body.refreshToken, "admin");
  }

  @Post("auth/logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  logout(@CurrentUser() user: AuthTokenPayload) {
    return this.authService.logoutUser(user.sub);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard, RolesGuard)
  me(@CurrentUser() user: AuthTokenPayload) {
    return this.authService.getMe(user.sub);
  }
}

@Controller("api/v1/business")
export class BusinessAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("auth/otp")
  @HttpCode(HttpStatus.CREATED)
  requestOtp(@Body() body: RequestOtpDto) {
    return this.authService.requestLoginOtp(body.phone, "business");
  }

  @Post("auth/otp/confirm")
  @HttpCode(HttpStatus.OK)
  confirmOtp(@Body() body: ConfirmOtpDto) {
    return this.authService.confirmLoginOtp(body.phone, body.code, "business");
  }

  @Post("auth/login")
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.authService.loginWithPassword(
      body.phone,
      body.password,
      "business",
    );
  }

  @Post("auth/set-password")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, BusinessPortalGuard)
  setPassword(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: SetPasswordDto,
  ) {
    return this.authService.setPassword(
      user.sub,
      body.password,
      body.currentPassword,
    );
  }

  @Post("auth/forgot-password")
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body.phone, "business");
  }

  @Post("auth/forgot-password/confirm")
  @HttpCode(HttpStatus.OK)
  confirmForgotPassword(@Body() body: ConfirmForgotPasswordDto) {
    return this.authService.confirmPasswordReset(
      body.phone,
      body.code,
      body.password,
      "business",
    );
  }

  @Post("auth/refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshAuth(body.refreshToken, "business");
  }

  @Post("auth/logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, BusinessPortalGuard)
  logout(@CurrentUser() user: AuthTokenPayload) {
    return this.authService.logoutUser(user.sub);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard, BusinessPortalGuard)
  me(@CurrentUser() user: AuthTokenPayload) {
    return this.authService.getMe(user.sub);
  }
}
