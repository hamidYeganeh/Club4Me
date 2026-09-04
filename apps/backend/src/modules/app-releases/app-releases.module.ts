import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module";
import {
  AdminAppReleasesController,
  AppReleasesController,
} from "./app-releases.controller";
import { AppReleasesService } from "./app-releases.service";
import { AppRelease, AppReleaseSchema } from "./schemas/app-release.schema";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: AppRelease.name, schema: AppReleaseSchema },
    ]),
  ],
  controllers: [AppReleasesController, AdminAppReleasesController],
  providers: [AppReleasesService],
})
export class AppReleasesModule {}
