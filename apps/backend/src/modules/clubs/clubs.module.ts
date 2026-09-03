import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module";
import { ResourcesModule } from "../resources/resources.module";
import { MediaModule } from "../media/media.module";
import { BusinessCatalogController } from "./business-catalog.controller";
import {
  AdminClubsController,
  ClubsController,
  PublicClubsController,
} from "./clubs.controller";
import { ClubsRepository } from "./clubs.repository";
import { ClubsService } from "./clubs.service";
import { Club, ClubSchema } from "./schemas/club.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Club.name, schema: ClubSchema }]),
    AuthModule,
    ResourcesModule,
    MediaModule,
  ],
  controllers: [
    ClubsController,
    AdminClubsController,
    BusinessCatalogController,
    PublicClubsController,
  ],
  providers: [ClubsRepository, ClubsService],
  exports: [ClubsService],
})
export class ClubsModule {}
