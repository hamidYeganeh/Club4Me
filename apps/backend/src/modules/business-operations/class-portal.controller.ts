import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import {
  RecordClassAttendanceDto,
  UpdateClassSessionDto,
} from "./business-classes.dto";
import { BusinessClassPortalService } from "./class-portal.service";
import { ClassCheckInDto, GenerateClassCheckInDto } from "./class-portal.dto";

@Controller("api/v1/discovery/business-classes")
export class PublicBusinessClassesController {
  constructor(private readonly service: BusinessClassPortalService) {}

  @Get()
  list(@Query() query: Record<string, string | undefined>) {
    return this.service.listPublic(query);
  }

  @Get(":classId")
  get(@Param("classId") classId: string) {
    return this.service.getPublic(classId);
  }
}

@Controller("api/v1/calendar/feeds")
export class PublicBusinessCalendarController {
  constructor(private readonly service: BusinessClassPortalService) {}

  @Get(":token")
  async feed(@Param("token") token: string, @Res() response: Response) {
    const calendar = await this.service.renderCalendarFeed(token);
    response.setHeader("Content-Type", "text/calendar; charset=utf-8");
    response.setHeader(
      "Content-Disposition",
      'inline; filename="club4me-calendar.ics"',
    );
    response.send(calendar);
  }
}

@Controller("api/v1/athlete/club-classes")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("athlete")
export class AthleteBusinessClassesController {
  constructor(private readonly service: BusinessClassPortalService) {}

  @Get()
  list(@CurrentUser() user: AuthTokenPayload) {
    return this.service.listForAthlete(user.sub);
  }

  @Get("recommendations")
  recommendations(@CurrentUser() user: AuthTokenPayload) {
    return this.service.recommendationsForAthlete(user.sub);
  }

  @Post(":classId/enroll")
  enroll(
    @CurrentUser() user: AuthTokenPayload,
    @Param("classId") classId: string,
  ) {
    return this.service.enrollAthlete(user.sub, classId);
  }

  @Post("check-in")
  checkIn(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: ClassCheckInDto,
  ) {
    return this.service.checkInAthlete(
      user.sub,
      body.classId,
      body.sessionId,
      body.credential,
    );
  }

  @Post("enrollments/:enrollmentId/cancel")
  cancel(
    @CurrentUser() user: AuthTokenPayload,
    @Param("enrollmentId") enrollmentId: string,
  ) {
    return this.service.cancelEnrollment(user.sub, enrollmentId);
  }

  @Post("enrollments/:enrollmentId/waitlist/claim")
  claimWaitlist(
    @CurrentUser() user: AuthTokenPayload,
    @Param("enrollmentId") enrollmentId: string,
  ) {
    return this.service.claimWaitlist(user.sub, enrollmentId);
  }
}

@Controller("api/v1/coach/club-classes")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("coach")
export class CoachBusinessClassesController {
  constructor(private readonly service: BusinessClassPortalService) {}

  @Get()
  list(@CurrentUser() user: AuthTokenPayload) {
    return this.service.listForCoach(user.sub);
  }

  @Post("calendar-feed")
  calendarFeed(@CurrentUser() user: AuthTokenPayload) {
    return this.service.createCoachCalendarFeed(user.sub);
  }

  @Delete("calendar-feed")
  revokeCalendarFeed(@CurrentUser() user: AuthTokenPayload) {
    return this.service.revokeCoachCalendarFeed(user.sub);
  }

  @Get(":classId")
  get(
    @CurrentUser() user: AuthTokenPayload,
    @Param("classId") classId: string,
  ) {
    return this.service.getForCoach(user.sub, classId);
  }

  @Get(":classId/enrollments")
  enrollments(
    @CurrentUser() user: AuthTokenPayload,
    @Param("classId") classId: string,
  ) {
    return this.service.listCoachEnrollments(user.sub, classId);
  }

  @Get(":classId/sessions/:sessionId/attendance")
  attendance(
    @CurrentUser() user: AuthTokenPayload,
    @Param("classId") classId: string,
    @Param("sessionId") sessionId: string,
  ) {
    return this.service.listCoachAttendance(user.sub, classId, sessionId);
  }

  @Post(":classId/sessions/:sessionId/check-in-credential")
  generateCheckIn(
    @CurrentUser() user: AuthTokenPayload,
    @Param("classId") classId: string,
    @Param("sessionId") sessionId: string,
    @Body() body: GenerateClassCheckInDto,
  ) {
    return this.service.generateCoachCheckInCredential(
      user.sub,
      classId,
      sessionId,
      body.expiresInMinutes,
    );
  }

  @Put(":classId/sessions/:sessionId/attendance")
  recordAttendance(
    @CurrentUser() user: AuthTokenPayload,
    @Param("classId") classId: string,
    @Param("sessionId") sessionId: string,
    @Body() body: RecordClassAttendanceDto,
  ) {
    return this.service.recordCoachAttendance(
      user.sub,
      classId,
      sessionId,
      body,
    );
  }

  @Patch(":classId/sessions/:sessionId")
  updateSession(
    @CurrentUser() user: AuthTokenPayload,
    @Param("classId") classId: string,
    @Param("sessionId") sessionId: string,
    @Body() body: UpdateClassSessionDto,
  ) {
    return this.service.updateCoachSession(user.sub, classId, sessionId, body);
  }
}
