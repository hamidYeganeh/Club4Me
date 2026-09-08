import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { ConfirmSocialLinkDto, ExchangeSocialTicketDto, RequestSocialLinkOtpDto, StartSocialAuthDto } from "./dto/social-auth.dto";
import { SocialAuthService } from "./social-auth.service";
import type { SocialProvider } from "./schemas/social-identity.schema";

@Controller("api/v1/account/auth/social")
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class SocialAuthController {
  constructor(private readonly social: SocialAuthService) {}
  @Get("providers") providers() { return this.social.providers(); }
  @Post("start") start(@Body() body: StartSocialAuthDto) { return this.social.start(body.provider, body.returnTo); }
  @Get(":provider/callback") async callback(@Param("provider") provider: SocialProvider, @Query("state") state: string, @Query("code") code: string, @Res() response: Response) {
    response.redirect(302, await this.social.callback(provider, state, code));
  }
  @Post("exchange") @HttpCode(HttpStatus.OK) exchange(@Body() body: ExchangeSocialTicketDto) { return this.social.exchange(body.ticket); }
  @Post("link/otp") requestLinkOtp(@Body() body: RequestSocialLinkOtpDto) { return this.social.requestLinkOtp(body.linkToken, body.phone); }
  @Post("link/confirm") confirmLink(@Body() body: ConfirmSocialLinkDto) { return this.social.confirmLink(body.linkToken, body.phone, body.code); }
}
