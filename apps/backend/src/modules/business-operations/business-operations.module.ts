import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { ClubsModule } from "../clubs/clubs.module";
import { UsersModule } from "../users/users.module";
import { AppConfigModule } from "../../config/app-config.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { UserLocationsModule } from "../user-locations/user-locations.module";
import { BusinessOperationsController } from "./business-operations.controller";
import { BusinessOperationsService } from "./business-operations.service";
import { BusinessClassesController } from "./business-classes.controller";
import { BusinessClassesService } from "./business-classes.service";
import {
  AthleteBusinessClassesController,
  CoachBusinessClassesController,
  PublicBusinessClassesController,
  PublicBusinessCalendarController,
} from "./class-portal.controller";
import { BusinessClassPortalService } from "./class-portal.service";
import { ClassRemindersService } from "./class-reminders.service";
import {
  ClubAttendance,
  ClubAttendanceSchema,
} from "./schemas/attendance.schema";
import { ClubBranch, ClubBranchSchema } from "./schemas/branch.schema";
import {
  ClubCoachProfile,
  ClubCoachProfileSchema,
} from "./schemas/coach.schema";
import {
  ClubManualPayment,
  ClubManualPaymentSchema,
} from "./schemas/payment.schema";
import { ClubStudent, ClubStudentSchema } from "./schemas/student.schema";
import {
  BusinessClassAttendance,
  BusinessClassAttendanceSchema,
  BusinessClassEnrollment,
  BusinessClassEnrollmentSchema,
  BusinessClassSession,
  BusinessClassSessionSchema,
  BusinessTrainingClass,
  BusinessTrainingClassSchema,
  BusinessClassCheckInCredential,
  BusinessClassCheckInCredentialSchema,
  BusinessCalendarFeed,
  BusinessCalendarFeedSchema,
} from "./schemas/training-class.schema";

@Module({
  imports: [
    AuthModule,
    ClubsModule,
    UsersModule,
    AppConfigModule,
    NotificationsModule,
    UserLocationsModule,
    MongooseModule.forFeature([
      { name: ClubStudent.name, schema: ClubStudentSchema },
      { name: ClubCoachProfile.name, schema: ClubCoachProfileSchema },
      { name: ClubManualPayment.name, schema: ClubManualPaymentSchema },
      { name: ClubAttendance.name, schema: ClubAttendanceSchema },
      { name: ClubBranch.name, schema: ClubBranchSchema },
      { name: BusinessTrainingClass.name, schema: BusinessTrainingClassSchema },
      { name: BusinessClassSession.name, schema: BusinessClassSessionSchema },
      {
        name: BusinessClassEnrollment.name,
        schema: BusinessClassEnrollmentSchema,
      },
      {
        name: BusinessClassAttendance.name,
        schema: BusinessClassAttendanceSchema,
      },
      {
        name: BusinessClassCheckInCredential.name,
        schema: BusinessClassCheckInCredentialSchema,
      },
      { name: BusinessCalendarFeed.name, schema: BusinessCalendarFeedSchema },
    ]),
  ],
  controllers: [
    BusinessOperationsController,
    BusinessClassesController,
    PublicBusinessClassesController,
    PublicBusinessCalendarController,
    AthleteBusinessClassesController,
    CoachBusinessClassesController,
  ],
  providers: [
    BusinessOperationsService,
    BusinessClassesService,
    BusinessClassPortalService,
    ClassRemindersService,
  ],
  exports: [BusinessOperationsService, BusinessClassPortalService],
})
export class BusinessOperationsModule {}
