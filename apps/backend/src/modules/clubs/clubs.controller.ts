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
import { VerifyClubDto } from "./dto/verify-club.dto";
import { ClubsService } from "./clubs.service";
import { z } from "zod";

class UpdateSupplyQualityDto {
  static schema = z.object({ status: z.enum(["active", "review_required", "suspended"]), reasons: z.array(z.string().trim().min(1).max(120)).max(20).default([]), assigneeId: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(), nextReviewAt: z.iso.datetime().nullable().optional() }).strict();
  status: "active" | "review_required" | "suspended";
  reasons: string[];
  assigneeId?: string | null;
  nextReviewAt?: string | null;
}

@Controller("api/v1/business/clubs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("owner")
export class ClubsController {
  constructor(private readonly service: ClubsService) {}

  @Get()
  @Roles()
  list(@CurrentUser() user: AuthTokenPayload) {
    return this.service.listAccessible(user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthTokenPayload, @Body() body: CreateClubDto) {
    return this.service.create(user.sub, body);
  }

  @Get(":clubId")
  @Roles()
  get(@CurrentUser() user: AuthTokenPayload, @Param("clubId") clubId: string) {
    return this.service.get(user.sub, clubId, "club.read");
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

  @Get(":clubId/activation")
  @Roles()
  activation(@CurrentUser() user: AuthTokenPayload, @Param("clubId") clubId: string) { return this.service.activation(user.sub, clubId); }
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

  @Get("quality/queue") qualityQueue() { return this.service.qualityQueue(); }

  @Patch(":clubId/quality") quality(@CurrentUser() user: AuthTokenPayload, @Param("clubId") clubId: string, @Body() body: UpdateSupplyQualityDto) { return this.service.updateQuality(clubId, user.sub, body); }

  @Get(":clubId")
  get(@Param("clubId") clubId: string) {
    return this.service.getForAdmin(clubId);
  }

  @Patch(":clubId/review")
  review(@Param("clubId") clubId: string, @Body() body: ReviewClubDto) {
    return this.service.review(clubId, body.status, body.reason);
  }

  @Patch(":clubId/verification")
  verify(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: VerifyClubDto,
  ) {
    return this.service.verify(clubId, user.sub, body.kind, body.verified);
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
