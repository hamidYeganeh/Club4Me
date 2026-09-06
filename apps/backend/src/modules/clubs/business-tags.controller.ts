import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ResourcesService } from "../resources/resources.service";
import { CreateClubTagDto } from "./dto/create-club-tag.dto";

@Controller("api/v1/business/tags")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("owner")
export class BusinessTagsController {
  constructor(private readonly resources: ResourcesService) {}

  @Get()
  list(@Query() query: Record<string, string | undefined>) {
    return this.resources.list("clubs", "tag", {
      ...query,
      isActive: "true",
      limit: query.limit ?? "100",
    });
  }

  @Post()
  @Roles("admin")
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateClubTagDto) {
    const matches = await this.resources.list("clubs", "tag", {
      search: body.name,
      isActive: "true",
      limit: "100",
    });
    const normalizedName = normalizeTagName(body.name);
    const existing = matches.items.find(
      (item) => normalizeTagName(String(item.name ?? "")) === normalizedName,
    );

    return (
      existing ??
      this.resources.create("clubs", "tag", {
        name: body.name,
      })
    );
  }
}

function normalizeTagName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .toLocaleLowerCase("fa");
}
