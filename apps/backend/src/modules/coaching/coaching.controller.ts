import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
  BulkAttendanceDto,
  CancelSessionDto,
  CreateAvailabilityExceptionDto,
  CreateClassDto,
  CreateEnrollmentDto,
  CreateOfferingDto,
  CreateSessionDto,
  GenerateScheduleDto,
  ReplaceAvailabilityDto,
  ReplaceCoachSportsDto,
  RescheduleSessionDto,
  ReviewCoachDto,
  UpdateBookingStatusDto,
  UpdateClassDto,
  UpdateClassStatusDto,
  UpdateCoachProfileDto,
  UpdateEnrollmentStatusDto,
  UpdateOfferingDto,
  UpdateOfferingStatusDto,
} from "./dto/coaching.dto";
import { AttendanceService } from "./services/attendance.service";
import { AvailabilityService } from "./services/availability.service";
import { BookingsService } from "./services/bookings.service";
import { TrainingClassesService } from "./services/classes.service";
import { CoachesService } from "./services/coaches.service";
import { EnrollmentsService } from "./services/enrollments.service";
import { OfferingsService } from "./services/offerings.service";
import { SchedulingService } from "./services/scheduling.service";
import { SessionsService } from "./services/sessions.service";

@Controller("api/v1/coach")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("coach")
export class CoachPortalController {
  constructor(
    private readonly coaches: CoachesService,
    private readonly offerings: OfferingsService,
    private readonly classes: TrainingClassesService,
    private readonly scheduling: SchedulingService,
    private readonly sessions: SessionsService,
    private readonly enrollments: EnrollmentsService,
    private readonly bookings: BookingsService,
    private readonly attendance: AttendanceService,
    private readonly availability: AvailabilityService,
  ) {}

  @Get("profile")
  getProfile(@CurrentUser() user: AuthTokenPayload) {
    return this.coaches.getProfile(user.sub);
  }

  @Patch("profile")
  updateProfile(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: UpdateCoachProfileDto,
  ) {
    return this.coaches.updateProfile(user.sub, body);
  }

  @Post("profile/submit")
  submitProfile(@CurrentUser() user: AuthTokenPayload) {
    return this.coaches.submit(user.sub);
  }

  @Get("sports")
  listSports(@CurrentUser() user: AuthTokenPayload) {
    return this.coaches.listSports(user.sub);
  }

  @Put("sports")
  replaceSports(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: ReplaceCoachSportsDto,
  ) {
    return this.coaches.replaceSports(user.sub, body.items);
  }

  @Get("services")
  listServices(@CurrentUser() user: AuthTokenPayload) {
    return this.offerings.list(user.sub);
  }

  @Post("services")
  @HttpCode(HttpStatus.CREATED)
  createService(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreateOfferingDto,
  ) {
    return this.offerings.create(user.sub, body);
  }

  @Get("services/:serviceId")
  getService(
    @CurrentUser() user: AuthTokenPayload,
    @Param("serviceId") serviceId: string,
  ) {
    return this.offerings.get(user.sub, serviceId);
  }

  @Patch("services/:serviceId")
  updateService(
    @CurrentUser() user: AuthTokenPayload,
    @Param("serviceId") serviceId: string,
    @Body() body: UpdateOfferingDto,
  ) {
    return this.offerings.update(user.sub, serviceId, body);
  }

  @Patch("services/:serviceId/status")
  updateServiceStatus(
    @CurrentUser() user: AuthTokenPayload,
    @Param("serviceId") serviceId: string,
    @Body() body: UpdateOfferingStatusDto,
  ) {
    return this.offerings.updateStatus(user.sub, serviceId, body.status);
  }

  @Get("classes")
  listClasses(@CurrentUser() user: AuthTokenPayload) {
    return this.classes.list(user.sub);
  }

  @Post("classes")
  @HttpCode(HttpStatus.CREATED)
  createClass(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreateClassDto,
  ) {
    return this.classes.create(user.sub, body);
  }

  @Get("classes/:classId")
  getClass(
    @CurrentUser() user: AuthTokenPayload,
    @Param("classId") classId: string,
  ) {
    return this.classes.get(user.sub, classId);
  }

  @Patch("classes/:classId")
  updateClass(
    @CurrentUser() user: AuthTokenPayload,
    @Param("classId") classId: string,
    @Body() body: UpdateClassDto,
  ) {
    return this.classes.update(user.sub, classId, body);
  }

  @Patch("classes/:classId/status")
  updateClassStatus(
    @CurrentUser() user: AuthTokenPayload,
    @Param("classId") classId: string,
    @Body() body: UpdateClassStatusDto,
  ) {
    return this.classes.updateStatus(user.sub, classId, body.status);
  }

  @Post("classes/:classId/schedule")
  @HttpCode(HttpStatus.CREATED)
  generateSchedule(
    @CurrentUser() user: AuthTokenPayload,
    @Param("classId") classId: string,
    @Body() body: GenerateScheduleDto,
  ) {
    return this.scheduling.generate(user.sub, classId, body);
  }

  @Get("classes/:classId/sessions")
  listClassSessions(
    @CurrentUser() user: AuthTokenPayload,
    @Param("classId") classId: string,
  ) {
    return this.sessions.listForClass(user.sub, classId);
  }

  @Get("classes/:classId/enrollments")
  listEnrollments(
    @CurrentUser() user: AuthTokenPayload,
    @Param("classId") classId: string,
  ) {
    return this.enrollments.list(user.sub, classId);
  }

