import { BusinessPortalGuard } from "../auth/guards/business-portal.guard";
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
  CreateBenefitProductDto,
  UpdateBenefitProductDto,
  BenefitPurchaseOptionsDto,
  PauseEntitlementDto,
} from "./entitlements.dto";
import { EntitlementsService } from "./entitlements.service";

@Controller("api/v1/business/clubs/:clubId/benefit-products")
@UseGuards(JwtAuthGuard, BusinessPortalGuard)
export class BusinessBenefitProductsController {
  constructor(private service: EntitlementsService) {}
  @Get() list(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
  ) {
    return this.service.listOwner(user.sub, clubId);
  }
  @Post() create(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: CreateBenefitProductDto,
  ) {
    return this.service.createProduct(user.sub, clubId, body);
  }
  @Patch(":productId") update(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("productId") productId: string,
    @Body() body: UpdateBenefitProductDto,
  ) {
    return this.service.updateStatus(user.sub, clubId, productId, body.status);
  }
}

@Controller("api/v1/public/clubs/:clubId/benefit-products")
export class PublicBenefitProductsController {
  constructor(private service: EntitlementsService) {}
  @Get() list(@Param("clubId") clubId: string) {
    return this.service.listPublic(clubId);
  }
}

@Controller("api/v1/benefit-purchases")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("athlete")
export class BenefitPurchasesController {
  constructor(private service: EntitlementsService) {}
  @Post(":productId") create(
    @CurrentUser() user: AuthTokenPayload,
    @Param("productId") productId: string,
    @Body() body: BenefitPurchaseOptionsDto,
  ) {
    return this.service.createPurchase(user.sub, productId, body);
  }
  @Post("mine/entitlements/:entitlementId/pause") pause(
    @CurrentUser() user: AuthTokenPayload,
    @Param("entitlementId") entitlementId: string,
    @Body() body: PauseEntitlementDto,
  ) {
    return this.service.pause(user.sub, entitlementId, body.days);
  }

  @Post("mine/entitlements/:entitlementId/resume") resume(
    @CurrentUser() user: AuthTokenPayload,
    @Param("entitlementId") entitlementId: string,
  ) {
    return this.service.resume(user.sub, entitlementId);
  }
  @Get("mine/entitlements") listMine(@CurrentUser() user: AuthTokenPayload) {
    return this.service.listMine(user.sub);
  }
  @Get("mine/entitlements/:entitlementId/usage") listUsage(
    @CurrentUser() user: AuthTokenPayload,
    @Param("entitlementId") entitlementId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.listUsage(
      user.sub,
      entitlementId,
      page === undefined ? 1 : Number(page),
      limit === undefined ? 20 : Number(limit),
    );
  }
}
