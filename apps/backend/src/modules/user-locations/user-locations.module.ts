import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module";
import {
  UserLocation,
  UserLocationSchema,
} from "./schemas/user-location.schema";
import { UserLocationsController } from "./user-locations.controller";
import { UserLocationsRepository } from "./user-locations.repository";
import { UserLocationsService } from "./user-locations.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserLocation.name, schema: UserLocationSchema },
    ]),
    AuthModule,
  ],
  controllers: [UserLocationsController],
  providers: [UserLocationsRepository, UserLocationsService],
})
export class UserLocationsModule {}
