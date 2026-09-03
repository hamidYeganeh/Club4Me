import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { ClubReviewsService } from "./club-reviews.service";
import { CreateClubReviewDto } from "./dto/create-club-review.dto";

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
