import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module";
import { AppConfigModule } from "../../config/app-config.module";
import {
  ProductTelemetry,
  ProductTelemetrySchema,
} from "./schemas/product-telemetry.schema";
import {
  AdminTelemetryController,
  PublicTelemetryController,
  TelemetryController,
} from "./telemetry.controller";
import { TelemetryService } from "./telemetry.service";

@Module({
  imports: [
    AuthModule,
    AppConfigModule,
    MongooseModule.forFeature([
      { name: ProductTelemetry.name, schema: ProductTelemetrySchema },
    ]),
  ],
  controllers: [TelemetryController, PublicTelemetryController, AdminTelemetryController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