  @Post("classes/:classId/enrollments")
  @HttpCode(HttpStatus.CREATED)
  addEnrollment(
    @CurrentUser() user: AuthTokenPayload,
    @Param("classId") classId: string,
    @Body() body: CreateEnrollmentDto,
  ) {
    return this.enrollments.addByCoach(user.sub, classId, body.athleteId);
  }

  @Patch("enrollments/:enrollmentId/status")
  updateEnrollment(
    @CurrentUser() user: AuthTokenPayload,
    @Param("enrollmentId") enrollmentId: string,
    @Body() body: UpdateEnrollmentStatusDto,
  ) {
    return this.enrollments.updateStatus(
      user.sub,
      enrollmentId,
      body.status,
      body.paymentStatus,
    );
  }

  @Get("calendar")
  calendar(
    @CurrentUser() user: AuthTokenPayload,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.sessions.calendar(user.sub, from, to);
  }

  @Post("sessions")
  @HttpCode(HttpStatus.CREATED)
  createSession(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreateSessionDto,
  ) {
    return this.sessions.createStandalone(user.sub, body);
  }

  @Post("sessions/:sessionId/reschedule")
  rescheduleSession(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sessionId") sessionId: string,
    @Body() body: RescheduleSessionDto,
  ) {
    return this.sessions.reschedule(
      user.sub,
      sessionId,
      body.startAt,
      body.endAt,
    );
  }

  @Post("sessions/:sessionId/cancel")
  cancelSession(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sessionId") sessionId: string,
    @Body() body: CancelSessionDto,
  ) {
    return this.sessions.cancel(user.sub, sessionId, body.reason);
  }

  @Get("sessions/:sessionId/attendance")
  getAttendance(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sessionId") sessionId: string,
  ) {
    return this.attendance.list(user.sub, sessionId);
  }

  @Put("sessions/:sessionId/attendance")
  recordAttendance(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sessionId") sessionId: string,
    @Body() body: BulkAttendanceDto,
  ) {
    return this.attendance.record(user.sub, sessionId, body.items);
  }

  @Get("bookings")
  listBookings(@CurrentUser() user: AuthTokenPayload) {
    return this.bookings.listForCoach(user.sub);
  }

  @Patch("bookings/:bookingId/status")
  updateBooking(
    @CurrentUser() user: AuthTokenPayload,
    @Param("bookingId") bookingId: string,
    @Body() body: UpdateBookingStatusDto,
  ) {
    return this.bookings.updateByCoach(
      user.sub,
      bookingId,
      body.status,
      body.reason,
    );
  }

  @Get("availability")
  getAvailability(@CurrentUser() user: AuthTokenPayload) {
    return this.availability.get(user.sub);
  }

  @Put("availability")
  replaceAvailability(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: ReplaceAvailabilityDto,
  ) {
    return this.availability.replace(user.sub, body.rules);
  }

  @Post("availability/exceptions")
  @HttpCode(HttpStatus.CREATED)
  addAvailabilityException(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreateAvailabilityExceptionDto,
  ) {
    return this.availability.addException(user.sub, body);
  }
}

@Controller("api/v1/athlete")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("athlete")
export class AthleteCoachingController {
  constructor(
    private readonly enrollments: EnrollmentsService,
    private readonly bookings: BookingsService,
  ) {}

  @Post("classes/:classId/enrollments")
  @HttpCode(HttpStatus.CREATED)
  enroll(
    @CurrentUser() user: AuthTokenPayload,
    @Param("classId") classId: string,
  ) {
    return this.enrollments.enrollSelf(user.sub, classId);
  }

  @Post("sessions/:sessionId/bookings")
  @HttpCode(HttpStatus.CREATED)
  book(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sessionId") sessionId: string,
  ) {
    return this.bookings.book(user.sub, sessionId);
  }

  @Post("bookings/:bookingId/cancel")
  cancelBooking(
    @CurrentUser() user: AuthTokenPayload,
    @Param("bookingId") bookingId: string,
    @Body() body: CancelSessionDto,
  ) {
    return this.bookings.cancelByAthlete(user.sub, bookingId, body.reason);
  }
}

@Controller("api/v1/public")
export class PublicCoachingController {
  constructor(
    private readonly coaches: CoachesService,
    private readonly offerings: OfferingsService,
    private readonly classes: TrainingClassesService,
  ) {}

  @Get("coaches/:slug")
  getCoach(@Param("slug") slug: string) {
    return this.coaches.getPublicBySlug(slug);
  }

  @Get("coaches/:slug/services")
  getCoachServices(@Param("slug") slug: string) {
    return this.offerings.listPublicByCoachSlug(slug);
  }

  @Get("classes")
  listClasses(
    @Query("sportId") sportId?: string,
    @Query("coachId") coachId?: string,
  ) {
    return this.classes.listPublic({ sportId, coachId });
  }

  @Get("classes/:slug")
  getClass(@Param("slug") slug: string) {
    return this.classes.getPublicBySlug(slug);
  }

  @Get("clubs/:clubId/classes")
  listClubClasses(@Param("clubId") clubId: string) {
    return this.classes.listPublic({ clubId });
  }

  @Get("clubs/:clubId/coaches")
  async listClubCoaches(@Param("clubId") clubId: string) {
    const ids = await this.classes.listPublicCoachIdsByClub(clubId);
    return this.coaches.listPublicByIds(ids);
  }
}

@Controller("api/v1/admin/coaches")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminCoachesController {
  constructor(private readonly coaches: CoachesService) {}

  @Get()
  list() {
    return this.coaches.listForAdmin();
  }

  @Patch(":coachId/review")
  review(@Param("coachId") coachId: string, @Body() body: ReviewCoachDto) {
    return this.coaches.review(coachId, body.status, body.reason);
  }
}
