import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module";
import { ResourcesModule } from "../resources/resources.module";
import { MediaModule } from "../media/media.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { BusinessCatalogController } from "./business-catalog.controller";
import { BusinessTagsController } from "./business-tags.controller";
import {
  AdminClubsController,
  ClubsController,
  PublicClubsController,
} from "./clubs.controller";
import { ClubsRepository } from "./clubs.repository";
import { ClubsService } from "./clubs.service";
import { Club, ClubSchema } from "./schemas/club.schema";
import {
  ClubMembership,
  ClubMembershipSchema,
} from "./schemas/club-membership.schema";
import { ClubMembershipsService } from "./club-memberships.service";
import {
  BusinessClubMembershipsController,
  ClubMembershipInvitationsController,
} from "./club-memberships.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Club.name, schema: ClubSchema },
      { name: ClubMembership.name, schema: ClubMembershipSchema },
    ]),
    AuthModule,
    ResourcesModule,
    MediaModule,
    NotificationsModule,
  ],
  controllers: [
    ClubsController,
    AdminClubsController,
    BusinessCatalogController,
    BusinessTagsController,
    PublicClubsController,
    BusinessClubMembershipsController,
    ClubMembershipInvitationsController,
  ],
  providers: [ClubsRepository, ClubsService, ClubMembershipsService],
  exports: [ClubsService, ClubsRepository, ClubMembershipsService],
})
export class ClubsModule {}
