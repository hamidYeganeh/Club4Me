import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { AppError } from "../../common/errors/app.exception";
import { RespondToClubReviewDto } from "./dto/create-club-review.dto";
import { CreateServiceReviewDto, ModerateServiceReviewDto } from "./dto/service-review.dto";
import { ServiceReviewsService } from "./service-reviews.service";
import type { ServiceReviewTarget } from "./schemas/service-review.schema";

@Controller("api/v1/public/reviews")
export class PublicServiceReviewsController {
  constructor(private readonly reviews: ServiceReviewsService) {}
  @Get(":type/:targetId")
  list(@Param("type") type: ServiceReviewTarget, @Param("targetId") targetId: string) {
    return this.reviews.list(assertType(type), targetId);
  }
}

@Controller("api/v1/reviews")
@UseGuards(JwtAuthGuard)
export class ServiceReviewsController {
  constructor(private readonly reviews: ServiceReviewsService) {}

  @Post(":type/:targetId")
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthTokenPayload,
    @Param("type") type: ServiceReviewTarget,
    @Param("targetId") targetId: string,
    @Body() body: CreateServiceReviewDto,
  ) {
    return this.reviews.create(user.sub, assertType(type), targetId, body);
  }

  @Patch(":type/:targetId/:reviewId/response")
  respond(
    @CurrentUser() user: AuthTokenPayload,
    @Param("type") type: ServiceReviewTarget,
    @Param("targetId") targetId: string,
    @Param("reviewId") reviewId: string,
    @Body() body: RespondToClubReviewDto,
  ) {
    return this.reviews.respond(user.sub, assertType(type), targetId, reviewId, body);
  }
}

@Controller("api/v1/admin/service-reviews")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminServiceReviewsController {
  constructor(private readonly reviews: ServiceReviewsService) {}
  @Get()
  list(@Query("status") status?: string) { return this.reviews.adminList(status); }
  @Patch(":reviewId")
  moderate(@Param("reviewId") reviewId: string, @Body() body: ModerateServiceReviewDto) {
    return this.reviews.moderate(reviewId, body);
  }
}

function assertType(value: string): ServiceReviewTarget {
  if (value !== "coach" && value !== "class")
    throw new AppError(404, "REVIEW_TARGET_NOT_FOUND", "Review target not found");
  return value;
}
