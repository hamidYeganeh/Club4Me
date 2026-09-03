import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module";
import { ClubsModule } from "../clubs/clubs.module";
import {
  ClubReviewsController,
  PublicClubReviewsController,
} from "./club-reviews.controller";
import { ClubReviewsService } from "./club-reviews.service";
import { ClubReview, ClubReviewSchema } from "./schemas/club-review.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClubReview.name, schema: ClubReviewSchema },
    ]),
    AuthModule,
    ClubsModule,
  ],
  controllers: [PublicClubReviewsController, ClubReviewsController],
  providers: [ClubReviewsService],
})
export class ClubReviewsModule {}
