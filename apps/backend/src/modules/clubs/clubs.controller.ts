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
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { CreateClubDto } from "./dto/create-club.dto";
import { UpdateClubDto } from "./dto/update-club.dto";
import { ReviewClubDto } from "./dto/review-club.dto";
import { ClubsService } from "./clubs.service";

@Controller("api/v1/business/clubs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("owner")
export class ClubsController {
  constructor(private readonly service: ClubsService) {}

  @Get()
  list(@CurrentUser() user: AuthTokenPayload) {
    return this.service.list(user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthTokenPayload, @Body() body: CreateClubDto) {
    return this.service.create(user.sub, body);
  }

  @Get(":clubId")
  get(@CurrentUser() user: AuthTokenPayload, @Param("clubId") clubId: string) {
    return this.service.get(user.sub, clubId);
  }

  @Patch(":clubId")
  update(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: UpdateClubDto,
  ) {
    return this.service.update(user.sub, clubId, body);
  }

  @Post(":clubId/submit")
  submit(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
  ) {
    return this.service.submit(user.sub, clubId);
  }
}

@Controller("api/v1/admin/clubs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminClubsController {
  constructor(private readonly service: ClubsService) {}

  @Get()
  list() {
    return this.service.listForAdmin();
  }

  @Get(":clubId")
  get(@Param("clubId") clubId: string) {
    return this.service.getForAdmin(clubId);
  }

  @Patch(":clubId/review")
  review(@Param("clubId") clubId: string, @Body() body: ReviewClubDto) {
    return this.service.review(clubId, body.status, body.reason);
  }
}

@Controller("api/v1/public/clubs")
export class PublicClubsController {
  constructor(private readonly service: ClubsService) {}

  @Get(":clubId")
  get(@Param("clubId") clubId: string) {
    return this.service.getPublicDetails(clubId);
  }
}
