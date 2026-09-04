import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ResourcesController } from "./resources.controller";
import { PublicResourcesController } from "./public-resources.controller";
import { ResourcesService } from "./resources.service";

@Module({
  imports: [AuthModule],
  controllers: [ResourcesController, PublicResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}
