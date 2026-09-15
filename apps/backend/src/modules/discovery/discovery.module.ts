import {
  BusinessTrainingClass,
  BusinessTrainingClassSchema,
} from "../business-operations/schemas/training-class.schema";
import { Module } from "@nestjs/common";
import { AppConfigModule } from "../../config/app-config.module";
import {
  SavedSearchesController,
  SavedSearchesService,
} from "./saved-searches";
import { NotificationsModule } from "../notifications/notifications.module";
import { MongooseModule } from "@nestjs/mongoose";

import { Article, ArticleSchema } from "../articles/schemas/article.schema";
import { AuthModule } from "../auth/auth.module";
import { Club, ClubSchema } from "../clubs/schemas/club.schema";
import {
  Coach,
  CoachSchema,
  CoachSport,
  CoachSportSchema,
  TrainingClass,
  TrainingClassSchema,
} from "../coaching/schemas/coaching.schemas";
import { MediaModule } from "../media/media.module";
import { ResourcesModule } from "../resources/resources.module";
import {
  AdminDiscoveryController,
  DiscoveryFeedController,
} from "./discovery.controller";
import { DiscoveryFeedService } from "./discovery.service";
import {
  DiscoverySection,
  DiscoverySectionSchema,
} from "./schemas/discovery-section.schema";

@Module({
  imports: [
    AppConfigModule,
    NotificationsModule,
    AuthModule,
    MediaModule,
    ResourcesModule,
    MongooseModule.forFeature([
      { name: DiscoverySection.name, schema: DiscoverySectionSchema },
      { name: Club.name, schema: ClubSchema },
      { name: Coach.name, schema: CoachSchema },
      { name: CoachSport.name, schema: CoachSportSchema },
      { name: TrainingClass.name, schema: TrainingClassSchema },
      { name: Article.name, schema: ArticleSchema },
      { name: BusinessTrainingClass.name, schema: BusinessTrainingClassSchema },
    ]),
  ],
  controllers: [
    DiscoveryFeedController,
    AdminDiscoveryController,
    SavedSearchesController,
  ],
  providers: [DiscoveryFeedService, SavedSearchesService],
})
export class DiscoveryFeedModule {}
