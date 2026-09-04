import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module";
import { MediaModule } from "../media/media.module";
import { ClubsModule } from "../clubs/clubs.module";
import { ResourcesModule } from "../resources/resources.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { UsersModule } from "../users/users.module";
import {
  AdminCoachesController,
  AdminClassesController,
  AthleteCoachingController,
  CoachPortalController,
  PublicCoachingController,
  ClubClassesController,
} from "./coaching.controller";
import {
  ClassEnrollment,
  ClassEnrollmentSchema,
  Coach,
  CoachAvailabilityException,
  CoachAvailabilityExceptionSchema,
  CoachAvailabilityRule,
  CoachAvailabilityRuleSchema,
  CoachOffering,
  CoachOfferingSchema,
  CoachSchema,
  CoachSport,
  CoachSportSchema,
  ScheduleRule,
  ScheduleRuleSchema,
  SessionAttendance,
  SessionAttendanceSchema,
  SessionBooking,
  SessionBookingSchema,
  TrainingClass,
  TrainingClassSchema,
  TrainingSession,
  TrainingSessionSchema,
} from "./schemas/coaching.schemas";
import { AttendanceService } from "./services/attendance.service";
import { AvailabilityService } from "./services/availability.service";
import { BookingsService } from "./services/bookings.service";
import { TrainingClassesService } from "./services/classes.service";
import { CoachesService } from "./services/coaches.service";
import { EnrollmentsService } from "./services/enrollments.service";
import { OfferingsService } from "./services/offerings.service";
import { SchedulingService } from "./services/scheduling.service";
import { SessionsService } from "./services/sessions.service";
import {
  ReservableSession,
  ReservableSessionSchema,
} from "../reservations/schemas/reservable-session.schema";
import { Court, CourtSchema } from "../reservations/schemas/court.schema";

const schemas = [
  { name: Coach.name, schema: CoachSchema },
  { name: CoachSport.name, schema: CoachSportSchema },
  { name: CoachOffering.name, schema: CoachOfferingSchema },
  { name: TrainingClass.name, schema: TrainingClassSchema },
  { name: TrainingSession.name, schema: TrainingSessionSchema },
  { name: ScheduleRule.name, schema: ScheduleRuleSchema },
  { name: ClassEnrollment.name, schema: ClassEnrollmentSchema },
  { name: SessionBooking.name, schema: SessionBookingSchema },
  { name: SessionAttendance.name, schema: SessionAttendanceSchema },
  { name: CoachAvailabilityRule.name, schema: CoachAvailabilityRuleSchema },
  {
    name: CoachAvailabilityException.name,
    schema: CoachAvailabilityExceptionSchema,
  },
  { name: ReservableSession.name, schema: ReservableSessionSchema },
  { name: Court.name, schema: CourtSchema },
];

@Module({
  imports: [
    MongooseModule.forFeature(schemas),
    AuthModule,
    ResourcesModule,
    MediaModule,
    ClubsModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [
    CoachPortalController,
    AthleteCoachingController,
    PublicCoachingController,
    AdminCoachesController,
    AdminClassesController,
    ClubClassesController,
  ],
  providers: [
    CoachesService,
    OfferingsService,
    TrainingClassesService,
    SessionsService,
    SchedulingService,
    EnrollmentsService,
    BookingsService,
    AttendanceService,
    AvailabilityService,
  ],
  exports: [
    CoachesService,
    OfferingsService,
    TrainingClassesService,
    SessionsService,
  ],
})
export class CoachingModule {}
