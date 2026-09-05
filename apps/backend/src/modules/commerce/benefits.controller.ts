import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import {
  CreateDiscountDto,
  CreditWalletDto,
  QuoteDiscountDto,
  RedeemReferralDto,
} from "./benefits.dto";
import { BenefitsService } from "./benefits.service";

@Controller("api/v1/benefits")
@UseGuards(JwtAuthGuard)
export class BenefitsController {
  constructor(private benefits: BenefitsService) {}
  @Get("wallet") wallet(@CurrentUser() user: AuthTokenPayload) {
    return this.benefits.wallet(user.sub);
  }
  @Post("discounts/quote") quote(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: QuoteDiscountDto,
  ) {
    return this.benefits.quoteDiscount(user.sub, body.code, body.referenceId);
  }
  @Get("referral-code") referralCode(@CurrentUser() user: AuthTokenPayload) {
    return this.benefits.myReferralCode(user.sub);
  }
  @Post("referrals/redeem") referral(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: RedeemReferralDto,
  ) {
    return this.benefits.redeemReferral(user.sub, body.code);
  }
}

@Controller("api/v1/admin/benefits")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminBenefitsController {
  constructor(private benefits: BenefitsService) {}
  @Post("wallet/credits") credit(@Body() body: CreditWalletDto) {
    return this.benefits.credit(body);
  }
  @Post("discounts") discount(@Body() body: CreateDiscountDto) {
    return this.benefits.createDiscount(body);
  }
}
