import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import {
  CreatePaymentIntentDto,
  QuotePaymentDto,
  MockPaymentCallbackDto,
  MockPaymentDecisionDto,
  RefundPaymentDto,
  CreatePayoutDto,
  ReviewPayoutDto,
  PayoutBalanceDto,
} from "./commerce.dto";
import { CommerceService } from "./commerce.service";
import { PayoutsService } from "./payouts.service";

@Controller("api/v1/payments")
export class CommerceController {
  constructor(private readonly commerce: CommerceService) {}

  @Post("quote")
  @UseGuards(JwtAuthGuard)
  quote(@CurrentUser() user: AuthTokenPayload, @Body() body: QuotePaymentDto) {
    return this.commerce.quotePayment(user.sub, body);
  }

  @Post("intents")
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreatePaymentIntentDto,
  ) {
    return this.commerce.createIntent(user.sub, body);
  }

  @Post("intents/:intentId/mock/decision")
  @UseGuards(JwtAuthGuard)
  simulate(
    @CurrentUser() user: AuthTokenPayload,
    @Param("intentId") intentId: string,
    @Body() body: MockPaymentDecisionDto,
  ) {
    return this.commerce.simulate(user.sub, intentId, body.status);
  }

  @Post("callbacks/mock")
  callback(
    @Body() body: MockPaymentCallbackDto,
    @Headers("x-payment-signature") signature?: string,
  ) {
    return this.commerce.processCallback(body, signature);
  }
}

@Controller("api/v1/payouts")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("owner", "coach")
export class PayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Post()
  request(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreatePayoutDto,
  ) {
    return this.payouts.request(user.sub, body);
  }

  @Post("balance")
  balance(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: PayoutBalanceDto,
  ) {
    return this.payouts.balance(user.sub, body.providerType, body.providerId);
  }

  @Get("mine")
  listMine(@CurrentUser() user: AuthTokenPayload) {
    return this.payouts.listMine(user.sub);
  }

  @Post(":payoutId/cancel")
  cancel(
    @CurrentUser() user: AuthTokenPayload,
    @Param("payoutId") payoutId: string,
  ) {
    return this.payouts.cancel(user.sub, payoutId);
  }
}

@Controller("api/v1/admin/payments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminCommerceController {
  constructor(
    private readonly commerce: CommerceService,
    private readonly payouts: PayoutsService,
  ) {}

  @Post(":intentId/refunds")
  refund(@Param("intentId") intentId: string, @Body() body: RefundPaymentDto) {
    return this.commerce.refund(intentId, body);
  }

  @Post("reconciliation/run")
  reconcile() {
    return this.commerce.reconcile();
  }

  @Get("payouts")
  listPayouts(@Query("status") status?: string) {
    return this.payouts.listAdmin(status);
  }

  @Post("payouts/:payoutId/review")
  reviewPayout(
    @CurrentUser() user: AuthTokenPayload,
    @Param("payoutId") payoutId: string,
    @Body() body: ReviewPayoutDto,
  ) {
    return this.payouts.review(user.sub, payoutId, body);
  }
}
