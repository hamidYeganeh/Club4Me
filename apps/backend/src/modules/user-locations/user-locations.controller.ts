import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { CreateUserLocationDto } from "./dto/create-user-location.dto";
import { UpdateUserLocationDto } from "./dto/update-user-location.dto";
import { UserLocationsService } from "./user-locations.service";

@Controller("api/v1/me/locations")
@UseGuards(JwtAuthGuard)
export class UserLocationsController {
  constructor(private readonly service: UserLocationsService) {}

  @Get()
  list(@CurrentUser() user: AuthTokenPayload) {
    return this.service.list(user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreateUserLocationDto,
  ) {
    return this.service.create(user.sub, body);
  }

  @Patch(":locationId")
  update(
    @CurrentUser() user: AuthTokenPayload,
    @Param("locationId") locationId: string,
    @Body() body: UpdateUserLocationDto,
  ) {
    return this.service.update(user.sub, locationId, body);
  }

  @Patch(":locationId/default")
  setDefault(
    @CurrentUser() user: AuthTokenPayload,
    @Param("locationId") locationId: string,
  ) {
    return this.service.setDefault(user.sub, locationId);
  }

  @Delete(":locationId")
  remove(
    @CurrentUser() user: AuthTokenPayload,
    @Param("locationId") locationId: string,
  ) {
    return this.service.remove(user.sub, locationId);
  }
}
