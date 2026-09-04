import { Controller, Delete, Get, Param, Put, UseGuards } from "@nestjs/common";

import { AppError } from "../../common/errors/app.exception";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { FavoritesService } from "./favorites.service";
import {
  FAVORITE_ENTITY_TYPES,
  type FavoriteEntityType,
} from "./schemas/favorite.schema";

@Controller("api/v1/favorites")
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: AuthTokenPayload) {
    return this.favorites.list(user.sub);
  }

  @Put(":entityType/:entityId")
  add(
    @CurrentUser() user: AuthTokenPayload,
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string,
  ) {
    return this.favorites.add(user.sub, parseType(entityType), entityId);
  }

  @Delete(":entityType/:entityId")
  remove(
    @CurrentUser() user: AuthTokenPayload,
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string,
  ) {
    return this.favorites.remove(user.sub, parseType(entityType), entityId);
  }
}

function parseType(value: string): FavoriteEntityType {
  if (!FAVORITE_ENTITY_TYPES.includes(value as FavoriteEntityType)) {
    throw new AppError(400, "INVALID_FAVORITE_TYPE", "Invalid favorite type");
  }
  return value as FavoriteEntityType;
}
