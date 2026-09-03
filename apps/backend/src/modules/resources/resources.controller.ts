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
  Query,
  UseGuards,
} from "@nestjs/common";

import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CreateResourceDto, UpdateResourceDto } from "./dto/resource.dto";
import { ResourcesService } from "./resources.service";

@Controller("api/v1/resources")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get(":category/:resource")
  list(
    @Param("category") category: string,
    @Param("resource") resource: string,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.resourcesService.list(category, resource, query);
  }

  @Get(":category/:resource/:id")
  get(
    @Param("category") category: string,
    @Param("resource") resource: string,
    @Param("id") id: string,
  ) {
    return this.resourcesService.get(category, resource, id);
  }

  @Post(":category/:resource")
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param("category") category: string,
    @Param("resource") resource: string,
    @Body() body: CreateResourceDto,
  ) {
    return this.resourcesService.create(category, resource, body);
  }

  @Post(":category/:resource/seed")
  seed(
    @Param("category") category: string,
    @Param("resource") resource: string,
  ) {
    return this.resourcesService.seed(category, resource);
  }

  @Patch(":category/:resource/:id")
  update(
    @Param("category") category: string,
    @Param("resource") resource: string,
    @Param("id") id: string,
    @Body() body: UpdateResourceDto,
  ) {
    return this.resourcesService.update(category, resource, id, body);
  }

  @Delete(":category/:resource/:id")
  delete(
    @Param("category") category: string,
    @Param("resource") resource: string,
    @Param("id") id: string,
  ) {
    return this.resourcesService.delete(category, resource, id);
  }
}
