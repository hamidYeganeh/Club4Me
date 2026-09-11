import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import { AppError } from "../../common/errors/app.exception";
import { parse } from "../../lib/validate";
import { CreateResourceDto, UpdateResourceDto } from "./dto/resource.dto";
import { ResourcesService } from "./resources.service";
import {
  resourcePath,
  serverResourceDefinitions,
  type ServerResourceDefinition,
} from "./resources.registry";
import {
  ResourceAccessGuard,
  RESOURCE_PUBLIC_OPTIONS,
} from "./resource-access.guard";

// Options are explicitly public reference data. Editorial configuration and
// moderation-only reasons remain administrator-only, including options reads.
export function hasPublicOptions(
  definition: ServerResourceDefinition,
): boolean {
  return (
    ["sports", "clubs", "facilities", "location", "classes"].includes(
      definition.category,
    ) ||
    ["cancellation_reasons", "report_reasons", "search_keywords"].includes(
      definition.key,
    )
  );
}

function makeResourceController(definition: ServerResourceDefinition) {
  const { category, segment } = definition;
  @Controller(`api/v1/${resourcePath(definition)}`)
  @SetMetadata(RESOURCE_PUBLIC_OPTIONS, hasPublicOptions(definition))
  @UseGuards(ResourceAccessGuard)
  class ResourceController {
    constructor(private readonly resources: ResourcesService) {}

    @Get()
    list(@Query() query: Record<string, string | undefined>) {
      assertAction(query.action, [undefined, "list", "options"]);
      // Only the already-public province options gain discovery counts.
      // ResourceAccessGuard and all other resource routes keep their existing policy.
      if (
        category === "location" &&
        segment === "province" &&
        query.action === "options"
      ) {
        return this.resources.listPublic(category, segment, query);
      }
      return this.resources.list(category, segment, {
        ...query,
        ...(query.action === "options" ? { isActive: "true" } : {}),
      });
    }

    @Get(":id")
    async get(@Param("id") id: string, @Query("action") action?: string) {
      assertAction(action, [undefined, "get", "options"]);
      const result = await this.resources.get(category, segment, id);
      if (action === "options" && !result.isActive)
        throw new AppError(404, "RESOURCE_NOT_FOUND", "Resource not found");
      return result;
    }

    @Post()
    create(@Body() body: unknown, @Query("action") action?: string) {
      assertAction(action, [undefined, "create", "seed"]);
      if (action === "seed") return this.resources.seed(category, segment);
      return this.resources.create(
        category,
        segment,
        parse(CreateResourceDto.schema, body),
      );
    }

    @Patch(":id")
    update(
      @Param("id") id: string,
      @Body() body: unknown,
      @Query("action") action?: string,
    ) {
      assertAction(action, [undefined, "update", "activate", "deactivate"]);
      if (action === "activate" || action === "deactivate")
        return this.resources.update(category, segment, id, {
          isActive: action === "activate",
        });
      return this.resources.update(
        category,
        segment,
        id,
        parse(UpdateResourceDto.schema, body),
      );
    }

    @Delete(":id")
    remove(@Param("id") id: string, @Query("action") action?: string) {
      assertAction(action, [undefined, "delete"]);
      return this.resources.delete(category, segment, id);
    }
  }
  Object.defineProperty(ResourceController, "name", {
    value: `Resource_${definition.key}_Controller`,
  });
  return ResourceController;
}

function assertAction(
  action: string | undefined,
  allowed: Array<string | undefined>,
) {
  if (!allowed.includes(action))
    throw new AppError(
      400,
      "INVALID_RESOURCE_ACTION",
      "Action is not supported for this HTTP method",
    );
}

// Concrete routes avoid capturing unrelated /discovery, /clubs or /commerce APIs.
export const resourceControllers = serverResourceDefinitions.map(
  makeResourceController,
);

@Controller("api/v1/resources/registry")
@UseGuards(ResourceAccessGuard)
export class ResourceRegistryController {
  constructor(private readonly resources: ResourcesService) {}
  @Get()
  list() {
    return {
      items: serverResourceDefinitions.map((definition) => ({
        domain: resourcePath(definition).split("/")[0],
        feature: definition.key,
        path: `/api/v1/${resourcePath(definition)}`,
      })),
    };
  }
  @Post()
  seed(@Query("action") action?: string) {
    assertAction(action, ["seed"]);
    return this.resources.seedAll();
  }
}
