import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthTokenPayload } from "../auth/services/token.service";
import { DiscoveryFeedService } from "./discovery.service";
import {
  CreateDiscoverySectionDto,
  ReorderDiscoverySectionsDto,
  UpdateDiscoverySectionDto,
} from "./dto/discovery-section.dto";

@Controller("api/v1/discovery")
export class DiscoveryFeedController {
  constructor(private readonly service: DiscoveryFeedService) {}
  @Get() getFeed() {
    return this.service.getFeed();
  }

  @Get("catalog/clubs")
  listClubs(@Query() query: Record<string, string | undefined>) {
    return this.service.listPublicClubs(query);
  }

  @Get("catalog/clubs/:identifier")
  getClub(@Param("identifier") identifier: string) {
    return this.service.getPublicClub(identifier);
  }

  @Get("catalog/coaches")
  listCoaches(@Query() query: Record<string, string | undefined>) {
    return this.service.listPublicCoaches(query);
  }

  @Get("catalog/coaches/:identifier")
  getCoach(@Param("identifier") identifier: string) {
    return this.service.getPublicCoach(identifier);
  }

  @Get("catalog/classes")
  listClasses(@Query() query: Record<string, string | undefined>) {
    return this.service.listPublicClasses(query);
  }

  @Get("catalog/classes/:identifier")
  getClass(@Param("identifier") identifier: string) {
    return this.service.getPublicClass(identifier);
  }

  @Get("catalog/search")
  search(@Query() query: Record<string, string | undefined>) {
    return this.service.searchPublicCatalog(query);
  }
}

@Controller("api/v1/admin/discovery/sections")
@UseGuards(JwtAuthGuard)
export class AdminDiscoveryController {
  constructor(private readonly service: DiscoveryFeedService) {}
  @Get() list(@CurrentUser() user: AuthTokenPayload) {
    return this.service.listAdmin(user.roles);
  }
  @Get("options/:type") options(
    @CurrentUser() user: AuthTokenPayload,
    @Param("type") type: string,
  ) {
    return this.service.listOptions(user.roles, type);
  }
  @Post() create(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreateDiscoverySectionDto,
  ) {
    return this.service.create(user.roles, body);
  }
  @Patch("reorder") reorder(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: ReorderDiscoverySectionsDto,
  ) {
    return this.service.reorder(user.roles, body);
  }
  @Patch(":id") update(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
    @Body() body: UpdateDiscoverySectionDto,
  ) {
    return this.service.update(user.roles, id, body);
  }
  @Delete(":id") remove(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
  ) {
    return this.service.remove(user.roles, id);
  }
}
