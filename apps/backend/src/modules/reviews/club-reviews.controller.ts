import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { ClubReviewsService } from "./club-reviews.service";
import { CreateClubReviewDto } from "./dto/create-club-review.dto";
import { RespondToClubReviewDto } from "./dto/create-club-review.dto";

@Controller("api/v1/public/clubs/:clubId/reviews")
export class PublicClubReviewsController {
  constructor(private readonly service: ClubReviewsService) {}

  @Get()
  list(@Param("clubId") clubId: string) {
    return this.service.list(clubId);
  }
}

@Controller("api/v1/clubs/:clubId/reviews")
@UseGuards(JwtAuthGuard)
export class ClubReviewsController {
  constructor(private readonly service: ClubReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: CreateClubReviewDto,
  ) {
    return this.service.create(user.sub, clubId, body);
  }
}

@Controller("api/v1/business/clubs/:clubId/reviews")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("owner")
export class BusinessClubReviewsController {
  constructor(private readonly service: ClubReviewsService) {}

  @Patch(":reviewId/response")
  respond(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("reviewId") reviewId: string,
    @Body() body: RespondToClubReviewDto,
  ) {
    return this.service.respond(user.sub, clubId, reviewId, body);
  }
}
