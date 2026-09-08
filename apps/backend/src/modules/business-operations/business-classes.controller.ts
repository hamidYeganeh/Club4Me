import { BusinessPortalGuard } from "../auth/guards/business-portal.guard";
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
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import {
  CreateBusinessClassDto,
  CreateClassEnrollmentDto,
  RecordClassAttendanceDto,
  TransferClassEnrollmentDto,
  UpdateBusinessClassDto,
  UpdateClassEnrollmentDto,
  UpdateClassSessionDto,
} from "./business-classes.dto";
import { BusinessClassesService } from "./business-classes.service";
import { BusinessClassPortalService } from "./class-portal.service";
import { GenerateClassCheckInDto } from "./class-portal.dto";

@Controller("api/v1/business/clubs/:clubId/operations/classes")
@UseGuards(JwtAuthGuard, BusinessPortalGuard)
export class BusinessClassesController {
  constructor(
    private readonly service: BusinessClassesService,
    private readonly portal: BusinessClassPortalService,
  ) {}

  @Get() list(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
  ) {
    return this.service.list(user.sub, clubId);
  }
  @Post() create(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Body() body: CreateBusinessClassDto,
  ) {
    return this.service.create(user.sub, clubId, body);
  }
  @Get("calendar-sessions") calendarSessions(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.service.listCalendarSessions(user.sub, clubId, from, to);
  }
  @Get(":classId") get(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("classId") classId: string,
  ) {
    return this.service.get(user.sub, clubId, classId);
  }
  @Patch(":classId") update(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("classId") classId: string,
    @Body() body: UpdateBusinessClassDto,
  ) {
    return this.service.update(user.sub, clubId, classId, body);
  }
  @Post(":classId/regenerate-sessions") regenerate(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("classId") classId: string,
  ) {
    return this.service.regenerate(user.sub, clubId, classId);
  }

  @Post("calendar-feed")
  calendarFeed(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
  ) {
    return this.portal.createClubCalendarFeed(user.sub, clubId);
  }

  @Delete("calendar-feed")
  revokeCalendarFeed(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
  ) {
    return this.portal.revokeClubCalendarFeed(user.sub, clubId);
  }

  @Get(":classId/sessions") sessions(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("classId") classId: string,
  ) {
    return this.service.listSessions(user.sub, clubId, classId);
  }
  @Patch(":classId/sessions/:sessionId") updateSession(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("classId") classId: string,
    @Param("sessionId") sessionId: string,
    @Body() body: UpdateClassSessionDto,
  ) {
    return this.service.updateSession(
      user.sub,
      clubId,
      classId,
      sessionId,
      body,
    );
  }

  @Post(":classId/sessions/:sessionId/change-preview") previewSessionChange(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("classId") classId: string,
    @Param("sessionId") sessionId: string,
    @Body() body: UpdateClassSessionDto,
  ) {
    return this.service.previewSessionChange(user.sub, clubId, classId, sessionId, body);
  }

  @Get(":classId/enrollments") enrollments(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("classId") classId: string,
  ) {
    return this.service.listEnrollments(user.sub, clubId, classId);
  }
  @Post(":classId/enrollments") enroll(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("classId") classId: string,
    @Body() body: CreateClassEnrollmentDto,
  ) {
    return this.service.enroll(user.sub, clubId, classId, user.sub, body);
  }
  @Patch(":classId/enrollments/:enrollmentId") updateEnrollment(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("classId") classId: string,
    @Param("enrollmentId") enrollmentId: string,
    @Body() body: UpdateClassEnrollmentDto,
  ) {
    return this.service.updateEnrollment(
      user.sub,
      clubId,
      classId,
      enrollmentId,
      body,
    );
  }
  @Post(":classId/enrollments/:enrollmentId/transfer") transfer(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("classId") classId: string,
    @Param("enrollmentId") enrollmentId: string,
    @Body() body: TransferClassEnrollmentDto,
  ) {
    return this.service.transfer(
      user.sub,
      clubId,
      classId,
      enrollmentId,
      body.targetClassId,
      user.sub,
    );
  }

  @Get(":classId/sessions/:sessionId/attendance") attendance(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("classId") classId: string,
    @Param("sessionId") sessionId: string,
  ) {
    return this.service.listAttendance(user.sub, clubId, classId, sessionId);
  }
  @Post(":classId/sessions/:sessionId/check-in-credential")
  generateCheckIn(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("classId") classId: string,
    @Param("sessionId") sessionId: string,
    @Body() body: GenerateClassCheckInDto,
  ) {
    return this.portal.generateOwnerCheckInCredential(
      user.sub,
      clubId,
      classId,
      sessionId,
      body.expiresInMinutes,
    );
  }
  @Put(":classId/sessions/:sessionId/attendance") recordAttendance(
    @CurrentUser() user: AuthTokenPayload,
    @Param("clubId") clubId: string,
    @Param("classId") classId: string,
    @Param("sessionId") sessionId: string,
    @Body() body: RecordClassAttendanceDto,
  ) {
    return this.service.recordAttendance(
      user.sub,
      clubId,
      classId,
      sessionId,
      user.sub,
      body,
    );
  }
}
