import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ResourcesController } from "./resources.controller";
import { PublicResourcesController } from "./public-resources.controller";
import { ResourcesService } from "./resources.service";
import {
  resourceControllers,
  ResourceRegistryController,
} from "./resource.controllers";
import { ResourceAccessGuard } from "./resource-access.guard";

@Module({
  imports: [AuthModule],
  controllers: [
    ResourcesController,
    PublicResourcesController,
    ResourceRegistryController,
    ...resourceControllers,
  ],
  providers: [ResourcesService, ResourceAccessGuard],
  exports: [ResourcesService],
})
export class ResourcesModule {}
