import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";

import { AppError } from "../../common/errors/app.exception";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ResourcesService } from "../resources/resources.service";

const ALLOWED = new Set([
  "sports/club-type",
  "sports/court-type",
  "facilities/amenity",
  "facilities/equipment",
  "location/country",
  "location/province",
  "location/city",
  "location/district",
  "location/city-region",
]);

@Controller("api/v1/business/catalog")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("owner")
export class BusinessCatalogController {
  constructor(private readonly resources: ResourcesService) {}

  @Get(":category/:resource")
  list(
    @Param("category") category: string,
    @Param("resource") resource: string,
    @Query() query: Record<string, string | undefined>,
  ) {
    if (!ALLOWED.has(`${category}/${resource}`)) {
      throw new AppError(
        404,
        "RESOURCE_TYPE_NOT_FOUND",
        "Resource type not found",
      );
    }
    return this.resources.list(category, resource, {
      ...query,
      isActive: "true",
      limit: query.limit ?? "100",
    });
  }
}
