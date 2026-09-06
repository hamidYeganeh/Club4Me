import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";

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
  list(@CurrentUser() user: AuthTokenPayload) {
    return this.service.list(user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthTokenPayload, @Body() body: CreateMediaDto) {
    return this.service.create(user.sub, body);
  }
}
