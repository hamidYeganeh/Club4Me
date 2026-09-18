import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
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
import { ClubsRepository } from "../clubs/clubs.repository";
import { z } from "zod";

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

class BusinessDiscountDto {
  static schema = z
    .object({
      code: z
        .string()
        .trim()
        .min(3)
        .max(30)
        .regex(/^[A-Za-z0-9_-]+$/),
      title: z.string().trim().min(3).max(120),
      kind: z.enum(["percent", "fixed"]),
      value: z.number().int().positive(),
      maxDiscount: z.number().int().positive().nullable(),
      minOrderAmount: z.number().int().min(0),
      budget: z.number().int().positive(),
      perUserLimit: z.number().int().min(1).max(100),
      usageLimit: z.number().int().positive().nullable(),
      firstPurchaseOnly: z.boolean(),
      startsAt: z.iso.datetime(),
      endsAt: z.iso.datetime(),
    })
    .strict()
    .refine((item) => item.kind !== "percent" || item.value <= 100);
  code: string;
  title: string;
  kind: "percent" | "fixed";
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number;
  budget: number;
  perUserLimit: number;
  usageLimit: number | null;
  firstPurchaseOnly: boolean;
  startsAt: string;
  endsAt: string;
}

@Controller("api/v1/business/clubs/:clubId/discounts")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("owner")
export class BusinessDiscountsController {
  constructor(
    private readonly benefits: BenefitsService,
    private readonly clubs: ClubsRepository,
  ) {}
  @Get()
  async list(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
  ) {
    await this.clubs.findForOwner(user.sub, clubId);
    return this.benefits.listClubDiscounts(clubId);
  }
  @Post()
  async create(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: BusinessDiscountDto,
  ) {
    await this.clubs.findForOwner(user.sub, clubId);
    return this.benefits.createDiscount({
      ...body,
      clubIds: [clubId],
      scopeType: "club",
      scopeIds: [clubId],
      funding: [{ source: "provider", percentage: 100 }],
      referredOnly: false,
      eligibleUserIds: [],
    });
  }
}
