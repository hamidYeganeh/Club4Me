import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AppConfigModule } from "../../config/app-config.module";
import { AuthModule } from "../auth/auth.module";
import { MediaController } from "./media.controller";
import { MediaStorageService } from "./media-storage.service";
import { MediaFileController } from "./media-file.controller";
import { MediaService } from "./media.service";
import { Media, MediaSchema } from "./schemas/media.schema";

@Module({
  imports: [
    AppConfigModule,
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
    AuthModule,
  ],
  controllers: [MediaController, MediaFileController],
  providers: [MediaService, MediaStorageService],
  exports: [MediaService],
})
export class MediaModule {}
