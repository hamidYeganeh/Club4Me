import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { AppReleasesService } from "./app-releases.service";
import { SaveAppReleaseDto } from "./dto/save-app-release.dto";

@Controller("api/v1/app-releases")
export class AppReleasesController {
  constructor(private readonly releases: AppReleasesService) {}

  @Get("current")
  current(
    @Query("platform") platform: string,
    @Query("version") version: string,
  ) {
    return this.releases.getCurrent(platform, version);
  }
}

@Controller("api/v1/admin/app-releases")
@UseGuards(JwtAuthGuard)
export class AdminAppReleasesController {
  constructor(private readonly releases: AppReleasesService) {}

  @Get()
  list(@CurrentUser() user: AuthTokenPayload) {
    return this.releases.list(user.roles);
  }

  @Put(":platform")
  save(
    @CurrentUser() user: AuthTokenPayload,
    @Param("platform") platform: string,
    @Body() body: SaveAppReleaseDto,
  ) {
    return this.releases.save(user.roles, user.sub, platform, body);
  }
}
