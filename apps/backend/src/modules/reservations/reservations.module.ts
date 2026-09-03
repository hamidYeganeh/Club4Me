import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module";
import { ClubsModule } from "../clubs/clubs.module";
import { ResourcesModule } from "../resources/resources.module";
import { CoachingModule } from "../coaching/coaching.module";
import {
  BusinessReservationsController,
  PublicSessionsController,
  ReservationsController,
} from "./reservations.controller";
import { ReservationsService } from "./reservations.service";
import { Court, CourtSchema } from "./schemas/court.schema";
import { Reservation, ReservationSchema } from "./schemas/reservation.schema";
import {
  ReservableSession,
  ReservableSessionSchema,
} from "./schemas/reservable-session.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Court.name, schema: CourtSchema },
      { name: ReservableSession.name, schema: ReservableSessionSchema },
      { name: Reservation.name, schema: ReservationSchema },
    ]),
    AuthModule,
    ClubsModule,
    ResourcesModule,
    CoachingModule,
  ],
  controllers: [
    BusinessReservationsController,
    PublicSessionsController,
    ReservationsController,
  ],
  providers: [ReservationsService],
})
export class ReservationsModule {}
