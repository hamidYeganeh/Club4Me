import { Module } from "@nestjs/common";

import { AppConfigModule } from "../config/app-config.module";
import { DiscoveryHonoHost } from "./discovery-hono-host";
import { MongoBridge } from "./mongo-bridge";

@Module({
  imports: [AppConfigModule],
  providers: [MongoBridge, DiscoveryHonoHost],
})
export class DiscoveryModule {}
