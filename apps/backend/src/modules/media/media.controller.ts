import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";
import { MAX_MEDIA_BYTES } from "./media.constants";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { CreateMediaDto } from "./dto/create-media.dto";
import { MediaService } from "./media.service";

@Controller(["api/v1/media", "api/v1/business/media"])
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @Get()
  list(@CurrentUser() user: AuthTokenPayload, @Query("ids") ids?: string) {
    return this.service.list(user.sub, ids);
  }

  @Post("upload")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_MEDIA_BYTES, files: 1, fields: 0 },
    }),
  )
  upload(
    @CurrentUser() user: AuthTokenPayload,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string },
  ) {
    return this.service.upload(user.sub, file);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthTokenPayload, @Body() body: CreateMediaDto) {
    return this.service.create(user.sub, body);
  }

  @Post("private/upload")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_MEDIA_BYTES, files: 1, fields: 0 },
    }),
  )
  uploadPrivate(
    @CurrentUser() user: AuthTokenPayload,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string },
  ) {
    return this.service.upload(user.sub, file, true);
  }
}
