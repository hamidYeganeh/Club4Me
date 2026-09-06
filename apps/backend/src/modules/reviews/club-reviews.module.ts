import { Module } from "@nestjs/common";
import { ResourcesModule } from "../resources/resources.module";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module";
import { ClubsModule } from "../clubs/clubs.module";
import {
  BusinessClubReviewsController,
  ClubReviewsController,
  PublicClubReviewsController,
} from "./club-reviews.controller";
import { ClubReviewsService } from "./club-reviews.service";
import { ClubReview, ClubReviewSchema } from "./schemas/club-review.schema";
import {
  Reservation,
  ReservationSchema,
} from "../reservations/schemas/reservation.schema";
import { MediaModule } from "../media/media.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClubReview.name, schema: ClubReviewSchema },
      { name: Reservation.name, schema: ReservationSchema },
    ]),
    AuthModule,
    ResourcesModule,
    ClubsModule,
    MediaModule,
  ],
  controllers: [
    PublicClubReviewsController,
    ClubReviewsController,
    BusinessClubReviewsController,
  ],
  providers: [ClubReviewsService],
})
export class ClubReviewsModule {}
