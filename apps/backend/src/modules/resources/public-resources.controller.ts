import { Controller, Get, Param, Query } from "@nestjs/common";

import { AppError } from "../../common/errors/app.exception";
import { ResourcesService } from "./resources.service";

const PUBLIC_RESOURCES = new Set([
  "sports/sport",
  "sports/club-type",
  "sports/coach-type",
  "sports/class-type",
  "sports/coach-specialty",
  "sports/skill-level",
  "facilities/amenity",
  "facilities/equipment",
  "location/country",
  "location/province",
  "location/city",
  "location/district",
  "location/city-region",
  "commerce/cancellation-reason",
]);

@Controller("api/v1/public/catalog")
export class PublicResourcesController {
  constructor(private readonly resources: ResourcesService) {}

  @Get(":category/:resource")
  list(
    @Param("category") category: string,
    @Param("resource") resource: string,
    @Query() query: Record<string, string | undefined>,
  ) {
    if (!PUBLIC_RESOURCES.has(`${category}/${resource}`)) {
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
