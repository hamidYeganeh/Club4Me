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
import { Throttle } from "@nestjs/throttler";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import type { AuthTokenPayload } from "../auth/services/token.service";
import {
  GroupTelemetryDto,
  IdentifyTelemetryDto,
  TrackTelemetryDto,
} from "./dto/telemetry.dto";
import { TelemetryService } from "./telemetry.service";

@Controller("api/v1/telemetry")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class TelemetryController {
  constructor(private readonly telemetry: TelemetryService) {}

  @Post("identify")
  @HttpCode(HttpStatus.ACCEPTED)
  identify(
    @CurrentUser() actor: AuthTokenPayload,
    @Body() body: IdentifyTelemetryDto,
  ) {
    return this.telemetry.identify(actor, body);
  }

  @Post("groups")
  @HttpCode(HttpStatus.ACCEPTED)
  group(
    @CurrentUser() actor: AuthTokenPayload,
    @Body() body: GroupTelemetryDto,
  ) {
    return this.telemetry.group(actor, body);
  }

  @Post("events")
  @HttpCode(HttpStatus.ACCEPTED)
  track(
    @CurrentUser() actor: AuthTokenPayload,
    @Body() body: TrackTelemetryDto,
  ) {
    return this.telemetry.track(actor, body);
  }
}

@Controller("api/v1/admin/analytics")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminTelemetryController {
  constructor(private readonly telemetry: TelemetryService) {}

  @Get("product")
  product(@Query("days") days?: string) {
    return this.telemetry.productAnalytics(days);
  }
}
