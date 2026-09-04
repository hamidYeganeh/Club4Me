import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { CurrentUser } from "./decorators/current-user.decorator";
import { ConfirmForgotPasswordDto } from "./dto/confirm-forgot-password.dto";
import { ConfirmOtpDto } from "./dto/confirm-otp.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { SetPasswordDto } from "./dto/set-password.dto";
import { DeleteAccountDto } from "./dto/delete-account.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import type { AuthTokenPayload } from "./services/token.service";

@Controller("api/v1/account")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("auth/otp")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  requestOtp(@Body() body: RequestOtpDto) {
    return this.authService.requestLoginOtp(body.phone);
  }

  @Post("auth/otp/confirm")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  confirmOtp(@Body() body: ConfirmOtpDto) {
    return this.authService.confirmLoginOtp(body.phone, body.code);
  }

  @Post("auth/login")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.authService.loginWithPassword(body.phone, body.password);
  }

  @Post("auth/set-password")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
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
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body.phone);
  }

  @Post("auth/forgot-password/confirm")
  @HttpCode(HttpStatus.OK)
  confirmForgotPassword(@Body() body: ConfirmForgotPasswordDto) {
    return this.authService.confirmPasswordReset(
      body.phone,
      body.code,
      body.password,
    );
  }

  @Post("auth/refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshAuth(body.refreshToken);
  }

  @Post("auth/logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: AuthTokenPayload) {
    return this.authService.logoutUser(user.sub);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthTokenPayload) {
    return this.authService.getMe(user.sub);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  deleteAccount(
    @CurrentUser() user: AuthTokenPayload,
    @Body() _body: DeleteAccountDto,
  ) {
    return this.authService.deleteAccount(user.sub);
  }
}
