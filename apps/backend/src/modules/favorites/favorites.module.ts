import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { Article, ArticleSchema } from "../articles/schemas/article.schema";
import { AuthModule } from "../auth/auth.module";
import { Club, ClubSchema } from "../clubs/schemas/club.schema";
import {
  Coach,
  CoachSchema,
  TrainingClass,
  TrainingClassSchema,
} from "../coaching/schemas/coaching.schemas";
import { FavoritesController } from "./favorites.controller";
import { FavoritesService } from "./favorites.service";
import { Favorite, FavoriteSchema } from "./schemas/favorite.schema";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Article.name, schema: ArticleSchema },
      { name: Favorite.name, schema: FavoriteSchema },
      { name: Club.name, schema: ClubSchema },
      { name: Coach.name, schema: CoachSchema },
      { name: TrainingClass.name, schema: TrainingClassSchema },
    ]),
  ],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
