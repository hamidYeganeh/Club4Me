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
import {
  CreateCourtDto,
  CreateReservationDto,
  CreateSessionDto,
} from "./dto/reservation.dto";
import { ReservationsService } from "./reservations.service";

@Controller("api/v1/business/clubs/:clubId")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("owner")
export class BusinessReservationsController {
  constructor(private readonly service: ReservationsService) {}
  @Get("courts") listCourts(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
  ) {
    return this.service.listCourts(user.sub, clubId);
  }
  @Post("courts") @HttpCode(HttpStatus.CREATED) createCourt(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: CreateCourtDto,
  ) {
    return this.service.createCourt(user.sub, clubId, body);
  }
  @Get("sessions") listSessions(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
  ) {
    return this.service.listBusinessSessions(user.sub, clubId);
  }
  @Post("sessions") @HttpCode(HttpStatus.CREATED) createSession(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: CreateSessionDto,
  ) {
    return this.service.createSession(user.sub, clubId, body);
  }
}

@Controller("api/v1/public/clubs/:clubId/reservable-sessions")
export class PublicSessionsController {
  constructor(private readonly service: ReservationsService) {}
  @Get() list(@Param("clubId") clubId: string) {
    return this.service.listPublicSessions(clubId);
  }
}

@Controller("api/v1/reservations")
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}
  @Get() list(@CurrentUser() user: AuthTokenPayload) {
    return this.service.listMine(user.sub);
  }
  @Post() @HttpCode(HttpStatus.CREATED) reserve(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreateReservationDto,
  ) {
    return this.service.reserve(user.sub, body);
  }
  @Patch(":reservationId/cancel") cancel(
    @CurrentUser() user: AuthTokenPayload,
    @Param("reservationId") reservationId: string,
  ) {
    return this.service.cancel(user.sub, reservationId);
  }
}
